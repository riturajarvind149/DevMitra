"use client";

import { useQuery } from "@tanstack/react-query";
import { statsAPI, projectsAPI, usersAPI } from "@/lib/api";
import { ActivityIcon, UsersIcon, TerminalIcon } from "@/components/icons";
import Link from "next/link";

export default function RightSidebar() {
  const { data: stats } = useQuery({
    queryKey: ["platformStats"],
    queryFn: async () => {
      const { data } = await statsAPI.getPlatformStats();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: projectsData } = useQuery({
    queryKey: ["trendingProjects"],
    queryFn: async () => {
      const { data } = await projectsAPI.getAll({ limit: 5, sort: "trending" });
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: topUsers } = useQuery({
    queryKey: ["topContributors"],
    queryFn: async () => {
      const { data } = await usersAPI.getAll({ limit: 10 });
      return [...(data || [])]
        .sort((a, b) => (b._count?.projectMemberships ?? 0) - (a._count?.projectMemberships ?? 0))
        .slice(0, 4);
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="h-full surface-base border-l border-subtle overflow-y-auto font-sans">
      <div className="p-4 space-y-6 pt-18">
        {/* Trending Repositories */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <ActivityIcon className="h-3.5 w-3.5 text-amber-500" />
              Active Repositories
            </h3>
            <Link
              href="/trending"
              className="text-[10px] font-mono text-amber-500 hover:underline"
            >
              All
            </Link>
          </div>
          <div className="space-y-1">
            {projectsData?.projects?.slice(0, 5).map((project, i) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:surface-raised transition group border border-transparent hover:border-subtle"
              >
                <span className="text-[10px] font-mono font-bold text-muted w-3.5 flex-shrink-0 text-center">
                  0{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary truncate group-hover:text-amber-500 transition font-mono">
                    {project.title}
                  </p>
                  <p className="text-[10px] text-muted truncate font-mono">
                    @{project.owner?.username}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-muted flex-shrink-0">
                  {project._count?.members ?? 0} devs
                </span>
              </Link>
            ))}
            {(!projectsData?.projects || projectsData.projects.length === 0) && (
              <p className="text-[10px] font-mono text-muted px-2 py-2">
                No active repositories found
              </p>
            )}
          </div>
        </section>

        {/* Top Active Engineers */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <UsersIcon className="h-3.5 w-3.5 text-sky-500" />
              Verified Contributors
            </h3>
            <Link
              href="/trending?tab=contributors"
              className="text-[10px] font-mono text-amber-500 hover:underline"
            >
              All
            </Link>
          </div>
          <div className="space-y-1">
            {(topUsers ?? []).map((u, i) => (
              <Link
                key={u.id}
                href={`/users/${u.id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:surface-raised transition border border-transparent hover:border-subtle"
              >
                <span className="text-[10px] font-mono font-bold text-muted w-3.5 flex-shrink-0 text-center">
                  0{i + 1}
                </span>
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="w-5 h-5 rounded-sm object-cover border border-subtle flex-shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-sm surface-raised border border-subtle flex items-center justify-center flex-shrink-0">
                    <span className="text-[9px] font-mono font-bold text-amber-500">
                      {u.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-primary truncate font-mono">
                    @{u.username}
                  </p>
                  <p className="text-[10px] text-muted font-mono">
                    {u._count?.projectMemberships ?? 0} PRs merged
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Global Telemetry */}
        <section>
          <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <TerminalIcon className="h-3.5 w-3.5 text-amber-500" />
            Global Telemetry
          </h3>
          <div className="surface-card border border-subtle rounded-sm p-3 space-y-2 font-mono text-xs">
            {[
              { label: "Repositories",  value: stats?.projects },
              { label: "Engineers",     value: stats?.users },
              { label: "Contributors",  value: stats?.contributors },
              { label: "Open Requests", value: stats?.accessRequests?.pending, accent: true },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] text-muted">{label}</span>
                <span className={`text-[11px] font-bold ${accent ? "text-amber-500" : "text-primary"}`}>
                  {value !== undefined && value !== null ? value.toLocaleString() : "0"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
