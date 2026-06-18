"use client";

import { useQuery } from "@tanstack/react-query";
import { statsAPI, projectsAPI, usersAPI } from "@/lib/api";
import { TrendingUp, Users, Flame } from "lucide-react";
import Link from "next/link";

export default function RightSidebar() {
  const { data: stats } = useQuery({
    queryKey: ["platformStats"],
    queryFn: async () => { const { data } = await statsAPI.getPlatformStats(); return data; },
    refetchInterval: 5 * 60 * 1000, // every 5 min (was 60s)
    staleTime: 2 * 60 * 1000,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["trendingProjects"],
    queryFn: async () => { const { data } = await projectsAPI.getAll({ limit: 5 }); return data; },
    staleTime: 5 * 60 * 1000,       // 5 min cache — no auto-refetch
  });

  const { data: topUsers } = useQuery({
    queryKey: ["topContributors"],
    queryFn: async () => { const { data } = await usersAPI.getAll(); return data.slice(0, 4); },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="h-full bg-gray-900 border-l border-gray-800 overflow-y-auto">
      <div className="p-4 space-y-6 pt-20">

        {/* Trending Projects This Week */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />Trending This Week
            </h3>
            <Link href="/explore" className="text-[10px] text-indigo-400 hover:text-indigo-300">All →</Link>
          </div>
          <div className="space-y-0.5">
            {projectsData?.projects.slice(0, 5).map((project, i) => (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-800 transition group">
                <span className="text-[10px] font-bold text-gray-700 w-4 flex-shrink-0 text-center">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate group-hover:text-indigo-400 transition">{project.title}</p>
                  <p className="text-[10px] text-gray-600 truncate">{project.owner?.username}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-600">{project._count?.members ?? 0} members</span>
                </div>
              </Link>
            ))}
            {(!projectsData || projectsData.projects.length === 0) && (
              <p className="text-[10px] text-gray-600 px-2 py-2">No projects yet</p>
            )}
          </div>
        </section>

        {/* Top Contributors This Week */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-purple-400" />Top Contributors
            </h3>
            <Link href="/explore?tab=developers" className="text-[10px] text-indigo-400 hover:text-indigo-300">All →</Link>
          </div>
          <div className="space-y-0.5">
            {(topUsers ?? []).map((u, i) => (
              <Link key={u.id} href={`/users/${u.id}`}
                className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-gray-800 transition">
                <span className="text-[10px] font-bold text-gray-700 w-4 flex-shrink-0 text-center">{i + 1}</span>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-bold text-white">{u.username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-white truncate">{u.username}</p>
                  <p className="text-[10px] text-gray-600">{u._count?.projectMemberships ?? 0} contributions</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Platform Stats */}
        <section>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Flame className="h-3.5 w-3.5 text-orange-400" />Platform Stats
          </h3>
          <div className="bg-gray-800 rounded-xl p-3 space-y-2">
            {[
              { label: "Projects",      value: stats?.projects },
              { label: "Developers",    value: stats?.users },
              { label: "Contributors",  value: stats?.memberships },
              { label: "Open Requests", value: stats?.accessRequests?.pending, accent: true },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">{label}</span>
                <span className={`text-[11px] font-bold ${accent ? "text-indigo-400" : "text-white"}`}>
                  {value?.toLocaleString() ?? "–"}
                </span>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
