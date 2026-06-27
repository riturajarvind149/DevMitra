const prisma = require("../config/db");
const { createNotification } = require("./notificationController");

// POST /connections/request/:userId
const sendConnectionRequest = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { userId: receiverId } = req.params;
    if (senderId === receiverId) return res.status(400).json({ message: "Cannot connect with yourself" });

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return res.status(404).json({ message: "User not found" });

    // Check if connection already exists in either direction
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
      },
    });
    if (existing) {
      return res.status(400).json({ message: `Connection already ${existing.status.toLowerCase()}` });
    }

    const connection = await prisma.connection.create({
      data: { senderId, receiverId, status: "PENDING" },
      include: { receiver: { select: { id: true, username: true, avatarUrl: true } } },
    });

    await createNotification({
      type: "CONNECTION_REQUEST",
      message: `${req.user.username} sent you a connection request`,
      receiverId,
      senderId,
      link: `/connections`,
    });

    res.status(201).json(connection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send connection request" });
  }
};

// PUT /connections/accept/:requestId
const acceptConnection = async (req, res) => {
  try {
    const { requestId } = req.params;
    const connection = await prisma.connection.findUnique({ where: { id: requestId }, include: { sender: true } });
    if (!connection) return res.status(404).json({ message: "Request not found" });
    if (connection.receiverId !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    if (connection.status !== "PENDING") return res.status(400).json({ message: "Request already processed" });

    const updated = await prisma.connection.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });

    await createNotification({
      type: "CONNECTION_ACCEPTED",
      message: `${req.user.username} accepted your connection request`,
      receiverId: connection.senderId,
      senderId: req.user.id,
      link: `/users/${req.user.id}`,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to accept connection" });
  }
};

// PUT /connections/reject/:requestId
const rejectConnection = async (req, res) => {
  try {
    const { requestId } = req.params;
    const connection = await prisma.connection.findUnique({ where: { id: requestId } });
    if (!connection) return res.status(404).json({ message: "Request not found" });
    if (connection.receiverId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const updated = await prisma.connection.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reject connection" });
  }
};

// DELETE /connections/:userId  — remove connection
const removeConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: otherId } = req.params;
    await prisma.connection.deleteMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
    });
    res.status(200).json({ message: "Connection removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to remove connection" });
  }
};

// GET /connections/requests — incoming pending requests
const getConnectionRequests = async (req, res) => {
  try {
    const requests = await prisma.connection.findMany({
      where: { receiverId: req.user.id, status: "PENDING" },
      include: { sender: { select: { id: true, username: true, avatarUrl: true, bio: true, skills: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch requests" });
  }
};

// GET /connections — accepted connections
const getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const connections = await prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender:   { select: { id: true, username: true, avatarUrl: true, bio: true, skills: true, githubUsername: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true, bio: true, skills: true, githubUsername: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Get my connection IDs for mutual calculation
    const myConnectedIds = new Set(
      connections.map(c => c.senderId === userId ? c.receiverId : c.senderId)
    );

    // Return the "other" person for each connection + mutual count
    const result = await Promise.all(connections.map(async (c) => {
      const other = c.senderId === userId ? c.receiver : c.sender;

      // Mutual connections = people connected to BOTH me and the other person
      const otherConns = await prisma.connection.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ senderId: other.id }, { receiverId: other.id }],
        },
        select: { senderId: true, receiverId: true },
      });
      const otherConnectedIds = new Set(
        otherConns.map(oc => oc.senderId === other.id ? oc.receiverId : oc.senderId)
      );
      // mutual = intersection of my connections and their connections (excluding each other)
      const mutualIds = [...myConnectedIds].filter(id => id !== other.id && otherConnectedIds.has(id));

      return {
        id: c.id,
        user: other,
        connectedAt: c.updatedAt,
        mutualCount: mutualIds.length,
      };
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch connections" });
  }
};

// GET /connections/status/:userId — get connection status with a specific user
const getConnectionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { userId: otherId } = req.params;
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: otherId },
          { senderId: otherId, receiverId: userId },
        ],
      },
    });
    if (!connection) return res.status(200).json({ status: "NONE", connectionId: null, isSender: false });
    res.status(200).json({
      status: connection.status,
      connectionId: connection.id,
      isSender: connection.senderId === userId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch connection status" });
  }
};

// GET /connections/counts/:userId — follower/following/connection counts
const getConnectionCounts = async (req, res) => {
  try {
    const { userId } = req.params;
    const [sent, received] = await Promise.all([
      prisma.connection.count({ where: { senderId: userId, status: "ACCEPTED" } }),
      prisma.connection.count({ where: { receiverId: userId, status: "ACCEPTED" } }),
    ]);
    res.status(200).json({ connections: sent + received, following: sent, followers: received });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch counts" });
  }
};

module.exports = {
  sendConnectionRequest, acceptConnection, rejectConnection, removeConnection,
  getConnectionRequests, getConnections, getConnectionStatus, getConnectionCounts,
};
