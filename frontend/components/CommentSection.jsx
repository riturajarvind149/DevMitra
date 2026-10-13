"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { formatDistanceToNow } from "date-fns";
import {
  ChatIcon,
  PencilIcon,
  TrashIcon,
  CornerDownRightIcon,
  SendIcon,
  AlertTriangleIcon,
} from "@/components/icons";

function CommentItem({ comment, projectId, depth = 0 }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updateMut = useMutation({
    mutationFn: () => commentsAPI.updateComment(comment.id, editText),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", projectId] });
      setEditing(false);
      toast.success("Comment updated", "Discussions");
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => commentsAPI.deleteComment(comment.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", projectId] });
      setConfirmDelete(false);
      toast.info("Comment deleted", "Discussions");
    },
  });

  const replyMut = useMutation({
    mutationFn: () =>
      commentsAPI.addComment(projectId, {
        content: replyText,
        parentCommentId: comment.id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", projectId] });
      setReplyText("");
      setReplyOpen(false);
      toast.success("Reply posted", "Discussions");
    },
  });

  return (
    <div className={depth > 0 ? "ml-6 border-l border-[#1f293b] pl-3" : ""}>
      <div className="flex gap-2.5 py-2.5 font-sans">
        {comment.user.avatarUrl ? (
          <img
            src={comment.user.avatarUrl}
            alt=""
            className="w-6 h-6 rounded-sm object-cover border border-[#253247] flex-shrink-0"
          />
        ) : (
          <div className="w-6 h-6 rounded-sm bg-[#17202e] border border-[#253247] flex items-center justify-center text-[10px] font-mono font-bold text-amber-400 flex-shrink-0">
            {comment.user.username?.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-200 font-mono">
              @{comment.user.username}
            </span>
            <span className="text-[10px] font-mono text-gray-500">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
          </div>

          {editing ? (
            <div className="flex gap-2 mt-1">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 bg-[#141b27] border border-[#263449] text-gray-200 text-xs px-2.5 py-1.5 rounded-sm focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending}
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-mono font-bold text-xs px-2.5 py-1.5 rounded-sm transition"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="bg-[#182130] hover:bg-[#222d40] text-gray-300 border border-[#27354b] text-xs px-2 py-1.5 rounded-sm transition"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-300 leading-relaxed font-sans">{comment.content}</p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] font-mono">
            {user && (
              <button
                onClick={() => setReplyOpen(!replyOpen)}
                className="text-gray-500 hover:text-amber-400 flex items-center gap-1 transition"
              >
                <CornerDownRightIcon className="h-3 w-3" />
                Reply
              </button>
            )}
            {user?.id === comment.user.id && (
              <>
                <button
                  onClick={() => setEditing(!editing)}
                  className="text-gray-500 hover:text-gray-300 flex items-center gap-1 transition"
                >
                  <PencilIcon className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="text-gray-500 hover:text-red-400 flex items-center gap-1 transition"
                >
                  <TrashIcon className="h-3 w-3" />
                  Delete
                </button>
              </>
            )}
          </div>

          {replyOpen && (
            <div className="flex gap-2 mt-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="flex-1 bg-[#141b27] border border-[#263449] text-gray-200 text-xs px-2.5 py-1 rounded-sm focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={() => replyMut.mutate()}
                disabled={!replyText.trim() || replyMut.isPending}
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-mono font-bold text-xs px-3 py-1 rounded-sm transition disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111722] rounded-sm p-4 border border-[#27354c] max-w-sm w-full">
            <h4 className="text-xs font-bold font-mono text-gray-100 mb-1">Delete comment?</h4>
            <p className="text-xs text-gray-400 mb-3 font-sans">
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteMut.mutate()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-sm text-xs font-mono font-bold"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 bg-[#182130] text-gray-300 border border-[#27354b] py-1.5 rounded-sm text-xs font-mono"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} projectId={projectId} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentSection({ projectId }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const toast = useToast();
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", projectId],
    queryFn: async () => {
      const { data } = await commentsAPI.getComments(projectId);
      return data;
    },
  });

  const addMut = useMutation({
    mutationFn: () => commentsAPI.addComment(projectId, { content: newComment }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", projectId] });
      setNewComment("");
      toast.success("Comment published", "Discussions");
    },
  });

  return (
    <div className="bg-[#10151f] rounded-sm border border-[#20293b] p-4 sm:p-5 font-sans">
      <h2 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-3 flex items-center gap-2">
        <ChatIcon className="h-4 w-4 text-amber-400" />
        Technical Discussion ({comments?.length ?? 0})
      </h2>

      {isAuthenticated && (
        <div className="flex gap-2 mb-4">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (newComment.trim()) addMut.mutate();
              }
            }}
            placeholder="Contribute to the discussion... [Enter to send]"
            className="flex-1 bg-[#141b27] border border-[#253247] text-gray-200 text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none placeholder-gray-500 font-sans"
          />
          <button
            onClick={() => addMut.mutate()}
            disabled={!newComment.trim() || addMut.isPending}
            className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-mono font-bold px-4 py-2 rounded-sm disabled:opacity-50 transition flex items-center gap-1.5 text-xs"
          >
            <SendIcon className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="divide-y divide-[#1b2332]">
          {comments.map((c) => (
            <CommentItem key={c.id} comment={c} projectId={projectId} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 font-mono text-xs">
          No comments yet. Start the engineering thread.
        </div>
      )}
    </div>
  );
}
