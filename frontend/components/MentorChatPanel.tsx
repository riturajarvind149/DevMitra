"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { mentorChatAPI } from "@/lib/api";
import {
  X,
  Send,
  Sparkles,
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  Bot,
  User as UserIcon,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Check,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string | null;
  analysisId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { messages: number };
}

interface MentorChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialAnalysisId?: string | null;
  initialMessage?: string | null;
}

export default function MentorChatPanel({
  isOpen,
  onClose,
  initialAnalysisId,
  initialMessage,
}: MentorChatPanelProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resizable panel width state (320px min, 75vw max, persisted in localStorage)
  const [panelWidth, setPanelWidth] = useState(440);
  const isDragging = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("devmitra_mentor_chat_width");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 320 && parsed <= window.innerWidth * 0.8) {
          setPanelWidth(parsed);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.min(Math.max(newWidth, 320), Math.floor(window.innerWidth * 0.75));
      setPanelWidth(clamped);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        setPanelWidth((current) => {
          try {
            localStorage.setItem("devmitra_mentor_chat_width", current.toString());
          } catch {}
          return current;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoSent = useRef(false);
  const pathname = usePathname();

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  // Load sessions when panel opens
  useEffect(() => {
    if (isOpen) {
      loadSessions();
    }
  }, [isOpen]);

  // Handle initialMessage (from "Ask AI why" buttons)
  useEffect(() => {
    if (isOpen && initialMessage && !hasAutoSent.current) {
      hasAutoSent.current = true;
      handleSendWithNewSession(initialMessage, initialAnalysisId || undefined);
    }
  }, [isOpen, initialMessage, initialAnalysisId]);

  // Reset auto-send flag when panel closes
  useEffect(() => {
    if (!isOpen) {
      hasAutoSent.current = false;
    }
  }, [isOpen]);

  async function loadSessions() {
    setLoadingSessions(true);
    try {
      const res = await mentorChatAPI.listSessions();
      setSessions(res.data || []);
    } catch {
      // Ignore
    } finally {
      setLoadingSessions(false);
    }
  }

  async function loadSessionMessages(sessionId: string) {
    setLoadingMessages(true);
    setError(null);
    try {
      const res = await mentorChatAPI.getSession(sessionId);
      setMessages(res.data.messages || []);
      setActiveSessionId(sessionId);
      setShowHistory(false);
    } catch {
      setError("Failed to load conversation.");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function createNewSession(analysisId?: string) {
    try {
      // Auto-detect analysisId from current URL if on a mentor report page
      let effectiveAnalysisId = analysisId;
      if (!effectiveAnalysisId) {
        const mentorMatch = pathname.match(/\/mentor\/([^/]+)/);
        if (mentorMatch) {
          effectiveAnalysisId = mentorMatch[1];
        }
      }

      const res = await mentorChatAPI.createSession(effectiveAnalysisId);
      const newSession = res.data;
      setActiveSessionId(newSession.id);
      setMessages([]);
      setStreamingText("");
      setError(null);
      loadSessions(); // Refresh sidebar
      return newSession.id;
    } catch {
      setError("Failed to create conversation.");
      return null;
    }
  }

  async function handleSendWithNewSession(message: string, analysisId?: string) {
    const sessionId = await createNewSession(analysisId);
    if (sessionId) {
      await sendMessageToSession(sessionId, message);
    }
  }

  async function handleSend() {
    if (!input.trim() || isStreaming) return;

    const message = input.trim();
    setInput("");

    if (!activeSessionId) {
      await handleSendWithNewSession(message);
    } else {
      await sendMessageToSession(activeSessionId, message);
    }
  }

  async function sendMessageToSession(sessionId: string, content: string) {
    // Add user message to UI immediately
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText("");
    setError(null);

    try {
      let fullText = "";
      for await (const event of mentorChatAPI.sendMessage(sessionId, content)) {
        if (event.type === "chunk") {
          fullText += event.text;
          setStreamingText(fullText);
        } else if (event.type === "done") {
          fullText = event.fullText || fullText;
        } else if (event.type === "error") {
          setError(event.message);
        }
      }

      // Add assistant message
      if (fullText) {
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send message.");
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      loadSessions(); // Refresh to get updated titles
    }
  }

  async function handleDeleteSession(sessionId: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await mentorChatAPI.deleteSession(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {
      // Ignore
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Simple markdown rendering for assistant messages
  function renderContent(text: string) {
    // Convert bold, code blocks, bullet lists
    let html = text
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-950 border border-gray-800 rounded-xl p-3 my-2 overflow-x-auto text-xs"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1.5 py-0.5 rounded text-indigo-300 text-xs">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\n- /g, "\n• ")
      .replace(/\n(\d+)\. /g, "\n$1. ")
      .replace(/\n/g, "<br />");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const [feedbackState, setFeedbackState] = useState<Record<string, "UP" | "DOWN">>({});

  async function handleFeedback(messageId: string, rating: "UP" | "DOWN") {
    if (!activeSessionId) return;
    setFeedbackState((prev) => ({ ...prev, [messageId]: rating }));
    try {
      await mentorChatAPI.sendFeedback({
        sessionId: activeSessionId,
        messageId,
        rating,
      });
    } catch {
      // Ignore background feedback failure
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel Container with dynamic width & resizable handle */}
      <div
        style={{ width: `${panelWidth}px`, maxWidth: "80vw" }}
        className="relative h-full bg-gray-950 border-l border-gray-800 flex flex-col pointer-events-auto shadow-2xl animate-slide-in-right select-text"
      >
        {/* Resizable Left Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 z-30 cursor-ew-resize hover:bg-indigo-500/40 transition-colors group flex items-center justify-center pointer-events-auto"
          title="Drag to resize AI Mentor chat panel"
        >
          <div className="w-1 h-10 rounded-full bg-gray-700/60 group-hover:bg-indigo-400 group-hover:scale-y-125 transition" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Mentor</h2>
              <p className="text-[10px] text-gray-500">Evidence-grounded engineering coach</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              title="Chat history"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveSessionId(null);
                setMessages([]);
                setStreamingText("");
                setError(null);
              }}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
              title="New conversation"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History sidebar overlay */}
        {showHistory && (
          <div className="absolute top-16 left-0 right-0 bottom-0 z-10 bg-gray-950/95 backdrop-blur-md flex flex-col">
            <div className="px-5 py-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Conversations</h3>
                <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No conversations yet</p>
              ) : (
                sessions.map((s) => (
                  <div
                    key={s.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => loadSessionMessages(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        loadSessionMessages(s.id);
                      }
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs group flex items-center justify-between transition cursor-pointer ${
                      activeSessionId === s.id
                        ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{s.title || "New conversation"}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {s._count?.messages || 0} messages • {new Date(s.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: "thin" }}>
          {/* Welcome state */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1">DevMitra AI Mentor</h3>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                  Ask me about your GitHub analysis scores, get improvement advice, or discuss your engineering career growth.
                </p>
              </div>
              <div className="space-y-2 w-full max-w-xs">
                {[
                  "Analyze my repositories and tell me what topics to study to level up",
                  "What improvements can I make across DevMitra and my other projects?",
                  "Generate a custom AI Agent prompt to fix infrastructure gaps in my code",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300 hover:border-indigo-500/40 hover:text-white transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className="flex flex-col max-w-[85%]">
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <button
                      onClick={() => handleFeedback(msg.id, "UP")}
                      className={`p-1 rounded transition ${
                        feedbackState[msg.id] === "UP"
                          ? "text-green-400 bg-green-950/40"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                      title="Helpful answer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, "DOWN")}
                      className={`p-1 rounded transition ${
                        feedbackState[msg.id] === "DOWN"
                          ? "text-red-400 bg-red-950/40"
                          : "text-gray-600 hover:text-gray-400"
                      }`}
                      title="Needs improvement"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                    {feedbackState[msg.id] && (
                      <span className="text-[10px] text-gray-500">Feedback recorded</span>
                    )}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming response */}
          {isStreaming && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[85%] px-4 py-3 rounded-2xl rounded-bl-md bg-gray-900 border border-gray-800 text-sm text-gray-200 leading-relaxed">
                {streamingText ? (
                  renderContent(streamingText)
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-xs">Thinking...</span>
                  </div>
                )}
                <span className="inline-block w-1.5 h-4 bg-indigo-400 ml-0.5 animate-pulse rounded-sm" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/90 backdrop-blur-md">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your scores, get advice..."
              rows={1}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none transition max-h-32"
              style={{ minHeight: "40px" }}
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 flex-shrink-0"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[9px] text-gray-600 mt-1.5 text-center">
            Responses are grounded in your actual GitHub analysis data. Not a general-purpose AI.
          </p>
        </div>
      </div>

      {/* Slide-in animation */}
      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </div>
  );
}
