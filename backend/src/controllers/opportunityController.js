const prisma = require("../config/db");
const { createNotification } = require("./notificationController");

const OPPORTUNITY_INCLUDE = {
  owner: { select: { id:true, username:true, avatarUrl:true, skills:true } },
  project: { select: { id:true, title:true } },
  _count: { select: { applications: true } },
};

// POST /opportunities
const createOpportunity = async (req, res) => {
  try {
    const { title, role, description, requiredSkills, duration, budget, isRemote, projectId } = req.body;
    if (!title || !role || !description) return res.status(400).json({ message: "title, role, description required" });

    const opp = await prisma.opportunity.create({
      data: {
        title, role, description,
        requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
        duration, budget,
        isRemote: isRemote !== false,
        projectId: projectId || null,
        ownerId: req.user.id,
        status: "OPEN",
      },
      include: OPPORTUNITY_INCLUDE,
    });
    res.status(201).json(opp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create opportunity" });
  }
};

// GET /opportunities
const getOpportunities = async (req, res) => {
  try {
    const { search, skill, remote, limit = 50, offset = 0 } = req.query;
    const where = { status: "OPEN" };
    if (search) where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { role: { contains: search, mode: "insensitive" } },
    ];
    if (skill) where.requiredSkills = { has: skill };
    if (remote === "true") where.isRemote = true;

    const take = Math.min(parseInt(limit)||50, 100);
    const skip = parseInt(offset)||0;
    const [total, opps] = await Promise.all([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({ where, include: OPPORTUNITY_INCLUDE, orderBy: { createdAt: "desc" }, take, skip }),
    ]);
    res.status(200).json({ opportunities: opps, pagination: { total, limit: take, offset: skip, hasMore: skip + take < total } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch opportunities" });
  }
};

// GET /opportunities/:id
const getOpportunityById = async (req, res) => {
  try {
    const opp = await prisma.opportunity.findUnique({
      where: { id: req.params.id },
      include: { ...OPPORTUNITY_INCLUDE, applications: { include: { applicant: { select: { id:true, username:true, avatarUrl:true, skills:true } } }, orderBy: { createdAt: "desc" } } },
    });
    if (!opp) return res.status(404).json({ message: "Opportunity not found" });
    res.status(200).json(opp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch opportunity" });
  }
};

// GET /opportunities/mine
const getMyOpportunities = async (req, res) => {
  try {
    const opps = await prisma.opportunity.findMany({
      where: { ownerId: req.user.id },
      include: OPPORTUNITY_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(opps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch your opportunities" });
  }
};

// PUT /opportunities/:id
const updateOpportunity = async (req, res) => {
  try {
    const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
    if (!opp) return res.status(404).json({ message: "Not found" });
    if (opp.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    const updated = await prisma.opportunity.update({ where: { id: req.params.id }, data: req.body, include: OPPORTUNITY_INCLUDE });
    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update opportunity" });
  }
};

// DELETE /opportunities/:id
const deleteOpportunity = async (req, res) => {
  try {
    const opp = await prisma.opportunity.findUnique({ where: { id: req.params.id } });
    if (!opp) return res.status(404).json({ message: "Not found" });
    if (opp.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await prisma.opportunity.delete({ where: { id: req.params.id } });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete opportunity" });
  }
};

// POST /opportunities/:id/apply
const applyToOpportunity = async (req, res) => {
  try {
    const { id } = req.params;
    const { experience, githubUrl, portfolioUrl, message } = req.body;
    if (!experience) return res.status(400).json({ message: "Experience is required" });

    const opp = await prisma.opportunity.findUnique({ where: { id }, include: { owner: true } });
    if (!opp) return res.status(404).json({ message: "Not found" });
    if (opp.ownerId === req.user.id) return res.status(400).json({ message: "Cannot apply to your own opportunity" });
    if (opp.status !== "OPEN") return res.status(400).json({ message: "Opportunity is not accepting applications" });

    const existing = await prisma.opportunityApplication.findUnique({
      where: { opportunityId_applicantId: { opportunityId: id, applicantId: req.user.id } },
    });
    if (existing) return res.status(400).json({ message: "Already applied" });

    const application = await prisma.opportunityApplication.create({
      data: { opportunityId: id, applicantId: req.user.id, experience, githubUrl, portfolioUrl, message },
      include: { applicant: { select: { id:true, username:true, avatarUrl:true } } },
    });

    await createNotification({
      type: "OPPORTUNITY_APPLICATION",
      message: `${req.user.username} applied for your "${opp.title}" opportunity`,
      receiverId: opp.ownerId,
      senderId: req.user.id,
      link: `/opportunities/${id}`,
    });

    res.status(201).json(application);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to apply" });
  }
};

// PUT /opportunities/:id/applications/:appId/approve
const approveApplication = async (req, res) => {
  try {
    const { id, appId } = req.params;
    const opp = await prisma.opportunity.findUnique({ where: { id } });
    if (!opp || opp.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const app = await prisma.opportunityApplication.update({
      where: { id: appId },
      data: { status: "APPROVED" },
      include: { applicant: { select: { id:true, username:true } } },
    });

    await createNotification({
      type: "OPPORTUNITY_APPROVED",
      message: `Your application for "${opp.title}" was approved!`,
      receiverId: app.applicantId,
      senderId: req.user.id,
      link: `/opportunities/${id}`,
    });

    res.status(200).json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve application" });
  }
};

// PUT /opportunities/:id/applications/:appId/reject
const rejectApplication = async (req, res) => {
  try {
    const { id, appId } = req.params;
    const opp = await prisma.opportunity.findUnique({ where: { id } });
    if (!opp || opp.ownerId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const app = await prisma.opportunityApplication.update({ where: { id: appId }, data: { status: "REJECTED" } });
    res.status(200).json(app);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reject application" });
  }
};

// GET /opportunities/:id/check-applied
const checkApplied = async (req, res) => {
  try {
    const app = await prisma.opportunityApplication.findUnique({
      where: { opportunityId_applicantId: { opportunityId: req.params.id, applicantId: req.user.id } },
    });
    res.status(200).json({ applied: !!app, application: app || null });
  } catch (error) {
    res.status(500).json({ message: "Failed to check" });
  }
};

module.exports = { createOpportunity, getOpportunities, getOpportunityById, getMyOpportunities, updateOpportunity, deleteOpportunity, applyToOpportunity, approveApplication, rejectApplication, checkApplied };
