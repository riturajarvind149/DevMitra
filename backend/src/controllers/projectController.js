const prisma = require("../config/db");
const { logActivity } = require("../utils/activityLogger");

const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      deployedUrl,
      githubRepoUrl,
      tags,
    } = req.body;

    // Validate required fields
    if (!title || !description || !deployedUrl) {
      return res.status(400).json({
        message: "Title, description, and deployed URL are required",
      });
    }

    // Validate tags if provided
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({
        message: "Tags must be an array",
      });
    }

    const ownerId = req.user.id;

    // Create project and owner membership in a transaction
    const project = await prisma.$transaction(async (tx) => {
      const newProject = await tx.project.create({
        data: {
          title,
          description,
          deployedUrl,
          githubRepoUrl,
          tags: tags || [],
          ownerId,
        },
      });

      // Automatically add owner as a project member with OWNER role
      await tx.projectMember.create({
        data: {
          projectId: newProject.id,
          userId: ownerId,
          role: "OWNER",
        },
      });

      return newProject;
    });

    // Log activity
    await logActivity(
      "PROJECT_CREATED",
      `${req.user.username} created project "${title}"`,
      project.id,
      req.user.id,
      { title, tags: tags || [] }
    );

    res.status(201).json(project);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create project",
    });
  }
};


// GET /projects
// Get all projects with owner info and member count
// Supports search and filtering via query params
// Query params:
//   - search: search in title and description
//   - owner: filter by owner username
//   - limit: number of results (default 50, max 100)
//   - offset: skip N results for pagination
const getProjects = async (req, res) => {
  try {
    const { search, owner, limit = 50, offset = 0 } = req.query;

    // Build where clause dynamically
    const where = {};

    // Search in title and description
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Filter by owner username
    if (owner) {
      where.owner = {
        username: {
          contains: owner,
          mode: "insensitive",
        },
      };
    }

    // Parse pagination params
    const take = Math.min(parseInt(limit) || 50, 100);
    const skip = parseInt(offset) || 0;

    // Get total count for pagination metadata
    const total = await prisma.project.count({ where });

    const projects = await prisma.project.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            githubUsername: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take,
      skip,
    });

    res.status(200).json({
      projects,
      pagination: {
        total,
        limit: take,
        offset: skip,
        hasMore: skip + take < total,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};


// GET /projects/:id
// Get project by ID with owner info, members, and access requests
const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: {
        id,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            githubUsername: true,
            githubProfileUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
                githubUsername: true,
              },
            },
          },
        },
        _count: {
          select: {
            accessRequests: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch project",
    });
  }
};


// GET /projects/my
// Get all projects owned by the logged-in user
// Auth: required
const getMyProjects = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const projects = await prisma.project.findMany({
      where: {
        ownerId,
      },
      include: {
        _count: {
          select: {
            members: true,
            accessRequests: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json(projects);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch your projects",
    });
  }
};


const updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (existingProject.ownerId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const {
      title,
      description,
      deployedUrl,
      githubRepoUrl,
      tags,
    } = req.body;

    // Validate at least one field is provided
    if (!title && !description && !deployedUrl && !githubRepoUrl && !tags) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    // Validate tags if provided
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({
        message: "Tags must be an array",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (deployedUrl) updateData.deployedUrl = deployedUrl;
    if (githubRepoUrl !== undefined) updateData.githubRepoUrl = githubRepoUrl;
    if (tags !== undefined) updateData.tags = tags;

    const project = await prisma.project.update({
      where: {
        id,
      },
      data: updateData,
    });

    // Log activity
    await logActivity(
      "PROJECT_UPDATED",
      `${req.user.username} updated project "${project.title}"`,
      project.id,
      req.user.id,
      { updatedFields: Object.keys(updateData) }
    );

    res.status(200).json(project);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to update project",
    });
  }
};


const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (existingProject.ownerId !== req.user.id) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    await prisma.project.delete({
      where: {
        id,
      },
    });

    // Log activity
    await logActivity(
      "PROJECT_DELETED",
      `${req.user.username} deleted project "${existingProject.title}"`,
      null,
      req.user.id,
      { projectTitle: existingProject.title }
    );

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to delete project",
    });
  }
};

module.exports = {
  createProject,
  getProjects,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
};