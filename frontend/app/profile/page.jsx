"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { profileDataAPI, usersAPI } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import {
  FolderIcon,
  UsersIcon,
  ExternalLinkIcon,
  MapPinIcon,
  GlobeIcon,
  ClockIcon,
  TrophyIcon,
  FlameIcon,
  SettingsIcon,
  BookmarkIcon,
  ActivityIcon,
  ShieldIcon,
  GitPrIcon,
  LogOutIcon,
  CopyIcon,
  CheckIcon,
  TerminalIcon,
  CpuIcon,
} from "@/components/icons";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";

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
      const key = day.toISOString().slice(0, 10);
      total += grid[key] ?? 0;
    }
    weeks.push({ weekKey: `W${52 - w}`, total, startDate: weekStart.toISOString().slice(0, 10) });
  }

  const maxWeek = Math.max(...weeks.map((w) => w.total), 1);

  // Amber/Gold developer terminal scale (never purple or harsh gradients)
  const getColor = (n) => {
    if (n === 0) return "bg-[#141b27]";
    const pct = n / maxWeek;
    if (pct <= 0.25) return "bg-[#78350f]";
    if (pct <= 0.5) return "bg-[#b45309]";
    if (pct <= 0.75) return "bg-[#d97706]";
    return "bg-[#f59e0b]";
  };

  const totalContribs = weeks.reduce((s, w) => s + w.total, 0);
  const maxContribWeek = weeks.reduce((best, w) => (w.total > best.total ? w : best), weeks[0]);
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
            Continuous activity across repositories, bug reports, and pull requests
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
          <div>
            <span className="text-gray-500">Peak: </span>
            <span className="text-gray-200 font-bold">{maxContribWeek?.total ?? 0}/wk</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex flex-col gap-1 min-w-max">
          {/* Row 1: Weeks 1 to 26 */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-gray-500 w-12 flex-shrink-0">W1-26</span>
            <div className="flex gap-1">
              {weeks.slice(0, 26).map((wk, i) => (
                <div
                  key={i}
                  title={`Week of ${wk.startDate}: ${wk.total} events`}
                  className={`w-3.5 h-3.5 rounded-[1px] cursor-default border border-[#1b2332] ${getColor(
                    wk.total
                  )}`}
                />
              ))}
            </div>
          </div>

          {/* Row 2: Weeks 27 to 52 */}
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

        {/* Legend */}
        <div className="flex items-center gap-1.5 mt-2.5 pl-13">
          <span className="text-[10px] font-mono text-gray-500">Low</span>
          {["bg-[#141b27]", "bg-[#78350f]", "bg-[#b45309]", "bg-[#d97706]", "bg-[#f59e0b]"].map(
            (c) => (
              <div key={c} className={`w-2.5 h-2.5 rounded-[1px] border border-[#1b2332] ${c}`} />
            )
          )}
          <span className="text-[10px] font-mono text-gray-500">High</span>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [confirmLogout, setConfirmLogout] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["fullProfile", user?.id],
    queryFn: async () => {
      const { data } = await profileDataAPI.getMyProfile();
      return data;
    },
    enabled: !!user,
    staleTime: 60000,
  });

  const { data: myProjects } = useQuery({
    queryKey: ["userProjects", user?.id],
    queryFn: async () => {
      const { data } = await usersAPI.getUserProjects(user.id);
      return data;
    },
    enabled: !!user,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400 font-mono text-xs">
        Authentication required. Please connect with GitHub.
      </div>
    );
  }

  const p = profile;
  const streak = p?.streak;
  const rep = p?.reputation;
  const earnedKeys = new Set((p?.badges ?? []).map((b) => b.badgeKey));
  const allDefs = p?.allBadgeDefs ?? [];
  const projectsList = myProjects?.projects || [];

  const copyProfileLink = () => {
    const url = `${window.location.origin}/users/${user.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Profile URL copied to clipboard", "Workstation");
      });
    }
  };

  const copyHandle = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`@${user.githubUsername || user.username}`).then(() => {
        toast.info("Developer handle copied", "Workstation");
      });
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full pb-12 font-sans">
      {/* ── WORKSTATION HEADER BAR ────────────────────────────────────────── */}
      <div className="bg-[#10151f] border border-[#20293b] rounded-sm p-4 sm:p-5 relative overflow-hidden">
        {/* Subtle accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-amber-500 opacity-90" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Identity & Status */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-14 h-14 rounded-sm object-cover border border-[#29354a]"
                />
              ) : (
                <div className="w-14 h-14 rounded-sm bg-[#17202d] border border-[#29354a] flex items-center justify-center">
                  <span className="text-xl font-mono font-bold text-amber-400">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#10151f] rounded-full" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-gray-100 tracking-tight font-sans">
                  {user.username}
                </h1>
                <button
                  onClick={copyHandle}
                  className="text-xs font-mono text-gray-400 hover:text-amber-400 transition flex items-center gap-1 bg-[#151c28] px-1.5 py-0.5 border border-[#222c3d] rounded-[2px]"
                  title="Click to copy handle"
                >
                  <span>@{user.githubUsername || user.username}</span>
                  <CopyIcon className="h-3 w-3" />
                </button>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-1.5 py-0.5 rounded-[2px]">
                  VERIFIED BUILDER
                </span>
              </div>

              {user.bio && (
                <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
                  {user.bio}
                </p>
              )}

              {/* Quick Metadata Strip */}
              <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-gray-500">
                {user.location && (
                  <span className="flex items-center gap-1">
                    <MapPinIcon className="h-3 w-3 text-gray-400" />
                    {user.location}
                  </span>
                )}
                {user.availabilityHours && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <ClockIcon className="h-3 w-3" />
                    {user.availabilityHours}h/wk available
                  </span>
                )}
                {user.githubProfileUrl && (
                  <a
                    href={user.githubProfileUrl}
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

          {/* Action Buttons Strip */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={copyProfileLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#17202d] hover:bg-[#202c3e] text-gray-200 border border-[#273449] text-xs font-mono rounded-sm transition"
              title="Share profile URL"
            >
              <CopyIcon className="h-3 w-3 text-amber-400" />
              <span>Share</span>
            </button>

            <Link
              href="/settings"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#17202d] hover:bg-[#202c3e] text-gray-200 border border-[#273449] text-xs font-mono rounded-sm transition"
            >
              <SettingsIcon className="h-3 w-3 text-gray-400" />
              <span>Settings</span>
            </Link>

            <button
              onClick={() => setConfirmLogout(true)}
              className="p-1.5 text-gray-400 hover:text-red-400 bg-[#17202d] border border-[#273449] rounded-sm transition"
              title="Sign out"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── TELEMETRY STATS GRID (4 PANELS) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          {
            label: "REPOSITORIES",
            value: p?.stats?.projects ?? 0,
            icon: FolderIcon,
            accent: "text-sky-400",
            border: "border-sky-800/40",
          },
          {
            label: "CONTRIBUTIONS",
            value: p?.stats?.contributions ?? 0,
            icon: GitPrIcon,
            accent: "text-emerald-400",
            border: "border-emerald-800/40",
          },
          {
            label: "CONNECTIONS",
            value: p?.stats?.connections ?? 0,
            icon: UsersIcon,
            accent: "text-amber-400",
            border: "border-amber-800/40",
          },
          {
            label: "AI RATING",
            value: p?.aiReputation?.score ? `${p.aiReputation.score}/100` : "UNSCORRED",
            sub: p?.aiReputation?.tier ? `${p.aiReputation.tier} TIER` : "AUDIT PENDING",
            icon: CpuIcon,
            accent: "text-amber-400",
            border: "border-amber-800/40",
          },
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
              {item.sub && (
                <div className="text-[10px] font-mono text-gray-500 mt-0.5">{item.sub}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 52-WEEK ACTIVITY MATRIX ─────────────────────────────────────────── */}
      <ActivityHeatmap grid={streak?.activityGrid ?? {}} />

      {/* ── INTERACTIVE WORKSTATION TABS ────────────────────────────────────── */}
      <div className="surface-card border border-subtle rounded-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex border-b border-subtle surface-sidebar px-2 pt-2 gap-1 overflow-x-auto scrollbar-hide">
          {[
            { id: "overview", label: "Workstation Overview" },
            { id: "projects", label: `Projects (${projectsList.length})` },
            { id: "mentor", label: "AI Quality Audit" },
            { id: "badges", label: `Achievements (${p?.badges?.length ?? 0})` },
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

        {/* Tab Content Panes */}
        <div className="p-4 sm:p-5">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Skills Matrix */}
              <div>
                <h4 className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <TerminalIcon className="h-3.5 w-3.5 text-amber-400" />
                  Technical Stack & Proficiencies
                </h4>
                {user.skills && user.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono text-gray-200 bg-[#161d2a] border border-[#243044] px-2.5 py-1 rounded-[2px]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-mono text-gray-500">
                    No skills configured yet. Add them in Settings.
                  </p>
                )}
              </div>

              {/* Contributor Pricing / Roles */}
              <div className="bg-[#141b27] border border-[#222d3f] rounded-sm p-3.5">
                <h4 className="text-xs font-mono font-bold text-gray-200 uppercase tracking-wider mb-2">
                  Contribution Model & Rates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                  <div className="bg-[#0f141e] p-2.5 rounded-[2px] border border-[#1e2738]">
                    <span className="text-gray-500 block text-[10px]">TIER LEVEL</span>
                    <span className="text-amber-400 font-bold">{user.contributorTier || "TESTER"}</span>
                  </div>
                  <div className="bg-[#0f141e] p-2.5 rounded-[2px] border border-[#1e2738]">
                    <span className="text-gray-500 block text-[10px]">BUG FIX RATE</span>
                    <span className="text-gray-200 font-bold">
                      {user.pricePerBug ? `$${user.pricePerBug}/bug` : "Community Free"}
                    </span>
                  </div>
                  <div className="bg-[#0f141e] p-2.5 rounded-[2px] border border-[#1e2738]">
                    <span className="text-gray-500 block text-[10px]">HOURLY ENGAGEMENT</span>
                    <span className="text-gray-200 font-bold">
                      {user.hourlyRate ? `$${user.hourlyRate}/hr` : "Open for Collaboration"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === "projects" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400">
                  {projectsList.length} public and private repositories
                </span>
                <Link
                  href="/projects/new"
                  className="text-xs font-mono text-gray-950 font-bold bg-amber-500 hover:bg-amber-400 px-3 py-1 rounded-sm transition"
                >
                  + New Repository
                </Link>
              </div>

              {projectsList.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-[#232e42] rounded-sm p-6 text-gray-500 text-xs font-mono">
                  No repositories published yet. Click &apos;New Repository&apos; to showcase your code.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {projectsList.map((proj) => (
                    <div
                      key={proj.id}
                      className="bg-[#141b27] border border-[#222d3f] hover:border-[#384964] rounded-sm p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/projects/${proj.id}`}
                            className="text-xs font-bold text-gray-100 hover:text-amber-400 font-mono truncate"
                          >
                            {proj.title}
                          </Link>
                          <span className="text-[10px] font-mono text-gray-500 uppercase px-1.5 py-0.2 bg-[#1b2332] rounded-[2px]">
                            {proj.visibility}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">
                          {proj.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {proj.deployedUrl && (
                          <a
                            href={proj.deployedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-mono text-sky-400 hover:underline flex items-center gap-1"
                          >
                            <ExternalLinkIcon className="h-3 w-3" /> Live
                          </a>
                        )}
                        <Link
                          href={`/projects/${proj.id}`}
                          className="text-xs font-mono text-gray-300 bg-[#1b2434] hover:bg-[#253248] px-2.5 py-1 rounded-[2px] border border-[#2c3a50]"
                        >
                          Inspect
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AI MENTOR AUDIT */}
          {activeTab === "mentor" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141b27] border border-[#222d3f] p-4 rounded-sm">
                <div>
                  <h4 className="text-xs font-mono font-bold text-gray-100 uppercase">
                    AI Principal Engineering Score
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Evaluated across 8 engineering dimensions from public GitHub repositories
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-2xl font-mono font-bold text-amber-400">
                      {p?.aiReputation?.score ?? "--"}
                    </span>
                    <span className="text-xs font-mono text-gray-500">/100</span>
                  </div>
                  <Link
                    href="/mentor"
                    className="text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 px-3.5 py-1.5 rounded-sm transition"
                  >
                    View Audit Report
                  </Link>
                </div>
              </div>

              {/* Dimension Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { name: "Code Quality", weight: "20%" },
                  { name: "Architecture & Modularity", weight: "18%" },
                  { name: "Testing Coverage", weight: "15%" },
                  { name: "Documentation", weight: "10%" },
                  { name: "Security & Secret Hygiene", weight: "10%" },
                  { name: "CI/CD & DevOps", weight: "10%" },
                  { name: "Open Source Engagement", weight: "10%" },
                  { name: "Commit Consistency", weight: "7%" },
                ].map((dim, i) => (
                  <div
                    key={i}
                    className="bg-[#141b27] border border-[#222d3f] p-3 rounded-sm flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-mono text-gray-200 block">{dim.name}</span>
                      <span className="text-[10px] font-mono text-gray-500">Weight: {dim.weight}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400">Audited</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: BADGES */}
          {activeTab === "badges" && (
            <div className="space-y-3">
              <p className="text-xs font-mono text-gray-400">
                Engineering milestones awarded through real verified activities.
              </p>
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-gray-200 truncate">
                            {badge.label}
                          </span>
                          {earned && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.2 rounded-[2px]">
                              UNLOCKED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400 truncate mt-0.5 font-sans">
                          {badge.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logout Modal */}
      {confirmLogout && (
        <LogoutConfirmModal
          onConfirm={logout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  );
}
