const prisma = require("../config/db");

const createAccessRequest = async (req, res) => {
  try {
    const {
      reason,
      suggestion,
      projectId,
      requesterId,
    } = req.body;

    const request = await prisma.projectAccessRequest.create({
      data: {
        reason,
        suggestion,
        projectId,
        requesterId,
      },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create access request",
    });
  }
};


const getAccessRequests = async (req, res) => {
  try {
    const requests = await prisma.projectAccessRequest.findMany();

    res.status(200).json(requests);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch access requests",
    });
  }
};


const approveAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.projectAccessRequest.update({
      where: {
        id,
      },
      data: {
        status: "APPROVED",
      },
    });

    res.status(200).json(request);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to approve access request",
    });
  }
};


const rejectAccessRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.projectAccessRequest.update({
      where: {
        id,
      },
      data: {
        status: "REJECTED",
      },
    });

    res.status(200).json(request);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to reject access request",
    });
  }
};

module.exports = {
  createAccessRequest,
  getAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
};