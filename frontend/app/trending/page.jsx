"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsAPI, usersAPI } from "@/lib/api";
import { ActivityIcon, UsersIcon, FolderIcon } from "@/components/icons";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";

function TrendingContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(
    (searchParams.get("tab")) ?? "projects"
  );

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["trendingAllProjects"],
    queryFn: async () => {
      const { data } = await projectsAPI.getAll({ limit: 50, sort: "trending" });
      return [...data.projects].sort((a, b) => (b._count?.members ?? 0) - (a._count?.members ?? 0));
    },
    enabled: tab === "projects",
    staleTime: 5 * 60 * 1000,
  });

  const { data: topUsers, isLoading: loadingUsers } = useQuery({
    queryKey: ["trendingAllContributors"],
    queryFn: async () => {
      const { data } = await usersAPI.getAll();
      return [...data].sort((a, b) => (b._count?.projectMemberships ?? 0) - (a._count?.projectMemberships ?? 0));
    },
    enabled: tab === "contributors",
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-2">
          <ActivityIcon className="h-5 w-5 text-amber-500" />
          <span>Trending Repositories</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Highest community momentum and most active engineering contributors
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm w-fit">
        {[
          { key: "projects", label: "Trending Repos", icon: ActivityIcon },
          { key: "contributors", label: "Top Contributors", icon: UsersIcon },
        ].map(({ key, label, icon: Icon }) => (
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

      {/* Trending Projects */}
      {tab === "projects" && (
        loadingProjects ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 surface-card rounded-sm border border-subtle animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(projectsData ?? []).map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-4 p-3.5 surface-card border border-subtle rounded-sm hover:border-amber-500/40 transition group"
              >
                {/* Rank */}
                <span className={`text-base font-mono font-bold w-7 text-center flex-shrink-0 ${
                  i === 0 ? "text-amber-500" : i === 1 ? "text-secondary" : i === 2 ? "text-amber-600" : "text-muted"
                }`}>
                  0{i + 1}
                </span>
                {/* Cover */}
                <div className="w-12 h-12 rounded-sm overflow-hidden surface-raised border border-subtle flex-shrink-0">
                  {project.coverImage
                    ? <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-muted">
                        <FolderIcon className="h-5 w-5" />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold font-mono text-primary truncate group-hover:text-amber-500 transition">
                    {project.title}
                  </p>
                  <p className="text-xs text-muted truncate mt-0.5 font-sans">{project.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted font-mono">
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-3 w-3" />
                      <span>{project._count?.members ?? 0} members</span>
                    </span>
                    <span>&bull;</span>
                    <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 flex-shrink-0 max-w-[120px]">
                  {project.tags?.slice(0, 2).map((tag, j) => (
                    <span
                      key={j}
                      className="text-[9px] font-mono text-amber-500 surface-raised border border-subtle px-1.5 py-0.2 rounded-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )
      )}

      {/* Top Contributors */}
      {tab === "contributors" && (
        loadingUsers ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 surface-card rounded-sm border border-subtle animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {(topUsers ?? []).map((u, i) => (
              <div
                key={u.id}
                className="flex items-center gap-4 p-3.5 surface-card border border-subtle rounded-sm hover:border-amber-500/40 transition"
              >
                {/* Rank */}
                <span className={`text-base font-mono font-bold w-7 text-center flex-shrink-0 ${
                  i === 0 ? "text-amber-500" : i === 1 ? "text-secondary" : i === 2 ? "text-amber-600" : "text-muted"
                }`}>
                  0{i + 1}
                </span>
                {/* Avatar */}
                <Link href={`/users/${u.id}`} className="flex-shrink-0">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-sm object-cover border border-subtle" />
                  ) : (
                    <div className="w-10 h-10 rounded-sm surface-raised border border-subtle flex items-center justify-center font-mono font-bold text-amber-500">
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/users/${u.id}`}
                    className="text-xs font-bold font-mono text-primary hover:text-amber-500 transition block truncate"
                  >
                    @{u.username}
                  </Link>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted font-mono">
                    <span className="text-amber-500 font-semibold">
                      {u._count?.projectMemberships ?? 0} contributions
                    </span>
                    <span>&bull;</span>
                    <span>{u._count?.projects ?? 0} projects</span>
                  </div>
                </div>
                <ConnectButton userId={u.id} />
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default function TrendingPage() {
  return (
    <Suspense>
      <TrendingContent />
    </Suspense>
  );
}
