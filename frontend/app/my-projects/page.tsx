"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI, usersAPI, savesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import { Plus, FolderOpen, Pencil, Trash2, Users, Bookmark } from "lucide-react";
import Link from "next/link";
import { FeedSkeleton } from "@/components/Skeleton";

type Tab = "owned" | "contributing" | "saved";

export default function MyProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("owned");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const { data: ownedProjects, isLoading: loadOwned } = useQuery({
    queryKey: ["myProjects"],
    queryFn: async () => { const { data } = await projectsAPI.getMyProjects(); return data; },
    enabled: isAuthenticated,
  });

  const { data: contributingProjects, isLoading: loadContrib } = useQuery({
    queryKey: ["contributing", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserContributing(user!.id); return data; },
    enabled: isAuthenticated && tab === "contributing" && !!user?.id,
  });

  const { data: savedProjects, isLoading: loadSaved } = useQuery({
    queryKey: ["savedProjects"],
    queryFn: async () => { const { data } = await savesAPI.getSaved(); return data; },
    enabled: isAuthenticated && tab === "saved",
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

  const TABS = [
    { key: "owned" as Tab,       label: `Owned (${ownedProjects?.length ?? 0})`,       icon: FolderOpen },
    { key: "contributing" as Tab, label: "Contributing",                                icon: Users },
    { key: "saved" as Tab,       label: "Saved",                                        icon: Bookmark },
  ];

  const isLoading = tab === "owned" ? loadOwned : tab === "contributing" ? loadContrib : loadSaved;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Projects you own, contribute to, and save</p>
        </div>
        <Link href="/projects/new"
          className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition">
          <Plus className="h-4 w-4" />New Project
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Owned Projects */}
      {tab === "owned" && (
        isLoading ? <FeedSkeleton count={4} /> :
        ownedProjects && ownedProjects.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {ownedProjects.map(project => (
              <div key={project.id} className="relative group">
                <ProjectFeedCard project={project} />
                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
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
              <Plus className="h-4 w-4" />Create Project
            </Link>
          </div>
        )
      )}

      {/* Contributing Projects */}
      {tab === "contributing" && (
        isLoading ? <FeedSkeleton count={4} /> :
        contributingProjects && contributingProjects.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {contributingProjects.map((project: any) => (
              <ProjectFeedCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-700" />
            <p className="text-white font-medium mb-1">No contributed projects yet</p>
            <p className="text-sm text-gray-500 mb-4">Join a project to start collaborating</p>
            <Link href="/explore"
              className="inline-block text-sm text-indigo-400 hover:text-indigo-300">
              Explore Projects →
            </Link>
          </div>
        )
      )}

      {/* Saved Projects */}
      {tab === "saved" && (
        isLoading ? <FeedSkeleton count={4} /> :
        savedProjects && savedProjects.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {savedProjects.map((project: any) => (
              <ProjectFeedCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
            <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-700" />
            <p className="text-white font-medium mb-1">No saved projects yet</p>
            <p className="text-sm text-gray-500 mb-4">Save projects to access them quickly</p>
            <Link href="/explore"
              className="inline-block text-sm text-indigo-400 hover:text-indigo-300">
              Browse Projects →
            </Link>
          </div>
        )
      )}

      {/* Delete confirm modal */}
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
