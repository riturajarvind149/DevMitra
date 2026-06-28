"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { projectsAPI, usersAPI } from "@/lib/api";
import { TrendingUp, Users, FolderGit2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";

function TrendingContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"projects" | "contributors">(
    (searchParams.get("tab") as any) ?? "projects"
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
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Trending</h1>
        <p className="text-sm text-gray-500 mt-0.5">Top projects and contributors this week</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 w-fit">
        {[
          { key: "projects", label: "Trending Projects", icon: TrendingUp },
          { key: "contributors", label: "Top Contributors", icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Trending Projects */}
      {tab === "projects" && (
        loadingProjects ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(projectsData ?? []).map((project, i) => (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition group">
                {/* Rank */}
                <span className={`text-lg font-black w-8 text-center flex-shrink-0 ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-600"
                }`}>{i + 1}</span>
                {/* Cover */}
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-800 flex-shrink-0">
                  {project.coverImage
                    ? <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><FolderGit2 className="h-5 w-5 text-gray-600" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-indigo-400 transition">{project.title}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{project.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] text-gray-600 flex items-center gap-1">
                      <Users className="h-3 w-3" />{project._count?.members ?? 0} members
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 flex-shrink-0 max-w-[120px]">
                  {project.tags.slice(0, 2).map((tag, j) => (
                    <span key={j} className="text-[9px] text-indigo-300 bg-indigo-900/40 px-1.5 py-0.5 rounded-full">{tag}</span>
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
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-900 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {(topUsers ?? []).map((u, i) => (
              <div key={u.id} className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition">
                {/* Rank */}
                <span className={`text-lg font-black w-8 text-center flex-shrink-0 ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-gray-600"
                }`}>{i + 1}</span>
                {/* Avatar */}
                <Link href={`/users/${u.id}`} className="flex-shrink-0">
                  {u.avatarUrl
                    ? <img src={u.avatarUrl} alt="" className="w-12 h-12 rounded-full" />
                    : <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                        <span className="text-lg font-bold text-white">{u.username.charAt(0).toUpperCase()}</span>
                      </div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/users/${u.id}`} className="text-sm font-semibold text-white hover:text-indigo-400 transition block truncate">{u.username}</Link>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-indigo-400 font-medium">
                      {u._count?.projectMemberships ?? 0} contributions
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {u._count?.projects ?? 0} projects
                    </span>
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
  return <Suspense><TrendingContent /></Suspense>;
}
