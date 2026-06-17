"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Comment } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Pencil, Trash2, CornerDownRight, Send } from "lucide-react";

function CommentItem({ comment, projectId, depth = 0 }: { comment: Comment; projectId: string; depth?: number }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  const updateMut = useMutation({
    mutationFn: () => commentsAPI.updateComment(comment.id, editText),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comments", projectId] }); setEditing(false); },
  });
  const deleteMut = useMutation({
    mutationFn: () => commentsAPI.deleteComment(comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", projectId] }),
  });
  const replyMut = useMutation({
    mutationFn: () => commentsAPI.addComment(projectId, { content: replyText, parentCommentId: comment.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comments", projectId] }); setReplyText(""); setReplyOpen(false); },
  });

  return (
    <div className={depth > 0 ? "ml-8 border-l border-gray-800 pl-4" : ""}>
      <div className="flex gap-3 py-3">
        {comment.user.avatarUrl ? (
          <img src={comment.user.avatarUrl} alt="" className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-white">{comment.user.username.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{comment.user.username}</span>
            <span className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
          </div>
          {editing ? (
            <div className="space-y-2">
              <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" />
              <div className="flex gap-2">
                <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending || !editText.trim()}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
                  {updateMut.isPending ? "Saving…" : "Save"}
                </button>
                <button onClick={() => { setEditing(false); setEditText(comment.content); }}
                  className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded-lg hover:bg-gray-800 transition">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {depth === 0 && (
              <button onClick={() => setReplyOpen(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-400 transition">
                <CornerDownRight className="h-3 w-3" />Reply
              </button>
            )}
            {user?.id === comment.userId && !editing && (
              <>
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition">
                  <Pencil className="h-3 w-3" />Edit
                </button>
                <button onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition">
                  <Trash2 className="h-3 w-3" />Delete
                </button>
              </>
            )}
          </div>
          {replyOpen && (
            <div className="mt-2 flex gap-2">
              <input value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder="Write a reply…"
                className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none" />
              <button onClick={() => replyMut.mutate()} disabled={!replyText.trim() || replyMut.isPending}
                className="bg-indigo-600 text-white px-3 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map(r => <CommentItem key={r.id} comment={r} projectId={projectId} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ projectId }: { projectId: string }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", projectId],
    queryFn: async () => { const { data } = await commentsAPI.getComments(projectId); return data; },
  });

  const addMut = useMutation({
    mutationFn: () => commentsAPI.addComment(projectId, { content: newComment }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["comments", projectId] }); setNewComment(""); },
  });

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-blue-400" />
        Comments <span className="text-gray-500 font-normal text-sm">({comments?.length ?? 0})</span>
      </h2>

      {isAuthenticated && (
        <div className="flex gap-3 mb-5">
          <input value={newComment} onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (newComment.trim()) addMut.mutate(); }}}
            placeholder="Add a comment…"
            className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none placeholder-gray-600" />
          <button onClick={() => addMut.mutate()} disabled={!newComment.trim() || addMut.isPending}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : comments && comments.length > 0 ? (
        <div className="divide-y divide-gray-800/50">
          {comments.map(c => <CommentItem key={c.id} comment={c} projectId={projectId} />)}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-600">
          <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-800" />
          <p className="text-sm">No comments yet. Be the first!</p>
        </div>
      )}
    </div>
  );
}
