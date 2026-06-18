"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Search, ArrowLeft, Plus } from "lucide-react";
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
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Auto-scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.id]);

  const { data: conversations, isLoading: loadingConvs } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => { const { data } = await messagesAPI.getConversations(); return data; },
    refetchInterval: 5000,
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
  });

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      const res = await messagesAPI.send({ receiverId, content });
      return res;
    },
    onSuccess: async (res) => {
      setNewMessage("");
      // Immediately refetch messages in open conversation
      await qc.refetchQueries({ queryKey: ["messages", selectedConv?.id] });
      // Refetch conversations so lastMessage updates immediately
      await qc.refetchQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messageUnreadCount"] });

      // If this was a new chat, find and select the new conversation
      if (showNewChat) {
        setShowNewChat(false);
        setSelectedUser(null);
        setUserSearch("");
        const { data: convs } = await messagesAPI.getConversations();
        qc.setQueryData(["conversations"], convs);
        const newConv = convs.find((c: any) =>
          c.otherUser?.id === (selectedUser?.id)
        );
        if (newConv) setSelectedConv(newConv);
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

  // Select conversation and refresh
  const selectConv = (conv: Conversation) => {
    setSelectedConv(conv);
    setShowNewChat(false);
    setTimeout(() => qc.invalidateQueries({ queryKey: ["conversations"] }), 300);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] -mx-6 -my-6 bg-gray-950">

      {/* Left panel: conversation list */}
      <div className={`w-80 flex-shrink-0 border-r border-gray-800 flex flex-col bg-gray-950 ${selectedConv || showNewChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Messages</h2>
          <button onClick={() => { setShowNewChat(true); setSelectedConv(null); }}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition" title="New message">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {loadingConvs ? (
          <div className="flex-1 p-4 space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-800 animate-pulse rounded w-24" />
                  <div className="h-2.5 bg-gray-800 animate-pulse rounded w-36" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations && conversations.length > 0 ? (
              conversations.map(conv => (
                <button key={conv.id} onClick={() => selectConv(conv)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-gray-900 transition text-left border-b border-gray-800/50 ${selectedConv?.id === conv.id ? "bg-gray-900" : ""}`}>
                  {conv.otherUser?.avatarUrl ? (
                    <img src={conv.otherUser.avatarUrl} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-white">{conv.otherUser?.username?.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{conv.otherUser?.username}</span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })}</span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage.content}</p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0 mt-0.5">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="h-10 w-10 text-gray-700 mb-3" />
                <p className="text-sm text-gray-500">No conversations yet</p>
                <button onClick={() => setShowNewChat(true)} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
                  Start a conversation →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel: messages or new chat */}
      <div className={`flex-1 flex flex-col min-w-0 ${!selectedConv && !showNewChat ? "hidden md:flex" : "flex"}`}>
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-3 bg-gray-950 flex-shrink-0">
              <button onClick={() => setSelectedConv(null)} className="text-gray-400 hover:text-white md:hidden">
                <ArrowLeft className="h-5 w-5" />
              </button>
              {selectedConv.otherUser?.avatarUrl ? (
                <img src={selectedConv.otherUser.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{selectedConv.otherUser?.username?.charAt(0).toUpperCase()}</span>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{selectedConv.otherUser?.username}</p>
                <p className="text-xs text-green-400">Active</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {loadingMsgs ? (
                <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
              ) : (messages ?? []).length > 0 ? (
                (messages ?? []).map((msg, idx) => {
                  const isMine = msg.senderId === user?.id;
                  const showDate = idx === 0 || new Date(msg.createdAt).toDateString() !== new Date((messages ?? [])[idx - 1]?.createdAt).toDateString();
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex items-center gap-3 my-3">
                          <div className="flex-1 h-px bg-gray-800" />
                          <span className="text-[10px] text-gray-600">{format(new Date(msg.createdAt), "MMM d, yyyy")}</span>
                          <div className="flex-1 h-px bg-gray-800" />
                        </div>
                      )}
                      <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isMine ? "bg-indigo-600 text-white rounded-br-md" : "bg-gray-800 text-gray-200 rounded-bl-md"
                        }`}>
                          <p>{msg.content}</p>
                          <p className={`text-[10px] mt-1 ${isMine ? "text-indigo-200 text-right" : "text-gray-500"}`}>
                            {format(new Date(msg.createdAt), "h:mm a")}
                            {isMine && msg.read && <span className="ml-1">✓✓</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-600">
                  <MessageSquare className="h-10 w-10 mb-2 text-gray-800" />
                  <p className="text-sm">No messages yet — say hello!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-5 py-4 border-t border-gray-800 flex items-end gap-3 flex-shrink-0 bg-gray-950">
              <textarea
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message… (Enter to send)"
                rows={1}
                className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-2xl focus:border-indigo-500 focus:outline-none resize-none max-h-32"
                style={{ minHeight: "42px" }}
              />
              <button type="submit" disabled={!newMessage.trim() || sendMutation.isPending}
                className="w-10 h-10 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 disabled:opacity-40 transition flex items-center justify-center flex-shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        ) : showNewChat ? (
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setShowNewChat(false)} className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h3 className="text-base font-semibold text-white">New Message</h3>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search developers…" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>

            {searchResults && searchResults.length > 0 && (
              <div className="border border-gray-800 rounded-xl overflow-hidden mb-4">
                {searchResults.slice(0, 6).map((u: User) => (
                  <button key={u.id} onClick={() => { setSelectedUser(u); setUserSearch(u.username); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition text-left border-b border-gray-800 last:border-0 ${selectedUser?.id === u.id ? "bg-gray-800" : ""}`}>
                    {u.avatarUrl ? <img src={u.avatarUrl} alt="" className="w-8 h-8 rounded-full" /> : (
                      <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">{u.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-sm font-medium text-white">{u.username}</span>
                      {u.bio && <p className="text-xs text-gray-500 truncate max-w-xs">{u.bio}</p>}
                    </div>
                    {selectedUser?.id === u.id && <span className="ml-auto text-indigo-400 text-xs">Selected ✓</span>}
                  </button>
                ))}
              </div>
            )}

            {selectedUser && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">Messaging <span className="text-white font-medium">{selectedUser.username}</span></p>
                <form onSubmit={handleSend} className="flex gap-3">
                  <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder={`Message ${selectedUser.username}…`}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
                  <button type="submit" disabled={!newMessage.trim() || sendMutation.isPending}
                    className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition">
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <MessageSquare className="h-14 w-14 mx-auto mb-4 text-gray-800" />
              <p className="text-white font-medium mb-1">Select a conversation</p>
              <p className="text-sm text-gray-500 mb-4">or start a new one</p>
              <button onClick={() => setShowNewChat(true)}
                className="flex items-center gap-2 text-sm text-white bg-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition mx-auto">
                <Plus className="h-4 w-4" />New Message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
