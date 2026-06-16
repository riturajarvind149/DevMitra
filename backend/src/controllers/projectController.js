const prisma = require("../config/db");

const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      deployedUrl,
      githubRepoUrl,
    } = req.body;

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


const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany();

    res.status(200).json(projects);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
};


const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: {
        id,
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

    const project = await prisma.project.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        deployedUrl,
        githubRepoUrl,
      },
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
  getProjectById,
  updateProject,
  deleteProject,
};