"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI, usersAPI, savesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import {
  PlusIcon,
  FolderIcon,
  PencilIcon,
  TrashIcon,
  UsersIcon,
  BookmarkIcon,
  ArrowRightIcon,
} from "@/components/icons";
import Link from "next/link";
import { FeedSkeleton } from "@/components/Skeleton";

export default function MyProjectsPage() {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("owned");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data: ownedProjects, isLoading: loadOwned } = useQuery({
    queryKey: ["myProjects"],
    queryFn: async () => { const { data } = await projectsAPI.getMyProjects(); return data; },
    enabled: isAuthenticated,
  });

  const { data: contributingProjects, isLoading: loadContrib } = useQuery({
    queryKey: ["contributing", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserContributing(user.id); return data; },
    enabled: isAuthenticated && tab === "contributing" && !!user?.id,
  });

  const { data: savedProjects, isLoading: loadSaved } = useQuery({
    queryKey: ["savedProjects"],
    queryFn: async () => { const { data } = await savesAPI.getSaved(); return data; },
    enabled: isAuthenticated && tab === "saved",
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => projectsAPI.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myProjects"] });
      qc.invalidateQueries({ queryKey: ["homeFeed"] });
      setConfirmDelete(null);
    },
    onError: (err) => alert(err.response?.data?.message || "Failed to delete"),
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-muted font-mono">
      Please sign in to view your projects
    </div>
  );

  const TABS = [
    { key: "owned",        label: `Owned (${ownedProjects?.length ?? 0})`, icon: FolderIcon },
    { key: "contributing", label: "Contributing",                         icon: UsersIcon },
    { key: "saved",        label: "Saved",                                icon: BookmarkIcon },
  ];

  const isLoading = tab === "owned" ? loadOwned : tab === "contributing" ? loadContrib : loadSaved;

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary tracking-tight">
            My Projects
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Projects you own, contribute to, and save
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-mono font-bold px-3.5 py-2 rounded-sm transition flex-shrink-0"
        >
          <PlusIcon className="h-4 w-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-mono transition ${
              tab === key
                ? "bg-amber-500 text-gray-950 font-bold"
                : "text-muted hover:text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Owned Projects */}
      {tab === "owned" && (
        isLoading ? <FeedSkeleton count={4} /> :
        ownedProjects && ownedProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {ownedProjects.map(project => (
              <div key={project.id} className="relative group">
                <ProjectFeedCard project={project} />
                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Link
                    href={`/projects/${project.id}/edit`}
                    className="surface-card text-secondary hover:text-primary p-2 rounded-sm border border-subtle transition"
                    title="Edit"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => setConfirmDelete(project.id)}
                    className="surface-card text-secondary hover:text-red-400 p-2 rounded-sm border border-subtle transition"
                    title="Delete"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 surface-card rounded-sm border border-subtle p-6 space-y-3 font-mono">
            <FolderIcon className="h-10 w-10 mx-auto text-muted" />
            <p className="text-sm font-bold text-primary">No projects yet</p>
            <p className="text-xs text-muted max-w-sm mx-auto font-sans">
              Create your first project to share code and recruit contributors.
            </p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-mono font-bold px-4 py-2 rounded-sm transition mt-2"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Create Project</span>
            </Link>
          </div>
        )
      )}

      {/* Contributing Projects */}
      {tab === "contributing" && (
        isLoading ? <FeedSkeleton count={4} /> :
        contributingProjects && contributingProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {contributingProjects.map((project) => (
              <ProjectFeedCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 surface-card rounded-sm border border-subtle p-6 space-y-3 font-mono">
            <UsersIcon className="h-10 w-10 mx-auto text-muted" />
            <p className="text-sm font-bold text-primary">No contributed projects yet</p>
            <p className="text-xs text-muted max-w-sm mx-auto font-sans">
              Join active repositories in the community to start collaborating.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-500 hover:underline mt-2 font-bold"
            >
              <span>Explore Projects</span>
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        )
      )}

      {/* Saved Projects */}
      {tab === "saved" && (
        isLoading ? <FeedSkeleton count={4} /> :
        savedProjects && savedProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {savedProjects.map((project) => (
              <ProjectFeedCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 surface-card rounded-sm border border-subtle p-6 space-y-3 font-mono">
            <BookmarkIcon className="h-10 w-10 mx-auto text-muted" />
            <p className="text-sm font-bold text-primary">No saved projects yet</p>
            <p className="text-xs text-muted max-w-sm mx-auto font-sans">
              Bookmark interesting repositories to reference them anytime.
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-500 hover:underline mt-2 font-bold"
            >
              <span>Browse Projects</span>
              <ArrowRightIcon className="h-3 w-3" />
            </Link>
          </div>
        )
      )}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-6 border border-subtle max-w-sm w-full font-sans">
            <h3 className="text-base font-bold font-mono text-primary mb-2">Delete Project?</h3>
            <p className="text-xs text-muted mb-5 leading-relaxed">
              This cannot be undone. All members, comments and requests will be permanently removed.
            </p>
            <div className="flex gap-3 font-mono text-xs">
              <button
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-sm font-bold disabled:opacity-50 transition"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 surface-raised text-secondary hover:text-primary border border-subtle py-2 rounded-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
