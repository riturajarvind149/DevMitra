"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { profileDataAPI, usersAPI, activitiesAPI } from "@/lib/api";
import {
  Mail, Calendar, FolderGit2, Users, ExternalLink,
  MapPin, Globe, Clock, Link2, Flame, Trophy,
  TrendingUp, Zap, Star, GitPullRequest, MessageSquare,
  Heart, ChevronRight,
} from "lucide-react";
import { formatDistanceToNow, format, subDays, parseISO } from "date-fns";
import Link from "next/link";

// ── Contribution heatmap ──────────────────────────────────────────────────────
function ActivityHeatmap({ grid }: { grid: Record<string, number> }) {
  // Build last 52 weeks (364 days)
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  for (let i = 363; i >= 0; i--) {
    const d = subDays(today, i);
    const key = format(d, "yyyy-MM-dd");
    days.push({ date: key, count: grid[key] ?? 0 });
  }

  // Split into 52 columns of 7
  const weeks: { date: string; count: number }[][] = [];
  for (let w = 0; w < 52; w++) weeks.push(days.slice(w * 7, w * 7 + 7));

  const getColor = (count: number) => {
    if (count === 0) return "bg-gray-800";
    if (count === 1) return "bg-indigo-900";
    if (count <= 3)  return "bg-indigo-700";
    if (count <= 6)  return "bg-indigo-500";
    return "bg-indigo-400";
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} activit${day.count === 1 ? "y" : "ies"}`}
                className={`w-3 h-3 rounded-sm cursor-default ${getColor(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-[10px] text-gray-600">Less</span>
        {["bg-gray-800","bg-indigo-900","bg-indigo-700","bg-indigo-500","bg-indigo-400"].map(c => (
          <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-gray-600">More</span>
      </div>
    </div>
  );
}

// ── Badge card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, earned }: { badge: any; earned: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition ${
      earned
        ? "border-gray-700 bg-gray-800/60"
        : "border-gray-800 bg-gray-900/40 opacity-40 grayscale"
    }`}>
      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-lg flex-shrink-0`}>
        {badge.icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white truncate">{badge.label}</p>
        <p className="text-[10px] text-gray-500 truncate">{badge.desc}</p>
      </div>
    </div>
  );
}

// ── Reputation ring ───────────────────────────────────────────────────────────
function ReputationRing({ score, level, label, next }: { score: number; level: number; label: string; next: number | null }) {
  const pct = next ? Math.min((score / next) * 100, 100) : 100;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="44" cy="44" r={r} fill="none" stroke="url(#repGrad)"
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`} />
          <defs>
            <linearGradient id="repGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-white">{level}</span>
          <span className="text-[9px] text-gray-400 uppercase tracking-wider">Level</span>
        </div>
      </div>
      <p className="text-sm font-bold text-white mt-1">{label}</p>
      <p className="text-[10px] text-gray-500">{score.toLocaleString()} pts</p>
      {next && <p className="text-[10px] text-indigo-400">{(next - score).toLocaleString()} to Level {level + 1}</p>}
    </div>
  );
}

// ── Main profile page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["fullProfile", user?.id],
    queryFn: async () => { const { data } = await profileDataAPI.getMyProfile(); return data; },
    enabled: !!user,
    staleTime: 60000,
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
    <div className="min-h-screen bg-gray-950 space-y-5">

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {/* Banner gradient */}
        <div className="h-24 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%236366f1 fill-opacity=0.08%3E%3Cpath d=M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        </div>

        <div className="px-6 pb-6 -mt-10 relative">
          <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
            {/* Avatar */}
            <div className="relative">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username}
                  className="w-20 h-20 rounded-2xl border-4 border-gray-900 flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
              {/* Online dot */}
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-gray-900" />
            </div>
            <Link href="/settings"
              className="text-xs font-medium text-white border border-gray-600 px-4 py-2 rounded-xl hover:bg-gray-800 transition">
              Edit Profile
            </Link>
          </div>

          {/* Name + handle */}
          <h1 className="text-xl font-bold text-white">{user.username}</h1>
          {user.githubUsername && (
            <p className="text-sm text-gray-400">@{user.githubUsername}</p>
          )}
          {user.bio && (
            <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-lg">{user.bio}</p>
          )}

          {/* Meta links */}
          <div className="flex flex-wrap gap-3 mt-3">
            {user.location && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="h-3.5 w-3.5" />{user.location}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3.5 w-3.5" />Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
            </span>
            {user.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <Globe className="h-3.5 w-3.5" />Website
              </a>
            )}
            {user.githubProfileUrl && (
              <a href={user.githubProfileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                <ExternalLink className="h-3.5 w-3.5" />GitHub
              </a>
            )}
            {(user as any).linkedinUrl && (
              <a href={(user as any).linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                <Link2 className="h-3.5 w-3.5" />LinkedIn
              </a>
            )}
            {(user as any).availabilityHours && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Clock className="h-3.5 w-3.5" />{(user as any).availabilityHours}h/wk available
              </span>
            )}
          </div>

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {user.skills.map((s, i) => (
                <span key={i} className="text-xs text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2.5 py-1 rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-800 text-center">
            {[
              { label: "Projects",      value: p?.stats?.projects ?? 0,      color: "text-indigo-400" },
              { label: "Contributions", value: p?.stats?.contributions ?? 0,  color: "text-green-400" },
              { label: "Connections",   value: p?.stats?.connections ?? 0,    color: "text-blue-400" },
              { label: "Likes Received",value: p?.stats?.likesReceived ?? 0,  color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Streak + Reputation row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Daily Streak */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-400" />Daily Streak
          </h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-4xl font-black text-orange-400">{streak?.currentStreak ?? 0}</div>
              <div className="text-xs text-gray-500 mt-0.5">Current</div>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Longest streak</span>
                <span className="text-white font-semibold">{streak?.longestStreak ?? 0} days</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total active days</span>
                <span className="text-white font-semibold">{streak?.totalActiveDays ?? 0}</span>
              </div>
              <div className="flex gap-1 mt-2">
                {[...Array(7)].map((_, i) => {
                  const active = i < Math.min(streak?.currentStreak ?? 0, 7);
                  return (
                    <div key={i} className={`flex-1 h-2 rounded-full ${active ? "bg-orange-400" : "bg-gray-800"}`} />
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-600">Last 7 days</p>
            </div>
          </div>

          {/* Streak milestones */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
            {[
              { days: 3,  icon: "🔥", label: "3d" },
              { days: 7,  icon: "⚡", label: "7d" },
              { days: 14, icon: "💫", label: "14d" },
              { days: 30, icon: "💎", label: "30d" },
            ].map(({ days, icon, label }) => {
              const reached = (streak?.longestStreak ?? 0) >= days;
              return (
                <div key={days} className={`flex-1 flex flex-col items-center gap-0.5 p-2 rounded-xl border ${
                  reached ? "border-orange-800/50 bg-orange-900/20" : "border-gray-800 opacity-40"
                }`}>
                  <span className="text-base">{icon}</span>
                  <span className="text-[9px] text-gray-400">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reputation Score */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-400" />Reputation Score
          </h2>
          <div className="flex items-center gap-6">
            {rep && (
              <ReputationRing
                score={rep.score}
                level={rep.level}
                label={rep.label}
                next={rep.next}
              />
            )}
            <div className="flex-1 space-y-2.5">
              {[
                { label: "Projects",      val: p?.stats?.projects ?? 0,       pts: (p?.stats?.projects ?? 0) * 10,      color: "bg-indigo-500" },
                { label: "Contributions", val: p?.stats?.contributions ?? 0,  pts: (p?.stats?.contributions ?? 0) * 8,  color: "bg-green-500" },
                { label: "Connections",   val: p?.stats?.connections ?? 0,    pts: (p?.stats?.connections ?? 0) * 3,    color: "bg-blue-500" },
                { label: "Likes received",val: p?.stats?.likesReceived ?? 0,  pts: (p?.stats?.likesReceived ?? 0) * 2,  color: "bg-red-500" },
              ].map(({ label, val, pts, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                    <span>{label} ({val})</span>
                    <span className="text-white">+{pts}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`}
                      style={{ width: `${Math.min((val / 20) * 100, 100)}%`, transition: "width 1s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Contribution Activity Heatmap ──────────────────────────────────── */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
        <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />Contribution Activity
        </h2>
        <p className="text-xs text-gray-500 mb-4">Last 52 weeks</p>
        {streak?.activityGrid
          ? <ActivityHeatmap grid={streak.activityGrid as Record<string, number>} />
          : <div className="h-20 bg-gray-800 rounded-xl animate-pulse" />
        }
      </div>

      {/* ── Badges + Recent Activity ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Badges — scrollable, 3 items visible */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />Achievements
            <span className="ml-auto text-xs text-gray-500">
              {(p?.badges ?? []).length}/{allDefs.length}
            </span>
          </h2>
          {/* Fixed height = 3 × (56px item + 8px gap) = 184px */}
          <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 192, scrollbarWidth: "thin" }}>
            {allDefs.length > 0 ? allDefs.map((def: any) => (
              <BadgeCard key={def.key} badge={def} earned={earnedKeys.has(def.key)} />
            )) : (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
              ))
            )}
          </div>
        </div>

        {/* Recent Activity — scrollable, 3 items visible */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-400" />Recent Activity
          </h2>
          <div className="overflow-y-auto space-y-3" style={{ maxHeight: 192, scrollbarWidth: "thin" }}>
            {(p?.recentActivity ?? []).length > 0 ? (
              (p.recentActivity as any[]).map((act: any) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <GitPullRequest className="h-3.5 w-3.5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 leading-snug">{act.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-600">
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </span>
                      {act.project && (
                        <Link href={`/projects/${act.project.id}`}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 truncate">
                          {act.project.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-xl animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5 py-1">
                    <div className="h-3 bg-gray-800 animate-pulse rounded w-4/5" />
                    <div className="h-2.5 bg-gray-800 animate-pulse rounded w-2/5" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick nav */}
          <div className="mt-4 pt-4 border-t border-gray-800 space-y-0.5">
            {[
              { href: "/my-projects",   label: "My Projects",   icon: FolderGit2,     count: p?.stats?.projects },
              { href: "/connections",   label: "Connections",   icon: Users,          count: p?.stats?.connections },
              { href: "/activity",      label: "Your Activity", icon: TrendingUp,     count: null },
              { href: "/repo-requests", label: "Repo Requests", icon: GitPullRequest, count: null },
            ].map(({ href, label, icon: Icon, count }) => (
              <Link key={href} href={href}
                className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-800 transition group">
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-gray-500 group-hover:text-indigo-400 transition" />
                  <span className="text-sm text-gray-400 group-hover:text-white transition">{label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {count != null && <span className="text-xs text-gray-600">{count}</span>}
                  <ChevronRight className="h-3.5 w-3.5 text-gray-700 group-hover:text-gray-400 transition" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Owned Projects ─────────────────────────────────────────────────── */}
      {myProjects && myProjects.length > 0 && (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FolderGit2 className="h-4 w-4 text-indigo-400" />Projects
            </h2>
            <Link href="/my-projects" className="text-xs text-indigo-400 hover:text-indigo-300">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {myProjects.slice(0, 4).map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition">
                <div className="w-10 h-10 rounded-xl bg-gray-700 flex-shrink-0 overflow-hidden">
                  {p.coverImage
                    ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <FolderGit2 className="h-5 w-5 text-gray-500" />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                  <p className="text-xs text-gray-500 truncate">{p.description}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{p._count?.likes ?? 0}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{p._count?.members ?? 0}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
