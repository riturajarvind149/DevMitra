"use client";

import { BookmarkIcon } from "@/components/icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";

export default function SaveButton({ projectId, size = "sm" }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["saveStatus", projectId],
    queryFn: async () => {
      const { data } = await savesAPI.getStatus(projectId);
      return data;
    },
    enabled: isAuthenticated,
  });

  const saved = data?.saved ?? false;

  const mutation = useMutation({
    mutationFn: async () => {
      if (saved) return savesAPI.unsave(projectId);
      return savesAPI.save(projectId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saveStatus", projectId] });
      qc.invalidateQueries({ queryKey: ["savedProjects"] });
      if (saved) {
        toast.info("Project removed from bookmarks", "Bookmarks");
      } else {
        toast.success("Project bookmarked to your list", "Bookmarks");
      }
    },
    onError: () => {
      toast.error("Failed to update bookmark status", "Bookmarks");
    },
  });

  const iconSize = size === "md" ? "h-4.5 w-4.5" : "h-3.5 w-3.5";

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isAuthenticated) {
          mutation.mutate();
        } else {
          toast.info("Please login with GitHub to save projects", "Authentication");
        }
      }}
      disabled={mutation.isPending}
      className={`p-1 rounded-sm border transition flex items-center justify-center ${
        saved
          ? "bg-amber-950/40 text-amber-400 border-amber-800/60"
          : "bg-[#151c28] text-gray-400 hover:text-amber-400 border-[#253247] hover:border-[#384a66]"
      } disabled:opacity-50`}
      title={saved ? "Remove bookmark" : "Save project"}
      aria-label={saved ? "Remove bookmark" : "Save project"}
    >
      <BookmarkIcon className={iconSize} filled={saved} />
    </button>
  );
}
