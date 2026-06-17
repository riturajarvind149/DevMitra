"use client";

import { Heart } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { likesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function LikeButton({ projectId, size = "sm" }: { projectId: string; size?: "sm" | "md" }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["likes", projectId],
    queryFn: async () => { const { data } = await likesAPI.getLikes(projectId); return data; },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (data?.liked) return likesAPI.unlike(projectId);
      return likesAPI.like(projectId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["likes", projectId] }),
  });

  const count = data?.count ?? 0;
  const liked = data?.liked ?? false;

  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (isAuthenticated) mutation.mutate(); }}
      disabled={!isAuthenticated || mutation.isPending}
      className={`flex items-center gap-1.5 ${textSize} transition ${
        liked ? "text-red-400" : "text-gray-500 hover:text-red-400"
      } disabled:cursor-not-allowed`}
      title={liked ? "Unlike" : "Like"}
    >
      <Heart className={`${iconSize} ${liked ? "fill-current" : ""}`} />
      <span>{count}</span>
    </button>
  );
}
