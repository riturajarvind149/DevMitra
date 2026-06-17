"use client";

import { useQuery } from "@tanstack/react-query";
import { statsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Users, FolderGit2, Heart, MessageSquare, KeyRound, Briefcase, Activity, TrendingUp, GitPullRequest } from "lucide-react";
import Link from "next/link";

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-900/40`}>
          <Icon className={`h-5 w-5 text-${color}-400`} />
        </div>
        <TrendingUp className="h-4 w-4 text-green-500 opacity-60" />
      </div>
      <p className="text-2xl font-bold text-white">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => { const { data } = await statsAPI.getPlatformStats(); return data; },
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Platform overview and statistics</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : stats ? (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            <StatCard icon={Users}         label="Total Developers"    value={stats.users}                                           color="indigo" />
            <StatCard icon={FolderGit2}    label="Active Projects"     value={stats.projects}                                        color="purple" />
            <StatCard icon={Users}         label="Contributors"        value={stats.memberships}                                     color="green" />
            <StatCard icon={Heart}         label="Total Likes"         value={stats.likes}                                           color="red" />
            <StatCard icon={MessageSquare} label="Connections"         value={stats.connections}                                     color="blue" />
            <StatCard icon={MessageSquare} label="Comments"            value={(stats as any).comments ?? 0}                         color="teal" />
            <StatCard icon={KeyRound}      label="Repo Requests"       value={(stats as any).repoRequests ?? 0}                     color="yellow" />
            <StatCard icon={Briefcase}     label="Open Opportunities"  value={(stats as any).openOpportunities ?? 0}                color="orange" />
            <StatCard icon={GitPullRequest} label="Access Requests"    value={stats.accessRequests.total} sub={`${stats.accessRequests.pending} pending`} color="pink" />
            <StatCard icon={Activity}      label="Activity Events"     value={stats.activities}                                     color="gray" />
          </div>

          {/* Quick links */}
          <h2 className="text-base font-semibold text-white mb-3">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { href: "/developers",    label: "All Developers",     icon: Users,          desc: `${stats.users} registered` },
              { href: "/explore",       label: "All Projects",        icon: FolderGit2,    desc: `${stats.projects} projects` },
              { href: "/activity",      label: "Activity Feed",       icon: Activity,      desc: `${stats.activities} events` },
              { href: "/opportunities", label: "Opportunities",       icon: Briefcase,     desc: "Active listings" },
              { href: "/repo-requests", label: "Repo Requests",       icon: KeyRound,      desc: "Access management" },
              { href: "/connections",   label: "Connections",         icon: MessageSquare, desc: `${stats.connections} connections` },
            ].map(({ href, label, icon: Icon, desc }) => (
              <Link key={href} href={href}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-indigo-700 transition group">
                <Icon className="h-6 w-6 text-indigo-400 mb-2" />
                <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">{label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>

          {/* Access requests breakdown */}
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <GitPullRequest className="h-4 w-4 text-yellow-400" />Access Request Breakdown
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Pending",   value: stats.accessRequests.pending,   color: "yellow" },
                { label: "Processed", value: stats.accessRequests.processed, color: "green" },
                { label: "Total",     value: stats.accessRequests.total,     color: "indigo" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`text-center p-3 bg-${color}-900/20 border border-${color}-800/40 rounded-xl`}>
                  <p className={`text-xl font-bold text-${color}-400`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">Failed to load stats</div>
      )}
    </div>
  );
}
