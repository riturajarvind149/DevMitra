"use client";

import { HeartIcon } from "@/components/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { likesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function LikeButton({ projectId, size = "sm" }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["likes", projectId],
    queryFn: async () => {
      const { data } = await likesAPI.getLikes(projectId);
      return data;
    },
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

  const iconSize = size === "md" ? "h-4.5 w-4.5" : "h-3.5 w-3.5";
  const textSize = size === "md" ? "text-xs" : "text-[11px]";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAuthenticated) mutation.mutate();
      }}
      disabled={!isAuthenticated || mutation.isPending}
      className={`flex items-center gap-1 font-mono ${textSize} transition ${
        liked ? "text-red-400" : "text-gray-400 hover:text-red-400"
      } disabled:cursor-not-allowed`}
      title={liked ? "Unlike repository" : "Like repository"}
    >
      <HeartIcon className={iconSize} filled={liked} />
      <span>{count}</span>
    </button>
  );
}
