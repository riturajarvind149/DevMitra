"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import { Plus, FolderOpen, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { FeedSkeleton } from "@/components/Skeleton";

export default function MyProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["myProjects"],
    queryFn: async () => { const { data } = await projectsAPI.getMyProjects(); return data; },
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProjects"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      setConfirmDelete(null);
    },
    onError: (err: any) => alert(err.response?.data?.message || "Failed to delete"),
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-400">Please login</div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Projects you own and manage</p>
        </div>
        <Link href="/projects/new"
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition">
          <Plus className="h-4 w-4" /> New Project
        </Link>
      </div>

      {isLoading ? (
        <FeedSkeleton count={4} />
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {projects.map(project => (
            <div key={project.id} className="relative group">
              <ProjectFeedCard project={project} />
              <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/projects/${project.id}/edit`}
                  className="bg-gray-900/90 backdrop-blur-sm text-gray-300 hover:text-white p-2 rounded-lg transition"
                  title="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
                <button onClick={() => setConfirmDelete(project.id)}
                  className="bg-gray-900/90 backdrop-blur-sm text-gray-300 hover:text-red-400 p-2 rounded-lg transition"
                  title="Delete">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-700" />
          <p className="text-white font-medium mb-1">No projects yet</p>
          <p className="text-sm text-gray-500 mb-4">Create your first project and start collaborating</p>
          <Link href="/projects/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition">
            <Plus className="h-4 w-4" /> Create Project
          </Link>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-sm w-full">
            <h3 className="text-base font-semibold text-white mb-2">Delete Project?</h3>
            <p className="text-sm text-gray-400 mb-5">This cannot be undone. All members, comments and requests will be removed.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteMutation.mutate(confirmDelete)} disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition">
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
