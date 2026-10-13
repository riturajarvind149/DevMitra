"use client";

import { useQuery } from "@tanstack/react-query";
import { statsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Users, FolderGit2, Heart, MessageSquare, KeyRound, Briefcase, Activity, TrendingUp, GitPullRequest, ShieldAlert } from "lucide-react";
import Link from "next/link";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="surface-card border border-subtle rounded-sm p-4 hover:border-amber-500/30 transition shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-sm flex items-center justify-center surface-input border border-subtle">
          <Icon className="h-4 w-4 text-amber-500" />
        </div>
        <TrendingUp className="h-3.5 w-3.5 text-green-500 opacity-80" />
      </div>
      <p className="text-xl font-bold font-mono text-primary">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-secondary mt-0.5 font-mono">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-1 font-mono">{sub}</p>}
    </div>
  );
}

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Admin-only guard — redirect non-admins immediately
  useEffect(() => {
    if (!authLoading && user && !user.isAdmin) {
      router.replace("/");
    }
  }, [user, authLoading, router]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => { const { data } = await statsAPI.getPlatformStats(); return data; },
    refetchInterval: 30000,
    enabled: !!user?.isAdmin,
  });

  if (authLoading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user?.isAdmin) return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <ShieldAlert className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-lg font-bold text-primary mb-2">Access Denied</h2>
      <p className="text-secondary text-xs font-mono">You don't have permission to view this page.</p>
      <Link href="/" className="mt-4 text-xs font-mono text-amber-500 hover:text-amber-400">Go Home →</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary font-mono">Analytics Dashboard</h1>
        <p className="text-xs text-secondary mt-0.5 font-mono">Platform overview and system metrics</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
            <StatCard icon={Users}          label="Total Developers"   value={stats.users} />
            <StatCard icon={FolderGit2}     label="Active Projects"    value={stats.projects} />
            <StatCard icon={Users}          label="Contributors"       value={stats.memberships} />
            <StatCard icon={Heart}          label="Total Likes"        value={stats.likes} />
            <StatCard icon={MessageSquare}  label="Connections"        value={stats.connections} />
            <StatCard icon={MessageSquare}  label="Comments"           value={stats.comments ?? 0} />
            <StatCard icon={KeyRound}       label="Repo Requests"      value={stats.repoRequests ?? 0} />
            <StatCard icon={Briefcase}      label="Open Opportunities" value={stats.openOpportunities ?? 0} />
            <StatCard icon={GitPullRequest} label="Access Requests"    value={stats.accessRequests.total}
              sub={`${stats.accessRequests.pending} pending`} />
            <StatCard icon={Activity}       label="Activity Events"    value={stats.activities} />
          </div>

          <h2 className="text-sm font-semibold text-primary font-mono mb-3">Quick Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {[
              { href: "/explore",       label: "All Developers",  icon: Users,          desc: `${stats.users} registered` },
              { href: "/explore",       label: "All Projects",    icon: FolderGit2,     desc: `${stats.projects} projects` },
              { href: "/activity",      label: "Activity Feed",   icon: Activity,       desc: `${stats.activities} events` },
              { href: "/explore",       label: "Opportunities",   icon: Briefcase,      desc: "Active listings" },
              { href: "/repo-requests", label: "Repo Requests",   icon: KeyRound,       desc: "Access management" },
              { href: "/connections",   label: "Connections",     icon: MessageSquare,  desc: `${stats.connections} connections` },
            ].map(({ href, label, icon: Icon, desc }) => (
              <Link key={label} href={href}
                className="surface-card border border-subtle rounded-sm p-4 hover:border-amber-500/40 transition group shadow-sm">
                <Icon className="h-5 w-5 text-amber-500 mb-2" />
                <p className="text-xs font-semibold text-primary group-hover:text-amber-500 transition font-mono">{label}</p>
                <p className="text-[11px] text-muted mt-0.5 font-mono">{desc}</p>
              </Link>
            ))}
          </div>

          <div className="surface-card border border-subtle rounded-sm p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-primary font-mono mb-3 flex items-center gap-2">
              <GitPullRequest className="h-3.5 w-3.5 text-amber-500" />Access Request Breakdown
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Pending",   value: stats.accessRequests.pending,   cls: "text-amber-500 border-amber-500/20 bg-amber-500/10" },
                { label: "Processed", value: stats.accessRequests.processed, cls: "text-green-500 border-green-500/20 bg-green-500/10" },
                { label: "Total",     value: stats.accessRequests.total,     cls: "text-primary border-subtle surface-input" },
              ].map(({ label, value, cls }) => (
                <div key={label} className={`text-center p-3 border rounded-sm ${cls}`}>
                  <p className="text-lg font-bold font-mono">{value}</p>
                  <p className="text-[11px] text-muted font-mono mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-muted font-mono text-xs">Failed to load stats</div>
      )}
    </div>
  );
}
