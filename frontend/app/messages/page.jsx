"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Search, ArrowLeft, Plus, Edit, ExternalLink } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";

// Detects story reply/share format and renders card
// Detects "Check out this project: "TITLE" — URL" pattern and renders project card
function MessageBubble({ content, isMine }) {
  // Story reply: "📖 Replied to @USERNAME's story\n[story:URL]\nTEXT"
  const storyReplyMatch = content.match(/^📖 Replied to @(.+?)'s story\n\[story:(.+?)\]\n?([\s\S]*)$/);
  if (storyReplyMatch) {
    const [, username, mediaUrl, replyText] = storyReplyMatch;
    const isVid = mediaUrl.startsWith("data:video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl);
    return (
      <div className={`max-w-[260px] rounded-sm overflow-hidden border ${isMine ? "border-amber-500/40 surface-raised" : "border-subtle surface-card"}`}>
        <div className={`px-3 py-1.5 text-[10px] font-mono flex items-center gap-1.5 border-b border-subtle ${isMine ? "text-amber-500 surface-raised" : "text-muted surface-base"}`}>
          <span>📖</span>
          <span>Replied to <span className="font-semibold text-primary">@{username}</span>'s story</span>
        </div>
        <div className="relative mx-2 mt-2 rounded-sm overflow-hidden border border-subtle" style={{ height: 100 }}>
          {isVid
            ? <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
            : <img src={mediaUrl} alt="story" className="w-full h-full object-cover" />}
        </div>
        {replyText?.trim() && (
          <div className="px-3 py-2">
            <p className="text-xs text-primary leading-relaxed font-sans">{replyText.trim()}</p>
          </div>
        )}
      </div>
    );
  }

  // Story share: "📤 Shared a story by @USERNAME\n[story:URL]\nCAPTION"
  const storyShareMatch = content.match(/^📤 Shared a story by @(.+?)\n\[story:(.+?)\]\n?([\s\S]*)$/);
  if (storyShareMatch) {
    const [, username, mediaUrl, caption] = storyShareMatch;
    const isVid = mediaUrl.startsWith("data:video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mediaUrl);
    return (
      <div className={`max-w-[260px] rounded-sm overflow-hidden border ${isMine ? "border-amber-500/40 surface-raised" : "border-subtle surface-card"}`}>
        <div className={`px-3 py-1.5 text-[10px] font-mono flex items-center gap-1.5 border-b border-subtle ${isMine ? "text-amber-500 surface-raised" : "text-muted surface-base"}`}>
          <span>📤</span>
          <span>Story by <span className="font-semibold text-primary">@{username}</span></span>
        </div>
        <div className="relative mx-2 mt-2 rounded-sm overflow-hidden border border-subtle" style={{ height: 100 }}>
          {isVid
            ? <video src={mediaUrl} className="w-full h-full object-cover" muted playsInline />
            : <img src={mediaUrl} alt="story" className="w-full h-full object-cover" />}
        </div>
        {caption?.trim() && (
          <div className="px-3 py-2">
            <p className="text-xs text-primary leading-relaxed font-sans">{caption.trim()}</p>
          </div>
        )}
      </div>
    );
  }

  // Project share
  const projectMatch = content.match(/^Check out this project: "(.+)" — (https?:\/\/\S+)$/);

  if (projectMatch) {
    const [, title, url] = projectMatch;
    return (
      <Link
        href={url.startsWith("http://localhost") ? url.replace("http://localhost:3000", "") : url}
        className={`block max-w-[260px] rounded-sm overflow-hidden border transition hover:border-normal ${
          isMine ? "border-amber-500/40 surface-raised" : "border-subtle surface-card"
        }`}
      >
        {/* Card header */}
        <div className="px-3 py-1.5 flex items-center gap-2 border-b border-subtle surface-base">
          <div className="w-5 h-5 rounded-sm bg-amber-500 text-gray-950 flex items-center justify-center flex-shrink-0">
            <ExternalLink className="h-3 w-3" />
          </div>
          <span className="text-[10px] font-mono text-muted">Shared Project</span>
        </div>
        <div className="px-3 py-2">
          <p className="text-xs font-semibold font-mono text-primary leading-snug">{title}</p>
          <p className="text-[10px] font-mono text-amber-500 mt-1">Tap to view →</p>
        </div>
      </Link>
    );
  }

  return (
    <div className={`px-3.5 py-2 text-xs leading-relaxed font-sans rounded-sm ${
      isMine
        ? "bg-amber-500 text-gray-950 font-medium"
        : "surface-card text-primary border border-subtle"
    }`}>
      {content}
    </div>
  );
}

export default function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const messagesEndRef = useRef(null);

  const [selectedConv, setSelectedConv] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
   
  }, [selectedConv?.id]);

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => { const { data } = await messagesAPI.getConversations(); return data; },
    refetchInterval: 8000,
    staleTime: 5000,
  });

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ["messages", selectedConv?.id],
    queryFn: async () => {
      if (!selectedConv) return [];
      const { data } = await messagesAPI.getMessages(selectedConv.id);
      return data;
    },
    enabled: !!selectedConv,
    refetchInterval: 2000,
    staleTime: 1000,
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages?.length) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const { data: searchResults } = useQuery({
    queryKey: ["userSearch", userSearch],
    queryFn: async () => {
      if (!userSearch.trim()) return [];
      const { data } = await usersAPI.getAll({ search: userSearch });
      return data.filter((u) => u.id !== user?.id);
    },
    enabled: !!userSearch.trim(),
  });

  const sendMutation = useMutation({
    mutationFn: async (content) => {
      const receiverId = selectedConv?.otherUser?.id || selectedUser?.id;
      if (!receiverId) throw new Error("No receiver");
      return messagesAPI.send({ receiverId, content });
    },
    onSuccess: async () => {
      setNewMessage("");
      await qc.refetchQueries({ queryKey: ["messages", selectedConv?.id] });
      await qc.refetchQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messageUnreadCount"] });
      if (showNewChat) {
        setShowNewChat(false);
        const { data: convs } = await messagesAPI.getConversations();
        qc.setQueryData(["conversations"], convs);
        const newConv = convs.find((c) => c.otherUser?.id === selectedUser?.id);
        if (newConv) { setSelectedConv(newConv); setSelectedUser(null); setUserSearch(""); }
      }
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); }
  };

  const filteredConvs = (conversations ?? []).filter(c =>
    !convSearch.trim() || c.otherUser?.username?.toLowerCase().includes(convSearch.toLowerCase())
  );

  return (
    // data-fullwidth tells AppShell to remove padding/centering for this page
    <div data-fullwidth className="flex h-full surface-base font-sans" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Left panel: conversation list ────────────────────────── */}
      <div className={`w-[320px] flex-shrink-0 border-r border-subtle flex flex-col surface-sidebar ${selectedConv || showNewChat ? "hidden lg:flex" : "flex"}`}>

        {/* Header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0 border-b border-subtle">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold font-mono text-primary flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-500" />
              <span>{user?.username}</span>
            </h2>
            <button
              onClick={() => { setShowNewChat(true); setSelectedConv(null); }}
              className="p-1.5 surface-raised hover:text-amber-500 text-muted border border-subtle rounded-sm transition"
              title="New message"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Search conversations */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={convSearch}
              onChange={e => setConvSearch(e.target.value)}
              className="w-full surface-input text-primary text-xs pl-8 pr-3 py-1.5 rounded-sm border border-subtle focus:border-amber-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        <p className="px-4 py-2 text-[10px] font-mono font-bold text-muted uppercase tracking-wider flex-shrink-0">Direct Messages</p>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {loadingConvs ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-sm surface-raised animate-pulse">
                  <div className="w-9 h-9 rounded-sm surface-card flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 surface-card rounded w-24" />
                    <div className="h-2.5 surface-card rounded w-36" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvs.length > 0 ? (
            <div className="space-y-0.5">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedConv(conv);
                    setShowNewChat(false);
                    // Immediately clear unread badge optimistically in the cache
                    qc.setQueryData(["conversations"], (old) => {
                      if (!Array.isArray(old)) return old;
                      return old.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c);
                    });
                    // Tell the server the messages are read (use the last message id as a proxy)
                    if (conv.unreadCount > 0 && conv.lastMessage?.id) {
                      messagesAPI.getMessages(conv.id).catch(() => {});
                    }
                    // Refetch unread count so TopBar badge updates right away
                    qc.invalidateQueries({ queryKey: ["messageUnreadCount"] });
                    qc.invalidateQueries({ queryKey: ["messages", conv.id] });
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-sm transition text-left border ${
                    selectedConv?.id === conv.id
                      ? "surface-raised border-amber-500/50 text-primary"
                      : "border-transparent hover:surface-raised text-muted hover:text-primary"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conv.otherUser?.avatarUrl ? (
                      <img src={conv.otherUser.avatarUrl} alt="" className="w-8 h-8 rounded-sm object-cover border border-subtle" />
                    ) : (
                      <div className="w-8 h-8 rounded-sm surface-card border border-subtle flex items-center justify-center font-mono font-bold text-amber-500 text-xs">
                        {conv.otherUser?.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Online dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-subtle" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-mono font-medium truncate ${conv.unreadCount > 0 ? "text-primary font-bold" : "text-secondary"}`}>
                        {conv.otherUser?.username}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] font-mono text-muted flex-shrink-0 ml-1">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-[11px] truncate mt-0.5 ${conv.unreadCount > 0 ? "text-primary font-semibold" : "text-muted"}`}>
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <MessageSquare className="h-8 w-8 text-muted mb-2" />
              <p className="text-xs text-muted font-mono">No conversations yet</p>
              <button onClick={() => setShowNewChat(true)} className="mt-2 text-xs font-mono text-amber-500 hover:text-amber-400">
                Start conversation →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: open conversation or empty state ─────────── */}
      <div className={`flex-1 flex flex-col min-w-0 surface-base ${!selectedConv && !showNewChat ? "hidden lg:flex" : "flex"}`}>
        {selectedConv ? (
          <>
            {/* Conversation header */}
            <div className="px-5 py-3 border-b border-subtle flex items-center gap-3 flex-shrink-0 surface-sidebar">
              <button onClick={() => setSelectedConv(null)} className="text-muted hover:text-primary lg:hidden mr-1">
                <ArrowLeft className="h-4 w-4" />
              </button>
              {selectedConv.otherUser?.avatarUrl ? (
                <img src={selectedConv.otherUser.avatarUrl} alt="" className="w-8 h-8 rounded-sm object-cover border border-subtle" />
              ) : (
                <div className="w-8 h-8 rounded-sm surface-raised border border-subtle flex items-center justify-center font-mono font-bold text-amber-500 text-xs">
                  {selectedConv.otherUser?.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs font-mono font-bold text-primary">{selectedConv.otherUser?.username}</p>
                <p className="text-[10px] font-mono text-emerald-500">Active now</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (messages ?? []).length > 0 ? (
                (messages ?? []).map((msg, idx) => {
                  const isMine = msg.senderId === user?.id;
                  const prevMsg = (messages ?? [])[idx - 1];
                  const nextMsg = (messages ?? [])[idx + 1];
                  const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date(prevMsg?.createdAt).toDateString();
                  const isGrouped = prevMsg && prevMsg.senderId === msg.senderId && !showDate;
                  const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId;

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px border-t border-subtle" />
                          <span className="text-[10px] font-mono text-muted">{format(new Date(msg.createdAt), "MMM d, yyyy")}</span>
                          <div className="flex-1 h-px border-t border-subtle" />
                        </div>
                      )}
                      <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-2.5"}`}>
                        {/* Avatar for received messages */}
                        {!isMine && (
                          <div className="w-6 h-6 flex-shrink-0 mb-0.5">
                            {isLastInGroup ? (
                              selectedConv.otherUser?.avatarUrl
                                ? <img src={selectedConv.otherUser.avatarUrl} alt="" className="w-6 h-6 rounded-sm object-cover border border-subtle" />
                                : <div className="w-6 h-6 rounded-sm surface-raised border border-subtle flex items-center justify-center font-mono font-bold text-amber-500 text-[10px]">
                                    {selectedConv.otherUser?.username?.charAt(0).toUpperCase()}
                                  </div>
                            ) : null}
                          </div>
                        )}
                        <div className="group relative max-w-[65%]">
                          <MessageBubble content={msg.content} isMine={isMine} />
                          {/* Timestamp on hover */}
                          <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center font-mono ${isMine ? "right-full mr-2" : "left-full ml-2"}`}>
                            <span className="text-[10px] text-muted whitespace-nowrap">
                              {format(new Date(msg.createdAt), "h:mm a")}
                              {isMine && msg.read && <span className="ml-1 text-amber-500">✓✓</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-12 h-12 rounded-sm surface-raised border border-subtle flex items-center justify-center mb-3 font-mono font-bold text-amber-500 text-lg">
                    {selectedConv.otherUser?.username?.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-primary font-mono font-bold text-sm">{selectedConv.otherUser?.username}</p>
                  <p className="text-xs text-muted mt-1 font-sans">Say hi to start the conversation</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSend} className="px-4 py-3 border-t border-subtle flex items-center gap-2 flex-shrink-0 surface-sidebar">
              <div className="flex-1 surface-input border border-subtle rounded-sm flex items-center px-3 py-1.5 gap-2 focus-within:border-amber-500 transition">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… [Enter]"
                  className="flex-1 bg-transparent text-primary text-xs focus:outline-none placeholder:text-muted font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || sendMutation.isPending}
                className="w-8 h-8 bg-amber-500 text-gray-950 rounded-sm hover:bg-amber-400 disabled:opacity-40 transition flex items-center justify-center flex-shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </>
        ) : showNewChat ? (
          /* New message panel */
          <div className="flex-1 flex flex-col surface-base">
            <div className="px-5 py-3.5 border-b border-subtle flex items-center gap-3 flex-shrink-0 surface-sidebar">
              <button onClick={() => setShowNewChat(false)} className="text-muted hover:text-primary">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h3 className="text-sm font-mono font-bold text-primary">New Message</h3>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Search developers…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full surface-input border border-subtle text-primary text-xs pl-9 pr-3.5 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
              {searchResults && searchResults.length > 0 && (
                <div className="space-y-1">
                  {searchResults.slice(0, 8).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setUserSearch(u.username); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-sm transition text-left border ${selectedUser?.id === u.id ? "surface-raised border-amber-500/50" : "border-transparent hover:surface-raised"}`}
                    >
                      {u.avatarUrl
                        ? <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-sm object-cover border border-subtle" />
                        : <div className="w-8 h-8 rounded-sm surface-raised border border-subtle flex items-center justify-center font-mono font-bold text-amber-500 text-xs">{u.username.charAt(0).toUpperCase()}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono font-semibold text-primary">{u.username}</p>
                        {u.bio && <p className="text-[11px] text-muted truncate font-sans">{u.bio}</p>}
                      </div>
                      {selectedUser?.id === u.id && <span className="text-amber-500 text-xs font-mono">✓</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="mt-5 pt-5 border-t border-subtle">
                  <p className="text-xs font-mono text-muted mb-3">Messaging <span className="text-primary font-bold">{selectedUser.username}</span></p>
                  <form onSubmit={handleSend} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedUser.username}…`}
                      className="flex-1 surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                    />
                    <button type="submit" disabled={!newMessage.trim() || sendMutation.isPending}
                      className="bg-amber-500 text-gray-950 px-3.5 rounded-sm hover:bg-amber-400 disabled:opacity-40 transition flex items-center font-mono font-bold text-xs">
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-16 h-16 rounded-sm surface-raised border border-subtle flex items-center justify-center mb-4 text-muted">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-sm font-mono font-bold text-primary mb-1">Direct Messages</h3>
            <p className="text-xs text-muted mb-5 font-sans">Send a message to coordinate on projects and code reviews.</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-950 bg-amber-500 hover:bg-amber-400 px-4 py-2 rounded-sm transition"
            >
              <Plus className="h-3.5 w-3.5" /> Start Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
