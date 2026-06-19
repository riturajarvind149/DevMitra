"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Search, ArrowLeft, Plus, Edit } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { User, Message, Conversation } from "@/types";

export default function MessagesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv?.id]);

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => { const { data } = await messagesAPI.getConversations(); return data; },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const { data: messages, isLoading: loadingMsgs } = useQuery({
    queryKey: ["messages", selectedConv?.id],
    queryFn: async () => {
      if (!selectedConv) return [] as Message[];
      const { data } = await messagesAPI.getMessages(selectedConv.id);
      return data as Message[];
    },
    enabled: !!selectedConv,
    refetchInterval: 5000,
    staleTime: 3000,
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
      return data.filter((u: User) => u.id !== user?.id);
    },
    enabled: !!userSearch.trim(),
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
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
        const newConv = (convs as Conversation[]).find((c) => c.otherUser?.id === selectedUser?.id);
        if (newConv) { setSelectedConv(newConv); setSelectedUser(null); setUserSearch(""); }
      }
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMutation.mutate(newMessage);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as any); }
  };

  const filteredConvs = (conversations ?? []).filter(c =>
    !convSearch.trim() || c.otherUser?.username?.toLowerCase().includes(convSearch.toLowerCase())
  );

  return (
    // data-fullwidth tells AppShell to remove padding/centering for this page
    <div data-fullwidth className="flex h-full bg-gray-950" style={{ height: "calc(100vh - 64px)" }}>

      {/* ── Left panel: conversation list ─────────────────────────────────── */}
      <div className={`w-[340px] flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-950 ${selectedConv || showNewChat ? "hidden lg:flex" : "flex"}`}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">{user?.username}</h2>
            <button
              onClick={() => { setShowNewChat(true); setSelectedConv(null); }}
              className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition"
              title="New message"
            >
              <Edit className="h-5 w-5" />
            </button>
          </div>
          {/* Search conversations */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search"
              value={convSearch}
              onChange={e => setConvSearch(e.target.value)}
              className="w-full bg-gray-800 text-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-gray-500"
            />
          </div>
        </div>

        <p className="px-5 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Messages</p>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="space-y-1 px-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-gray-800 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-800 animate-pulse rounded w-28" />
                    <div className="h-2.5 bg-gray-800 animate-pulse rounded w-40" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConvs.length > 0 ? (
            <div className="px-2 space-y-0.5">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedConv(conv); setShowNewChat(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition text-left ${
                    selectedConv?.id === conv.id ? "bg-gray-800" : "hover:bg-gray-800/60"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {conv.otherUser?.avatarUrl ? (
                      <img src={conv.otherUser.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-700 flex items-center justify-center">
                        <span className="text-base font-bold text-white">{conv.otherUser?.username?.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    {/* Online dot */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-950" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${conv.unreadCount > 0 ? "text-white" : "text-gray-200"}`}>
                        {conv.otherUser?.username}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-gray-500 flex-shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-white font-medium" : "text-gray-500"}`}>
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <MessageSquare className="h-12 w-12 text-gray-700 mb-3" />
              <p className="text-sm text-gray-400 font-medium">No conversations yet</p>
              <button onClick={() => setShowNewChat(true)} className="mt-3 text-xs text-indigo-400 hover:text-indigo-300">
                Start a conversation →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: open conversation or empty state ─────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 bg-gray-950 ${!selectedConv && !showNewChat ? "hidden lg:flex" : "flex"}`}>
        {selectedConv ? (
          <>
            {/* Conversation header */}
            <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-3 flex-shrink-0 bg-gray-950">
              <button onClick={() => setSelectedConv(null)} className="text-gray-400 hover:text-white lg:hidden mr-1">
                <ArrowLeft className="h-5 w-5" />
              </button>
              {selectedConv.otherUser?.avatarUrl ? (
                <img src={selectedConv.otherUser.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{selectedConv.otherUser?.username?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white">{selectedConv.otherUser?.username}</p>
                <p className="text-xs text-green-400">Active now</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-1">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
                          <div className="flex-1 h-px bg-gray-800" />
                          <span className="text-[10px] text-gray-600">{format(new Date(msg.createdAt), "MMM d, yyyy")}</span>
                          <div className="flex-1 h-px bg-gray-800" />
                        </div>
                      )}
                      <div className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isGrouped ? "mt-0.5" : "mt-3"}`}>
                        {/* Avatar for received messages — only show on last in group */}
                        {!isMine && (
                          <div className="w-7 h-7 flex-shrink-0 mb-0.5">
                            {isLastInGroup ? (
                              selectedConv.otherUser?.avatarUrl
                                ? <img src={selectedConv.otherUser.avatarUrl} alt="" className="w-7 h-7 rounded-full" />
                                : <div className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-white">{selectedConv.otherUser?.username?.charAt(0).toUpperCase()}</span>
                                  </div>
                            ) : null}
                          </div>
                        )}
                        <div className={`group relative max-w-[65%]`}>
                          <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                            isMine
                              ? "bg-indigo-600 text-white rounded-3xl rounded-br-md"
                              : "bg-gray-800 text-gray-100 rounded-3xl rounded-bl-md"
                          }`}>
                            {msg.content}
                          </div>
                          {/* Timestamp on hover */}
                          <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center ${isMine ? "right-full mr-2" : "left-full ml-2"}`}>
                            <span className="text-[10px] text-gray-600 whitespace-nowrap">
                              {format(new Date(msg.createdAt), "h:mm a")}
                              {isMine && msg.read && <span className="ml-1 text-indigo-400">✓✓</span>}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                    {selectedConv.otherUser?.avatarUrl
                      ? <img src={selectedConv.otherUser.avatarUrl} alt="" className="w-16 h-16 rounded-full" />
                      : <span className="text-2xl font-bold text-white">{selectedConv.otherUser?.username?.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <p className="text-white font-semibold text-base">{selectedConv.otherUser?.username}</p>
                  <p className="text-xs text-gray-500 mt-1">Say hi to start the conversation</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSend} className="px-5 py-4 border-t border-gray-800 flex items-center gap-3 flex-shrink-0 bg-gray-950">
              <div className="flex-1 bg-gray-800 border border-gray-700 rounded-3xl flex items-center px-4 py-2 gap-2 focus-within:border-indigo-500 transition">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message…"
                  className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-gray-500"
                />
              </div>
              <button
                type="submit"
                disabled={!newMessage.trim() || sendMutation.isPending}
                className="w-10 h-10 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-40 transition flex items-center justify-center flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : showNewChat ? (
          /* New message panel */
          <div className="flex-1 flex flex-col">
            <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-3 flex-shrink-0">
              <button onClick={() => setShowNewChat(false)} className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h3 className="text-base font-semibold text-white">New Message</h3>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search developers…"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
              {searchResults && searchResults.length > 0 && (
                <div className="space-y-0.5">
                  {(searchResults as User[]).slice(0, 8).map((u: User) => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setUserSearch(u.username); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition text-left ${selectedUser?.id === u.id ? "bg-indigo-900/30" : "hover:bg-gray-800"}`}
                    >
                      {u.avatarUrl
                        ? <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                        : <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center"><span className="text-sm font-bold text-white">{u.username.charAt(0).toUpperCase()}</span></div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white">{u.username}</p>
                        {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                      </div>
                      {selectedUser?.id === u.id && <span className="text-indigo-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="mt-5 pt-5 border-t border-gray-800">
                  <p className="text-xs text-gray-500 mb-3">Messaging <span className="text-white font-medium">{selectedUser.username}</span></p>
                  <form onSubmit={handleSend} className="flex gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder={`Message ${selectedUser.username}…`}
                      className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none"
                    />
                    <button type="submit" disabled={!newMessage.trim() || sendMutation.isPending}
                      className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition flex items-center">
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-full border-2 border-gray-600 flex items-center justify-center mb-5">
              <MessageSquare className="h-9 w-9 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Your messages</h3>
            <p className="text-sm text-gray-500 mb-6">Send a message to start a chat.</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition"
            >
              <Plus className="h-4 w-4" />Send message
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
