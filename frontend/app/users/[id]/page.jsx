"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersAPI, profileDataAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import {
  FolderIcon,
  UsersIcon,
  ExternalLinkIcon,
  MapPinIcon,
  GlobeIcon,
  ClockIcon,
  TrophyIcon,
  SettingsIcon,
  ActivityIcon,
  ShieldIcon,
  GitPrIcon,
  CopyIcon,
  TerminalIcon,
  CpuIcon,
  ChatIcon,
} from "@/components/icons";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";
import { ProfileSkeleton } from "@/components/Skeleton";
import Link from "next/link";
import { useState } from "react";

function ActivityHeatmap({ grid = {} }) {
  const today = new Date();
  const weeks = [];
  for (let w = 51; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - w * 7 - today.getDay());
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      total += grid[day.toISOString().slice(0, 10)] ?? 0;
    }
    weeks.push({ startDate: weekStart.toISOString().slice(0, 10), total });
  }

  const maxWeek = Math.max(...weeks.map((w) => w.total), 1);
  const getColor = (n) => {
    if (n === 0) return "bg-[#141b27]";
    const pct = n / maxWeek;
    if (pct <= 0.25) return "bg-[#78350f]";
    if (pct <= 0.5) return "bg-[#b45309]";
    if (pct <= 0.75) return "bg-[#d97706]";
    return "bg-[#f59e0b]";
  };

  const totalContribs = weeks.reduce((s, w) => s + w.total, 0);
  const maxWeekVal = Math.max(...weeks.map((w) => w.total));
  const activeWeeks = weeks.filter((w) => w.total > 0).length;

  return (
    <div className="space-y-3 w-full overflow-hidden bg-[#10151f] border border-[#20293b] rounded-sm p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1c2434] pb-2.5">
        <div>
          <h3 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
            <ActivityIcon className="h-3.5 w-3.5 text-amber-400" />
            52-Week Contribution Matrix
          </h3>
          <p className="text-[11px] text-gray-500 font-sans">
            Verified repository commits, bug resolutions, and merged pull requests
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div>
            <span className="text-gray-500">Total: </span>
            <span className="text-amber-400 font-bold">{totalContribs}</span>
          </div>
          <div>
            <span className="text-gray-500">Active: </span>
            <span className="text-gray-200 font-bold">{activeWeeks} wks</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex flex-col gap-1 min-w-max">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-gray-500 w-12 flex-shrink-0">W1-26</span>
            <div className="flex gap-1">
              {weeks.slice(0, 26).map((wk, i) => (
                <div
                  key={i}
                  title={`Week of ${wk.startDate}: ${wk.total} events`}
                  className={`w-3.5 h-3.5 rounded-[1px] border border-[#1b2332] ${getColor(
                    wk.total
                  )}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-gray-500 w-12 flex-shrink-0">W27-52</span>
            <div className="flex gap-1">
              {weeks.slice(26, 52).map((wk, i) => (
                <div
                  key={i}
                  title={`Week of ${wk.startDate}: ${wk.total} events`}
                  className={`w-3.5 h-3.5 rounded-[1px] border border-[#1b2332] ${getColor(
                    wk.total
                  )}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id;
  const { user: me } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: profileFull, isLoading, error } = useQuery({
    queryKey: ["publicProfile", userId],
    queryFn: async () => {
      const { data } = await profileDataAPI.getPublicProfile(userId);
      return data;
    },
    enabled: !!userId,
  });

  const { data: userProjects } = useQuery({
    queryKey: ["userProjectsPublic", userId],
    queryFn: async () => {
      const { data } = await usersAPI.getUserProjects(userId);
      return data;
    },
    enabled: !!userId && !error,
  });

  if (isLoading) return <ProfileSkeleton />;

  if (error?.response?.status === 403) {
    return (
      <div className="text-center py-20 bg-[#10151f] rounded-sm border border-[#20293b] p-6 space-y-2 font-mono">
        <ShieldIcon className="h-10 w-10 mx-auto text-amber-500" />
        <p className="text-gray-100 font-bold text-sm">Private Developer Profile</p>
        <p className="text-xs text-gray-500 font-sans">
          This developer has restricted profile visibility.
        </p>
      </div>
    );
  }

  if (!profileFull) {
    return (
      <div className="text-center py-20 text-gray-500 font-mono text-xs">
        Developer record not found.
      </div>
    );
  }

  const profile = profileFull.user;
  const stats = profileFull.stats;
  const streak = profileFull.streak;
  const badges = profileFull.badges ?? [];
  const allDefs = profileFull.allBadgeDefs ?? badges;
  const earnedKeys = new Set(badges.map((b) => b.badgeKey));
  const isSelf = me?.id === userId;
  const projectsList = userProjects?.projects || [];

  const copyProfileLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast.success("Profile URL copied to clipboard", "Share");
      });
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full pb-12 font-sans">
      {/* ── WORKSTATION HEADER ────────────────────────────────────────────── */}
      <div className="bg-[#10151f] border border-[#20293b] rounded-sm p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 opacity-90" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-14 h-14 rounded-sm object-cover border border-[#29354a]"
                />
              ) : (
                <div className="w-14 h-14 rounded-sm bg-[#17202d] border border-[#29354a] flex items-center justify-center font-mono font-bold text-amber-400 text-xl">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#10151f] rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-gray-100 font-sans tracking-tight">
                  {profile.username}
                </h1>
                <span className="text-xs font-mono text-gray-400 bg-[#151c28] px-1.5 py-0.5 border border-[#222c3d] rounded-[2px]">
                  @{profile.githubUsername || profile.username}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded-[2px]">
                  CONTRIBUTOR
                </span>
              </div>

              {profile.bio && (
                <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
                  {profile.bio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-gray-500">
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3 text-gray-400" />
                    {profile.location}
                  </span>
                )}
                {profile.availabilityHours && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ClockIcon className="h-3 w-3" />
                    {profile.availabilityHours}h/wk available
                  </span>
                )}
                {profile.githubProfileUrl && (
                  <a
                    href={profile.githubProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sky-400 hover:underline"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    GitHub
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Connect / Message Actions */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            {!isSelf ? (
              <>
                <ConnectButton userId={userId} />
                <Link
                  href={`/messages?user=${userId}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#17202d] hover:bg-[#202c3e] text-gray-200 border border-[#273449] text-xs font-mono rounded-sm transition"
                >
                  <ChatIcon className="h-3 w-3 text-amber-400" />
                  <span>Message</span>
                </Link>
              </>
            ) : (
              <Link
                href="/settings"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#17202d] hover:bg-[#202c3e] text-gray-200 border border-[#273449] text-xs font-mono rounded-sm transition"
              >
                <SettingsIcon className="h-3 w-3 text-amber-400" />
                <span>Edit Settings</span>
              </Link>
            )}

            <button
              onClick={copyProfileLink}
              className="p-1.5 text-gray-400 hover:text-white bg-[#17202d] border border-[#273449] rounded-sm transition"
              title="Copy Profile URL"
            >
              <CopyIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TELEMETRY STATS GRID ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: "REPOSITORIES", value: stats?.projects ?? 0, icon: FolderIcon, accent: "text-sky-400" },
          { label: "CONTRIBUTIONS", value: stats?.contributions ?? 0, icon: GitPrIcon, accent: "text-emerald-400" },
          { label: "CONNECTIONS", value: stats?.connections ?? 0, icon: UsersIcon, accent: "text-amber-400" },
          { label: "AI RATING", value: profile?.aiReputationScore ? `${profile.aiReputationScore}/100` : "PENDING", icon: CpuIcon, accent: "text-amber-400" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="bg-[#10151f] border border-[#20293b] rounded-sm p-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider">{item.label}</span>
                <Icon className="h-3.5 w-3.5 text-gray-400" />
              </div>
              <div className={`text-xl font-mono font-bold ${item.accent}`}>{item.value}</div>
            </div>
          );
        })}
      </div>

      {/* ── 52-WEEK HEATMAP ─────────────────────────────────────────────────── */}
      <ActivityHeatmap grid={streak?.activityGrid ?? {}} />

      {/* ── WORKSTATION TABBED CONTENT ──────────────────────────────────────── */}
      <div className="surface-card border border-subtle rounded-sm overflow-hidden">
        <div className="flex border-b border-subtle surface-sidebar px-2 pt-2 gap-1 overflow-x-auto scrollbar-hide">
          {[
            { id: "overview", label: "Overview & Stack" },
            { id: "projects", label: `Repositories (${projectsList.length})` },
            { id: "badges", label: `Achievements (${badges.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 text-xs font-mono font-medium rounded-t-sm transition border-t border-x ${
                activeTab === tab.id
                  ? "surface-card text-amber-500 border-subtle border-b-transparent font-bold"
                  : "text-muted hover:text-primary border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-2">
                  Technical Stack
                </h4>
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((s, i) => (
                      <span
                        key={i}
                        className="text-xs font-mono text-gray-200 bg-[#161d2a] border border-[#243044] px-2.5 py-1 rounded-[2px]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-gray-500">No public skills listed.</p>
                )}
              </div>

              {profile.openForPaidWork && (
                <div className="bg-[#141b27] border border-[#222d3f] p-3.5 rounded-sm">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
                    Open for Paid Contributions
                  </h4>
                  <p className="text-xs text-gray-400 font-sans">
                    Available for feature development, security audits, and code review consulting.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-2.5">
              {projectsList.length === 0 ? (
                <p className="text-xs font-mono text-gray-500 text-center py-6">
                  No public repositories shared yet.
                </p>
              ) : (
                projectsList.map((proj) => (
                  <div
                    key={proj.id}
                    className="bg-[#141b27] border border-[#222d3f] rounded-sm p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${proj.id}`}
                        className="text-xs font-mono font-bold text-gray-100 hover:text-amber-400 block truncate"
                      >
                        {proj.title}
                      </Link>
                      <p className="text-xs text-gray-400 line-clamp-1">{proj.description}</p>
                    </div>
                    {proj.deployedUrl && (
                      <a
                        href={proj.deployedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1 flex-shrink-0"
                      >
                        <ExternalLinkIcon className="h-3 w-3" /> Live
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "badges" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allDefs.map((badge) => {
                const earned = earnedKeys.has(badge.key);
                return (
                  <div
                    key={badge.key}
                    className={`p-3 rounded-sm border transition flex items-center gap-3 ${
                      earned
                        ? "bg-[#141b27] border-[#29364d]"
                        : "bg-[#0f141e] border-[#1c2434] opacity-40"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-sm bg-[#1b2332] border border-[#2d3b52] flex items-center justify-center text-amber-400 flex-shrink-0">
                      <TrophyIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-mono font-bold text-gray-200 truncate block">
                        {badge.label}
                      </span>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5 font-sans">
                        {badge.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
