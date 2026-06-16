const prisma = require("../config/db");

const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      deployedUrl,
      githubRepoUrl,
    } = req.body;

    // Validate required fields
    if (!title || !description || !deployedUrl) {
      return res.status(400).json({
        message: "Title, description, and deployed URL are required",
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
const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
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
    });

    res.status(200).json(projects);
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
    } = req.body;

    // Validate at least one field is provided
    if (!title && !description && !deployedUrl && !githubRepoUrl) {
      return res.status(400).json({
        message: "At least one field is required to update",
      });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (deployedUrl) updateData.deployedUrl = deployedUrl;
    if (githubRepoUrl !== undefined) updateData.githubRepoUrl = githubRepoUrl;

    const project = await prisma.project.update({
      where: {
        id,
      },
      data: updateData,
    });

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