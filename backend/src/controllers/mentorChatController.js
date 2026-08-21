const prisma = require("../config/db");
const {
  streamChatResponse,
  generateSessionTitle,
  MAX_MESSAGES_PER_SESSION,
} = require("../services/ai/mentorChatEngine");

/**
 * POST /ai-mentor/chat/session
 * Body: { analysisId? }
 * Creates a new MentorChatSession.
 */
const createSession = async (req, res) => {
  try {
    const { analysisId } = req.body;

    // Validate analysisId if provided
    if (analysisId) {
      const analysis = await prisma.githubAnalysis.findUnique({
        where: { id: analysisId },
        select: { id: true, status: true },
      });
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
    }

    const session = await prisma.mentorChatSession.create({
      data: {
        userId: req.user.id,
        analysisId: analysisId || null,
      },
    });

    return res.status(201).json(session);
  } catch (error) {
    console.error("Error creating chat session:", error);
    return res.status(500).json({ message: "Failed to create chat session" });
  }
};

/**
 * GET /ai-mentor/chat/sessions
 * List the authenticated user's past chat sessions.
 */
const listSessions = async (req, res) => {
  try {
    const sessions = await prisma.mentorChatSession.findMany({
      where: { userId: req.user.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: {
        _count: { select: { messages: true } },
      },
    });

    return res.status(200).json(sessions);
  } catch (error) {
    console.error("Error listing chat sessions:", error);
    return res.status(500).json({ message: "Failed to list chat sessions" });
  }
};

/**
 * GET /ai-mentor/chat/session/:id
 * Full message history for one session.
 */
const getSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.mentorChatSession.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Only allow owner to view
    if (session.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching chat session:", error);
    return res.status(500).json({ message: "Failed to fetch chat session" });
  }
};

/**
 * POST /ai-mentor/chat/session/:id/message
 * Body: { content }
 * Sends a user message and streams the AI reply via SSE.
 */
const sendMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const session = await prisma.mentorChatSession.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Save the user message
    await prisma.mentorChatMessage.create({
      data: {
        sessionId: id,
        role: "user",
        content: content.trim(),
      },
    });

    // Auto-generate title from first message
    if (!session.title) {
      const title = generateSessionTitle(content.trim());
      await prisma.mentorChatSession.update({
        where: { id },
        data: { title },
      });
    }

    // Touch updatedAt
    await prisma.mentorChatSession.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Set up SSE headers with cloud proxy optimizations
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    let fullResponse = "";

    try {
      fullResponse = await streamChatResponse(session, content.trim(), (chunk) => {
        // Send each text chunk as an SSE event
        res.write(`data: ${JSON.stringify({ type: "chunk", text: chunk })}\n\n`);
      });
    } catch (chatError) {
      // Handle session limit or rate limit error gracefully
      if (chatError.message?.startsWith("SESSION_LIMIT:")) {
        const limitMsg = chatError.message.replace("SESSION_LIMIT: ", "");
        res.write(`data: ${JSON.stringify({ type: "error", message: limitMsg })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      }
      if (chatError.message?.startsWith("RATE_LIMIT:")) {
        const rateMsg = chatError.message.replace("RATE_LIMIT: ", "");
        res.write(`data: ${JSON.stringify({ type: "error", message: rateMsg })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();
        return;
      }
      throw chatError;
    }

    // Save the assistant response
    if (fullResponse) {
      await prisma.mentorChatMessage.create({
        data: {
          sessionId: id,
          role: "assistant",
          content: fullResponse,
        },
      });
    }

    // Signal completion
    res.write(`data: ${JSON.stringify({ type: "done", fullText: fullResponse })}\n\n`);
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error("Error in chat message:", error);

    // If headers haven't been sent yet, return JSON error
    if (!res.headersSent) {
      return res.status(500).json({
        message: error.message || "Failed to process chat message",
      });
    }

    // If streaming already started, send error via SSE
    try {
      res.write(`data: ${JSON.stringify({ type: "error", message: "An error occurred while generating the response." })}\n\n`);
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (_) {
      // Connection already closed
    }
  }
};

/**
 * DELETE /ai-mentor/chat/session/:id
 */
const deleteSession = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.mentorChatSession.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await prisma.mentorChatSession.delete({ where: { id } });

    return res.status(200).json({ message: "Session deleted" });
  } catch (error) {
    console.error("Error deleting chat session:", error);
    return res.status(500).json({ message: "Failed to delete chat session" });
  }
};

/**
 * POST /ai-mentor/chat/feedback
 * Body: { sessionId, messageId?, rating: "UP" | "DOWN", reason? }
 */
const recordFeedback = async (req, res) => {
  try {
    const { sessionId, messageId, rating, reason } = req.body;

    if (!sessionId || !rating || !["UP", "DOWN"].includes(rating)) {
      return res.status(400).json({ message: "Invalid feedback parameters" });
    }

    const feedback = await prisma.chatFeedback.create({
      data: {
        sessionId,
        messageId: messageId || null,
        userId: req.user.id,
        rating,
        reason: reason ? String(reason).slice(0, 1000) : null,
      },
    });

    return res.status(201).json(feedback);
  } catch (error) {
    console.error("Error recording feedback:", error);
    return res.status(500).json({ message: "Failed to record feedback" });
  }
};

module.exports = {
  createSession,
  listSessions,
  getSession,
  sendMessage,
  deleteSession,
  recordFeedback,
};

