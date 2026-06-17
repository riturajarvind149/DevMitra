"use client";

import { Bookmark } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { savesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function SaveButton({ projectId, size = "sm" }: { projectId: string; size?: "sm" | "md" }) {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["saveStatus", projectId],
    queryFn: async () => { const { data } = await savesAPI.getStatus(projectId); return data; },
    enabled: isAuthenticated,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (data?.saved) return savesAPI.unsave(projectId);
      return savesAPI.save(projectId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saveStatus", projectId] });
      qc.invalidateQueries({ queryKey: ["savedProjects"] });
    },
  });

  const saved = data?.saved ?? false;
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (isAuthenticated) mutation.mutate(); }}
      disabled={!isAuthenticated || mutation.isPending}
      className={`transition ${saved ? "text-indigo-400" : "text-gray-500 hover:text-indigo-400"} disabled:cursor-not-allowed`}
      title={saved ? "Unsave" : "Save"}
    >
      <Bookmark className={`${iconSize} ${saved ? "fill-current" : ""}`} />
    </button>
  );
}
