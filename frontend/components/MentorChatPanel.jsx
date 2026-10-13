"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { mentorChatAPI } from "@/lib/api";
import {
  CloseIcon,
  SendIcon,
  ChatIcon,
  PlusIcon,
  TrashIcon,
  CpuIcon,
  UserIcon,
  AlertTriangleIcon,
} from "@/components/icons";

export default function MentorChatPanel({
  isOpen,
  onClose,
  initialAnalysisId,
  initialMessage,
}) {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);

  // Resizable panel width state (320px min, 75vw max, persisted in localStorage)
  const [panelWidth, setPanelWidth] = useState(440);
  const isDragging = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("buildr_mentor_chat_width");
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

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "ew-resize";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
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
            localStorage.setItem("buildr_mentor_chat_width", current.toString());
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

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
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

  async function loadSessionMessages(sessionId) {
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

  async function createNewSession(analysisId) {
    try {
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
      loadSessions();
      return newSession.id;
    } catch {
      setError("Failed to create conversation.");
      return null;
    }
  }

  async function handleSendWithNewSession(message, analysisId) {
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

  async function sendMessageToSession(sessionId, content) {
    const userMsg = {
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

      if (fullText) {
        const assistantMsg = {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: fullText,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      setError(err.message || "Failed to send message.");
    } finally {
      setIsStreaming(false);
      setStreamingText("");
      loadSessions();
    }
  }

  async function handleDeleteSession(sessionId, e) {
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

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function renderContent(text) {
    const html = text
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="surface-base border border-subtle rounded-sm p-3 my-2 overflow-x-auto text-xs font-mono"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="surface-base border border-subtle px-1.5 py-0.5 rounded-sm text-amber-400 font-mono text-xs">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\n- /g, "\n• ")
      .replace(/\n(\d+)\. /g, "\n$1. ")
      .replace(/\n/g, "<br />");
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  }

  const [feedbackState, setFeedbackState] = useState({});

  async function handleFeedback(messageId, rating) {
    if (!activeSessionId) return;
    setFeedbackState((prev) => ({ ...prev, [messageId]: rating }));
    try {
      await mentorChatAPI.sendFeedback({
        sessionId: activeSessionId,
        messageId,
        rating,
      });
    } catch {
      // Ignore
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Panel Container */}
      <div
        style={{ width: `${panelWidth}px`, maxWidth: "80vw" }}
        className="relative h-full surface-card border-l border-subtle flex flex-col pointer-events-auto shadow-none select-text font-sans"
      >
        {/* Resizable Left Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
          className="absolute left-0 top-0 bottom-0 w-3 -ml-1.5 z-30 cursor-ew-resize hover:bg-amber-500/40 transition-colors group flex items-center justify-center pointer-events-auto"
          title="Drag to resize AI Assistant panel"
        >
          <div className="w-1 h-10 rounded-full bg-gray-600 group-hover:bg-amber-400 group-hover:scale-y-125 transition" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 surface-sidebar border-b border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-sm bg-amber-500/10 border border-amber-500/40 text-amber-500 flex items-center justify-center">
              <CpuIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold text-primary tracking-wide">AI ASSISTANT</h2>
              <p className="text-[10px] text-muted font-mono">Evidence-grounded code companion</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-1.5 rounded-sm text-muted hover:text-primary hover:bg-slate-200 dark:hover:bg-[#182130] transition"
              title="Chat history"
            >
              <ChatIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveSessionId(null);
                setMessages([]);
                setStreamingText("");
                setError(null);
              }}
              className="p-1.5 rounded-sm text-muted hover:text-primary hover:bg-slate-200 dark:hover:bg-[#182130] transition"
              title="New conversation"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm text-muted hover:text-primary hover:bg-slate-200 dark:hover:bg-[#182130] transition"
              title="Close panel"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* History sidebar overlay */}
        {showHistory && (
          <div className="absolute top-14 left-0 right-0 bottom-0 z-10 surface-card border-b border-subtle flex flex-col">
            <div className="px-4 py-3 surface-sidebar border-b border-subtle flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold text-primary">PAST SESSIONS</h3>
              <button onClick={() => setShowHistory(false)} className="text-muted hover:text-primary">
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {loadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-xs text-muted text-center py-8 font-mono">No previous sessions</p>
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
                    className={`w-full text-left px-3 py-2 rounded-sm text-xs group flex items-center justify-between transition cursor-pointer border ${
                      activeSessionId === s.id
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/40"
                        : "border-transparent text-secondary hover:bg-slate-200 dark:hover:bg-[#182130] hover:text-primary"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{s.title || "New session"}</p>
                      <p className="text-[10px] text-muted mt-0.5 font-mono">
                        {s._count?.messages || 0} messages • {new Date(s.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-400 transition"
                      title="Delete session"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
          {/* Welcome state */}
          {messages.length === 0 && !isStreaming && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
              <div className="w-12 h-12 rounded-sm surface-raised border border-subtle flex items-center justify-center text-amber-500">
                <CpuIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono text-primary mb-1">BuildR AI Assistant</h3>
                <p className="text-xs text-muted max-w-xs leading-relaxed">
                  Query repository analytics, diagnose code quality benchmarks, or get targeted architecture recommendations.
                </p>
              </div>
              <div className="space-y-2 w-full max-w-xs">
                {[
                  "Analyze my repositories and tell me what topics to study to level up",
                  "What improvements can I make across BuildR and my other projects?",
                  "Generate a custom AI Agent prompt to fix architecture gaps in my code",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion);
                      inputRef.current?.focus();
                    }}
                    className="w-full text-left px-3 py-2 rounded-sm surface-raised border border-subtle text-xs text-secondary hover:border-amber-500/50 hover:text-primary transition font-mono"
                  >
                    &gt; {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-6 h-6 rounded-sm bg-amber-500/10 border border-amber-500/40 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CpuIcon className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex flex-col max-w-[85%]">
                <div
                  className={`px-3.5 py-2.5 rounded-sm text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-amber-500 text-gray-950 font-medium"
                      : "surface-raised border border-subtle text-primary"
                  }`}
                >
                  {msg.role === "assistant" ? renderContent(msg.content) : msg.content}
                </div>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <button
                      onClick={() => handleFeedback(msg.id, "UP")}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm transition ${
                        feedbackState[msg.id] === "UP"
                          ? "text-emerald-400 bg-emerald-950/40 border border-emerald-800"
                          : "text-muted hover:text-primary"
                      }`}
                      title="Helpful answer"
                    >
                      + Helpful
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, "DOWN")}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm transition ${
                        feedbackState[msg.id] === "DOWN"
                          ? "text-red-400 bg-red-950/40 border border-red-800"
                          : "text-muted hover:text-primary"
                      }`}
                      title="Needs improvement"
                    >
                      - Needs Improvement
                    </button>
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-6 h-6 rounded-sm surface-raised border border-subtle text-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {/* Streaming response */}
          {isStreaming && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-6 h-6 rounded-sm bg-amber-500/10 border border-amber-500/40 text-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <CpuIcon className="w-3.5 h-3.5" />
              </div>
              <div className="max-w-[85%] px-3.5 py-2.5 rounded-sm surface-raised border border-subtle text-xs text-primary leading-relaxed">
                {streamingText ? (
                  renderContent(streamingText)
                ) : (
                  <div className="flex items-center gap-2 text-muted font-mono text-xs">
                    <div className="w-3 h-3 border border-amber-500 border-t-transparent rounded-full animate-spin" />
                    <span>Processing response...</span>
                  </div>
                )}
                <span className="inline-block w-1.5 h-3.5 bg-amber-400 ml-0.5 animate-pulse" />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-sm bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono">
              <AlertTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-3.5 py-3 surface-sidebar border-t border-subtle">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your GitHub metrics, architecture..."
              rows={1}
              className="flex-1 surface-input border border-subtle rounded-sm px-3 py-2 text-xs text-primary placeholder:text-muted focus:outline-none focus:border-amber-500 resize-none transition max-h-32 font-mono"
              style={{ minHeight: "36px" }}
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-2 rounded-sm bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              title="Send message"
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <SendIcon className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[9px] text-muted mt-1.5 text-center font-mono">
            Responses are grounded in your actual GitHub analysis data.
          </p>
        </div>
      </div>
    </div>
  );
}
