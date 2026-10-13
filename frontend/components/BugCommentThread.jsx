"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bugReportsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BugCommentThread({ bugId, projectOwnerId, reporterId }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  // Only reporter and project owner can see/post
  const canAccess = user?.id === projectOwnerId || user?.id === reporterId;

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["bugComments", bugId],
    queryFn: async () => { const { data } = await bugReportsAPI.getComments(bugId); return data; },
    enabled: !!bugId && canAccess,
    refetchInterval: 10000, // poll for new messages
    staleTime: 5000,
  });

  const addMut = useMutation({
    mutationFn: () => bugReportsAPI.addComment(bugId, text.trim()),
    onSuccess: (newComment) => {
      qc.setQueryData(["bugComments", bugId], (old) => [...(old ?? []), newComment.data]);
      setText("");
    },
    onError: () => {},
  });

  // Scroll to bottom when new comments arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments.length]);

  if (!canAccess) {
    return (
      <div className="flex-1 flex items-center justify-center px-5 py-6">
        <p className="text-xs text-gray-600 text-center">This discussion is private between the reporter and the project owner.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={{ maxHeight: 220, scrollbarWidth: "thin" }}>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted text-center py-4 font-mono">
            No messages yet. Start the discussion below.
          </p>
        ) : (
          comments.map((c) => {
            const isMine = c.author?.id === user?.id;
            return (
              <div key={c.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className="flex-shrink-0 mb-0.5">
                  {c.author?.avatarUrl
                    ? <img src={c.author.avatarUrl} alt="" className="w-6 h-6 rounded-sm object-cover" />
                    : <div className="w-6 h-6 rounded-sm bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-amber-500">{c.author?.username?.charAt(0).toUpperCase()}</span>
                      </div>}
                </div>
                {/* Bubble */}
                <div className={`max-w-[75%] group`}>
                  <div className={`px-3 py-2 rounded-sm text-sm leading-relaxed ${
                    isMine
                      ? "bg-amber-500 text-black font-medium"
                      : "surface-input border border-subtle text-primary"
                  }`}>
                    {c.content}
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"}`}>
                    <span className="text-[9px] text-muted font-mono">
                      {c.author?.username} · {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={e => { e.preventDefault(); if (text.trim()) addMut.mutate(); }}
        className="px-4 py-3 border-t border-subtle flex items-center gap-2 flex-shrink-0"
      >
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) addMut.mutate(); }}}
          placeholder="Reply about this bug…"
          className="flex-1 surface-input border border-subtle text-primary text-sm px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted"
        />
        <button
          type="submit"
          disabled={!text.trim() || addMut.isPending}
          className="w-9 h-9 bg-amber-500 text-black rounded-sm hover:bg-amber-400 disabled:opacity-40 transition flex items-center justify-center flex-shrink-0 shadow-sm"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
