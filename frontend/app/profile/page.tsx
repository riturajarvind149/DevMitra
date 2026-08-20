"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { profileDataAPI, usersAPI } from "@/lib/api";
import {
  Calendar, FolderGit2, Users, ExternalLink,
  MapPin, Globe, Clock, Link2, Flame, Trophy,
  TrendingUp, Zap, Star, Heart,
  DollarSign, Shield, Settings, Bookmark, Activity,
  KeyRound, AlertTriangle, GitPullRequest, LogOut,
  X, ChevronRight, Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import LogoutConfirmModal from "@/components/LogoutConfirmModal";

function ActivityHeatmap({ grid }: { grid: Record<string, number> }) {
  const today = new Date();
  // Build 52-week array: each entry = total contributions that week
  const weeks: { weekKey: string; total: number; startDate: string }[] = [];
  for (let w = 51; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (w * 7) - today.getDay());
    let total = 0;
    let maxDay = "";
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      const key = day.toISOString().slice(0, 10);
      total += grid[key] ?? 0;
      if (!maxDay) maxDay = key;
    }
    weeks.push({ weekKey: `W${52 - w}`, total, startDate: weekStart.toISOString().slice(0, 10) });
  }

  const maxWeek = Math.max(...weeks.map(w => w.total), 1);
  const getColor = (n: number) => {
    if (n === 0) return "bg-gray-800";
    const pct = n / maxWeek;
    if (pct <= 0.25) return "bg-indigo-900";
    if (pct <= 0.5)  return "bg-indigo-700";
    if (pct <= 0.75) return "bg-indigo-500";
    return "bg-indigo-400";
  };

  // Compute stats
  const totalContribs = weeks.reduce((s, w) => s + w.total, 0);
  const maxContribWeek = weeks.reduce((best, w) => w.total > best.total ? w : best, weeks[0]);
  const activeWeeks = weeks.filter(w => w.total > 0).length;

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 items-start w-full min-w-0 max-w-full">
        {/* Heatmap — 2 lines (26 weeks per row) */}
        <div className="w-full sm:flex-1 min-w-0 max-w-full overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex flex-col gap-1.5 min-w-max pb-1">
            {/* Top row: Weeks 1 - 26 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-medium text-gray-500 w-10 flex-shrink-0">W1–26</span>
              <div className="flex gap-1">
                {weeks.slice(0, 26).map((wk, i) => (
                  <div
                    key={i}
                    title={`Week of ${wk.startDate}: ${wk.total} contributions`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm cursor-default transition-all hover:scale-125 flex-shrink-0 ${getColor(wk.total)}`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom row: Weeks 27 - 52 */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-medium text-gray-500 w-10 flex-shrink-0">W27–52</span>
              <div className="flex gap-1">
                {weeks.slice(26, 52).map((wk, i) => (
                  <div
                    key={i}
                    title={`Week of ${wk.startDate}: ${wk.total} contributions`}
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm cursor-default transition-all hover:scale-125 flex-shrink-0 ${getColor(wk.total)}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 pl-11">
            <span className="text-[10px] text-gray-600">Less</span>
            {["bg-gray-800","bg-indigo-900","bg-indigo-700","bg-indigo-500","bg-indigo-400"].map(c => (
              <div key={c} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm flex-shrink-0 ${c}`} />
            ))}
            <span className="text-[10px] text-gray-600">More</span>
          </div>
        </div>

        {/* Stats box — right side */}
        <div className="w-full sm:w-44 flex-shrink-0 bg-gray-800/60 rounded-xl border border-gray-700/50 p-3 space-y-2">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Contribution Stats</p>
          {[
            { label: "Total contributions", value: totalContribs },
            { label: "Max in a week",       value: maxContribWeek?.total ?? 0 },
            { label: "Active weeks",         value: activeWeeks },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-[10px] text-gray-500 leading-tight">{label}</span>
              <span className="text-xs font-bold text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge, earned }: { badge: any; earned: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition ${
      earned ? "border-gray-700 bg-gray-800/60" : "border-gray-800 opacity-40 grayscale"
    }`}>
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-base flex-shrink-0`}>
        {badge.icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{badge.label}</p>
        <p className="text-[10px] text-gray-500 truncate">{badge.desc}</p>
      </div>
    </div>
  );
}

function ReputationRing({ score, level, label, next }: { score: number; level: number; label: string; next: number | null }) {
  const pct = next ? Math.min((score / next) * 100, 100) : 100;
  const r = 36; const circ = 2 * Math.PI * r; const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="44" cy="44" r={r} fill="none" stroke="url(#rg)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} />
          <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{level}</span>
          <span className="text-[9px] text-gray-400 uppercase tracking-wider">Level</span>
        </div>
      </div>
      <p className="text-sm font-bold text-white mt-1">{label}</p>
      <p className="text-[10px] text-gray-500">{score.toLocaleString()} pts</p>
      {next && <p className="text-[10px] text-indigo-400">{(next - score).toLocaleString()} to Lv {level + 1}</p>}
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["fullProfile", user?.id],
    queryFn: async () => { const { data } = await profileDataAPI.getMyProfile(); return data; },
    enabled: !!user, staleTime: 60000,
  });

  const { data: myProjects } = useQuery({
    queryKey: ["userProjects", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserProjects(user!.id); return data; },
    enabled: !!user,
  });

  if (!isAuthenticated || !user) return (
    <div className="flex items-center justify-center py-20 text-gray-400">Please login</div>
  );

  const p = profile;
  const streak = p?.streak;
  const rep = p?.reputation;
  const earnedKeys = new Set((p?.badges ?? []).map((b: any) => b.badgeKey));
  const allDefs = p?.allBadgeDefs ?? [];

  return (
    <div className="min-h-screen bg-gray-950 space-y-4 overflow-x-hidden w-full min-w-0 max-w-full">

      {/* ── Mobile/Tablet Dedicated Profile Top Header (lg:hidden) ────────── */}
      <div className="sticky -top-4 sm:-top-6 -mx-3 sm:-mx-6 -mt-4 sm:-mt-6 mb-3 px-4 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between z-30 lg:hidden">
        <span className="font-bold text-white text-base truncate">
          @{user.githubUsername || user.username}
        </span>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Account Settings & Menu"
          className="p-2 text-gray-300 hover:text-white rounded-xl bg-gray-800 border border-gray-700 transition flex items-center justify-center"
        >
          <Settings className="h-5 w-5 text-indigo-400" />
        </button>
      </div>

      {/* ── Mobile/Tablet Compact Hero Card (lg:hidden) ───────────────────── */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden w-full min-w-0 max-w-full lg:hidden">
        <div className="h-16 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900" />
        <div className="px-4 pb-4 relative">
          <div className="flex items-center gap-3 -mt-6 mb-3">
            <div className="relative flex-shrink-0">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.username} className="w-16 h-16 rounded-2xl border-4 border-gray-900 block object-cover" />
                : <div className="w-16 h-16 rounded-2xl border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                  </div>
              }
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
            </div>

            <div className="flex-1 min-w-0 pt-6">
              <h1 className="text-base font-bold text-white truncate">{user.username}</h1>
              {user.githubUsername && <p className="text-xs text-gray-400 truncate">@{user.githubUsername}</p>}

              <div className="grid grid-cols-4 gap-1 mt-2 text-center border-t border-gray-800/80 pt-2">
                {[
                  { label: "Projects",      value: p?.stats?.projects ?? 0,      color: "text-indigo-400" },
                  { label: "Contribs",      value: p?.stats?.contributions ?? 0, color: "text-green-400" },
                  { label: "Connect",       value: p?.stats?.connections ?? 0,   color: "text-blue-400" },
                  { label: "Likes",         value: p?.stats?.likesReceived ?? 0, color: "text-red-400" },
                ].map(({ label, value, color }) => (
                  <div key={label}>
                    <div className={`text-base font-extrabold ${color}`}>{value}</div>
                    <div className="text-[9px] text-gray-500 leading-none mt-0.5 truncate">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Link href="/settings" className="flex-1 text-center text-xs font-medium text-white border border-gray-700 bg-gray-800/60 py-1.5 rounded-xl hover:bg-gray-800 transition">
                Edit Profile
              </Link>
            </div>

            {user.bio && <p className="text-xs text-gray-300 leading-relaxed">{user.bio}</p>}

            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {user.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{user.location}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
              {user.website && <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400"><Globe className="h-3 w-3" />Website</a>}
              {user.githubProfileUrl && <a href={user.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400"><ExternalLink className="h-3 w-3" />GitHub</a>}
            </div>

            {user.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {user.skills.map((s, i) => (
                  <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2 py-0.5 rounded-full font-medium">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop Full Hero Card (hidden lg:block) ──────────────────────── */}
      <div className="hidden lg:block bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900" />
        <div className="px-6 pb-6 relative">
          <div className="relative inline-block -mt-10 mb-3">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.username} className="w-20 h-20 rounded-2xl border-4 border-gray-900 block" />
              : <div className="w-20 h-20 rounded-2xl border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                </div>
            }
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-gray-900" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/settings" className="text-xs font-medium text-white border border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-800 transition">
              Edit Profile
            </Link>
          </div>
          <h1 className="text-xl font-bold text-white">{user.username}</h1>
          {user.githubUsername && <p className="text-sm text-gray-400">@{user.githubUsername}</p>}
          {user.bio && <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-lg">{user.bio}</p>}
          <div className="flex flex-wrap gap-3 mt-3">
            {user.location && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
            <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="h-3.5 w-3.5" />Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</span>
            {user.website && <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"><Globe className="h-3.5 w-3.5" />Website</a>}
            {user.githubProfileUrl && <a href={user.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"><ExternalLink className="h-3.5 w-3.5" />GitHub</a>}
            {(user as any).linkedinUrl && <a href={(user as any).linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Link2 className="h-3.5 w-3.5" />LinkedIn</a>}
            {(user as any).availabilityHours && <span className="flex items-center gap-1 text-xs text-green-400"><Clock className="h-3.5 w-3.5" />{(user as any).availabilityHours}h/wk available</span>}
          </div>
          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {user.skills.map((s, i) => (
                <span key={i} className="text-xs text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          )}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-800 text-center">
            {[
              { label: "Projects",      value: p?.stats?.projects ?? 0,      color: "text-indigo-400" },
              { label: "Contributions", value: p?.stats?.contributions ?? 0, color: "text-green-400" },
              { label: "Connections",   value: p?.stats?.connections ?? 0,   color: "text-blue-400" },
              { label: "Likes Received",value: p?.stats?.likesReceived ?? 0, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full min-w-0 max-w-full">

        {/* LEFT — streak, reputation, heatmap, projects */}
        <div className="w-full lg:flex-1 min-w-0 max-w-full space-y-4">

          {/* AI Mentor Reputation Engine Card */}
          <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-neutral-900 rounded-2xl border border-indigo-500/30 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                    <span>AI Mentor Engineering Rating</span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                      Live GitHub Evidence
                    </span>
                  </h2>
                  <p className="text-xs text-gray-400">Verified evidence-backed score & gap diagnosis</p>
                </div>
              </div>

              {p?.aiReputation ? (
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-baseline gap-1 justify-end">
                      <span className="text-2xl font-black text-white">{p.aiReputation.score}</span>
                      <span className="text-xs text-gray-400">/100</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/40">
                      {p.aiReputation.tier} TIER
                    </span>
                  </div>
                  <Link
                    href="/mentor"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg whitespace-nowrap"
                  >
                    View Report →
                  </Link>
                </div>
              ) : (
                <Link
                  href="/mentor"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition flex items-center gap-1.5 shadow-lg whitespace-nowrap self-start sm:self-auto"
                >
                  Run AI Analysis →
                </Link>
              )}
            </div>
          </div>

          {/* Streak + Reputation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full min-w-0 max-w-full">
            {/* Contribution Streak Card */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />Contribution Streak
              </h2>
              {/* Streak main status */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-800/80">
                <div className="text-center flex-shrink-0 min-w-[64px] border-r border-gray-800 pr-3">
                  <div className="text-3xl font-black text-orange-400">{streak?.currentStreak ?? 0}</div>
                  <div className="text-[10px] text-gray-500 font-medium mt-0.5 uppercase tracking-wide">Current</div>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Daily Progress</span>
                    <span className="text-orange-300 font-bold">{streak?.currentStreak ?? 0}d active</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(7)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-2 rounded-full ${
                          i < Math.min(streak?.currentStreak ?? 0, 7) ? "bg-orange-400" : "bg-gray-800"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 4 Individual Pill-Box Stat Cards */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-800/40 border border-gray-800/80">
                  <span className="text-[11px] text-gray-400">Longest</span>
                  <span className="text-xs font-bold text-white bg-gray-800 px-2 py-0.5 rounded-md">{streak?.longestStreak ?? 0}d</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-800/40 border border-gray-800/80">
                  <span className="text-[11px] text-gray-400">Total</span>
                  <span className="text-xs font-bold text-white bg-gray-800 px-2 py-0.5 rounded-md">{streak?.totalActiveDays ?? 0}d</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-800/40 border border-gray-800/80">
                  <span className="text-[11px] text-gray-400">Weekly</span>
                  <span className="text-xs font-bold text-orange-300 bg-orange-950/40 border border-orange-800/40 px-2 py-0.5 rounded-md">{streak?.weeklyStreak ?? 0} wks</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-gray-800/40 border border-gray-800/80">
                  <span className="text-[11px] text-gray-400">Monthly</span>
                  <span className="text-xs font-bold text-orange-300 bg-orange-950/40 border border-orange-800/40 px-2 py-0.5 rounded-md">{streak?.monthlyStreak ?? 0} mo</span>
                </div>
              </div>

              {/* 4-Badge Milestone Row */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-gray-800/80">
                {[
                  { days: 3, icon: "🔥", label: "3d" },
                  { days: 7, icon: "⚡", label: "7d" },
                  { days: 14, icon: "💫", label: "14d" },
                  { days: 30, icon: "💎", label: "30d" },
                ].map(({ days, icon, label }) => (
                  <div
                    key={days}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl border text-center min-w-0 ${
                      (streak?.longestStreak ?? 0) >= days
                        ? "border-orange-500/40 bg-orange-500/10 text-orange-300"
                        : "border-gray-800/80 bg-gray-800/30 opacity-40"
                    }`}
                  >
                    <span className="text-sm">{icon}</span>
                    <span className="text-[10px] font-medium text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reputation Score Card */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-400" />
                  Reputation Score
                </span>
                {p?.aiReputation && (
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-800/40">
                    AI VERIFIED
                  </span>
                )}
              </h2>

              {p?.aiReputation ? (
                /* AI-derived reputation score display */
                <div className="flex items-center gap-3.5 p-3 rounded-xl bg-gray-800/40 border border-gray-800/80">
                  <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex-shrink-0 min-w-[76px]">
                    <span className="text-2xl font-black text-white leading-none">{p.aiReputation.score}</span>
                    <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wide mt-1">{p.aiReputation.tier}</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-xs text-gray-300 leading-snug">
                      Live GitHub API evidence, commit velocity & code quality score.
                    </p>
                    <Link href="/mentor" className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 pt-0.5">
                      View Breakdown →
                    </Link>
                  </div>
                </div>
              ) : (
                /* Fallback engagement score */
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-800/80">
                    <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex-shrink-0 min-w-[76px]">
                      <span className="text-2xl font-black text-indigo-400 leading-none">{rep?.level ?? 1}</span>
                      <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wide mt-1">{rep?.label ?? "Beginner"}</span>
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      {[
                        { label: "Projects", val: p?.stats?.projects ?? 0, color: "bg-indigo-500" },
                        { label: "Contribs", val: p?.stats?.contributions ?? 0, color: "bg-green-500" },
                        { label: "Connect",  val: p?.stats?.connections ?? 0, color: "bg-blue-500" },
                        { label: "Likes",    val: p?.stats?.likesReceived ?? 0, color: "bg-red-500" },
                      ].map(({ label, val, color }) => (
                        <div key={label} className="flex items-center gap-2 text-[10px]">
                          <span className="text-gray-400 w-14 flex-shrink-0">{label} ({val})</span>
                          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${Math.min((val / 20) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-center pt-0.5">
                    <Link href="/mentor" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                      Run AI Analysis for Evidence Score →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
            <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />Contribution Activity
            </h2>
            <p className="text-xs text-gray-500 mb-4">Weekly contributions — last 52 weeks</p>
            {streak?.activityGrid
              ? <ActivityHeatmap grid={streak.activityGrid as Record<string, number>} />
              : <div className="h-20 bg-gray-800 rounded-xl animate-pulse" />
            }
          </div>

          {/* Contributor Tier + Ratings */}
          {(p?.stats?.prsSubmitted > 0 || p?.ratings?.count > 0 || p?.user?.isPaidContributor) && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" /> Contributor Profile
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Tier</p>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-400">
                    {(p?.user?.contributorTier ?? "TESTER").replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">PRs Submitted</p>
                  <span className="text-sm font-bold text-indigo-400">{p?.stats?.prsSubmitted ?? 0}</span>
                </div>
                {p?.ratings?.count > 0 && (
                  <>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Avg Rating</p>
                      <span className="text-sm font-bold text-yellow-400">⭐ {p.ratings.avgOverall}/5</span>
                      <p className="text-[10px] text-gray-600">({p.ratings.count} reviews)</p>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: "Code Quality", val: p.ratings.avgCodeQuality },
                        { label: "Communication", val: p.ratings.avgCommunication },
                        { label: "Timeliness", val: p.ratings.avgTimeliness },
                      ].map(({ label, val }) => val && (
                        <div key={label} className="flex justify-between text-[10px]">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-white">{val}/5</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {p?.user?.isPaidContributor && (
                  <div className="col-span-2 pt-2 border-t border-gray-800">
                    <p className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-400" /> Paid Contributor Rates
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {p.user.pricePerBug    && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">${p.user.pricePerBug}/bug</span>}
                      {p.user.pricePerFeature && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">${p.user.pricePerFeature}/feature</span>}
                      {p.user.hourlyRate      && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">${p.user.hourlyRate}/hr</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Owned Projects */}
          {myProjects && myProjects.length > 0 && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2"><FolderGit2 className="h-4 w-4 text-indigo-400" />Projects</h2>
                <Link href="/my-projects" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
              </div>
              <div className="space-y-3">
                {myProjects.slice(0, 4).map((proj: any) => (
                  <Link key={proj.id} href={`/projects/${proj.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-700 flex-shrink-0 overflow-hidden">
                      {proj.coverImage ? <img src={proj.coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FolderGit2 className="h-5 w-5 text-gray-500" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{proj.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 text-ellipsis overflow-hidden">{proj.description}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600 flex-shrink-0">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{proj._count?.likes ?? 0}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{proj._count?.members ?? 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — badges + activity (desktop only: hidden lg:block) */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4 sticky top-4">

          {/* Badges */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />Achievements
              <span className="ml-auto text-xs text-gray-500">{(p?.badges ?? []).length}/{allDefs.length}</span>
            </h2>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 192, scrollbarWidth: "thin" }}>
              {allDefs.length > 0 ? allDefs.map((def: any) => (
                <BadgeCard key={def.key} badge={def} earned={earnedKeys.has(def.key)} />
              )) : (
                [...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />)
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-400" />Recent Activity
            </h2>
            <div className="overflow-y-auto space-y-3" style={{ maxHeight: 192, scrollbarWidth: "thin" }}>
              {(p?.recentActivity ?? []).length > 0 ? (
                (p.recentActivity as any[]).map((act: any) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-sm">
                      {act.emoji ?? "⚡"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 leading-snug">{act.description}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</span>
                        {act.project && (
                          <Link href={`/projects/${act.project.id}`} className="text-[10px] text-indigo-400 hover:text-indigo-300 truncate">
                            {act.project.title}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="w-7 h-7 bg-gray-800 rounded-lg animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-1.5 py-0.5">
                      <div className="h-2.5 bg-gray-800 animate-pulse rounded w-4/5" />
                      <div className="h-2 bg-gray-800 animate-pulse rounded w-2/5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile/Tablet Account Quick Actions Sheet (Option C) ─────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-gray-900 border-t border-gray-800 rounded-t-3xl p-5 pb-8 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-gray-800 mb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-400" /> Account & Menu
              </h3>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1 py-2">
              {[
                { name: "Settings",       href: "/settings",       icon: Settings,      desc: "Profile preferences & security" },
                { name: "Saved Projects", href: "/saved",          icon: Bookmark,      desc: "Bookmarks & saved items" },
                { name: "Your Activity",  href: "/activity",       icon: Activity,      desc: "Recent interactions & logs" },
                { name: "Achievements",   href: "/profile",        icon: Star,          desc: "Badges & milestones" },
                { name: "Repo Requests",  href: "/repo-requests",  icon: KeyRound,      desc: "Access requests & tokens" },
                { name: "Bug Reports",    href: "/bug-reports",    icon: AlertTriangle, desc: "Submitted issues & feedback" },
                { name: "Pull Requests",  href: "/pull-requests",  icon: GitPullRequest,desc: "Code contributions & PRs" },
              ].map(({ name, href, icon: Icon, desc }) => (
                <Link
                  key={name}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-800 text-gray-400 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{name}</p>
                      <p className="text-[11px] text-gray-500">{desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 transition" />
                </Link>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t border-gray-800">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmLogout(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-950/30 text-red-400 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-950/40 text-red-400">
                    <LogOut className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold">Log Out</span>
                </div>
                <ChevronRight className="h-4 w-4 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      )}

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
