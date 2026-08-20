"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersAPI, profileDataAPI, connectionsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar, FolderGit2, Users, ExternalLink, MapPin,
  Globe, Lock, Link2, Clock, Flame, Trophy, Star, Zap,
  Heart, TrendingUp, Shield, DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";
import { ProfileSkeleton } from "@/components/Skeleton";
import Link from "next/link";

// Reuse weekly heatmap from profile page
function ActivityHeatmap({ grid }: { grid: Record<string, number> }) {
  const today = new Date();
  const weeks: { startDate: string; total: number }[] = [];
  for (let w = 51; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - (w * 7) - today.getDay());
    let total = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + d);
      total += grid[day.toISOString().slice(0, 10)] ?? 0;
    }
    weeks.push({ startDate: weekStart.toISOString().slice(0, 10), total });
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
  const totalContribs = weeks.reduce((s, w) => s + w.total, 0);
  const maxWeekVal = Math.max(...weeks.map(w => w.total));
  const activeWeeks = weeks.filter(w => w.total > 0).length;
  return (
    <div className="space-y-3 w-full min-w-0 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-3 items-start w-full min-w-0 max-w-full">
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
                    title={`Week of ${wk.startDate}: ${wk.total}`}
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
                    title={`Week of ${wk.startDate}: ${wk.total}`}
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
        <div className="w-full sm:w-36 flex-shrink-0 bg-gray-800/60 rounded-xl border border-gray-700/50 p-2.5 space-y-1.5">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Stats</p>
          {[
            { label: "Total", value: totalContribs },
            { label: "Best week", value: maxWeekVal },
            { label: "Active weeks", value: activeWeeks },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-[10px] text-gray-500">{label}</span>
              <span className="text-[10px] font-bold text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BadgeCard({ badge, earned }: { badge: any; earned: boolean }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border min-w-0 ${earned ? "border-gray-700 bg-gray-800/60" : "border-gray-800 opacity-40 grayscale"}`}>
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-base flex-shrink-0`}>{badge.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{badge.label}</p>
        <p className="text-[10px] text-gray-500 truncate">{badge.desc}</p>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: me } = useAuth();

  const { data: profileFull, isLoading, error } = useQuery({
    queryKey: ["publicProfile", userId],
    queryFn: async () => { const { data } = await profileDataAPI.getPublicProfile(userId); return data; },
    enabled: !!userId,
  });

  const { data: userProjects } = useQuery({
    queryKey: ["userProjectsPublic", userId],
    queryFn: async () => { const { data } = await usersAPI.getUserProjects(userId); return data; },
    enabled: !!userId && !error,
  });

  if (isLoading) return <ProfileSkeleton />;

  if ((error as any)?.response?.status === 403) return (
    <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
      <Lock className="h-12 w-12 mx-auto mb-3 text-gray-700" />
      <p className="text-white font-medium mb-1">Private Profile</p>
      <p className="text-sm text-gray-500">This developer&apos;s profile is not publicly visible</p>
    </div>
  );

  if (!profileFull) return <div className="text-center py-20 text-gray-500">User not found</div>;

  const profile = profileFull.user;
  const stats   = profileFull.stats;
  const streak  = profileFull.streak;
  const rep     = profileFull.reputation;
  const badges  = profileFull.badges ?? [];
  const allDefs = profileFull.allBadgeDefs ?? badges; // public profile may not return allDefs
  const earnedKeys = new Set(badges.map((b: any) => b.badgeKey));
  const isSelf = me?.id === userId;

  return (
    <div className="min-h-screen bg-gray-950 space-y-4 overflow-x-hidden w-full max-w-full">

      {/* ── Mobile/Tablet Dedicated Header (lg:hidden) ────────────────────── */}
      <div className="sticky -top-4 sm:-top-6 -mx-3 sm:-mx-6 -mt-4 sm:-mt-6 mb-3 px-4 py-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between z-30 lg:hidden">
        <span className="font-bold text-white text-base truncate">
          @{profile.githubUsername || profile.username}
        </span>
      </div>

      {/* ── Mobile/Tablet Compact Hero Card (lg:hidden) ───────────────────── */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden lg:hidden">
        <div className="h-16 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900" />
        <div className="px-4 pb-4 relative">
          <div className="flex items-center gap-3 -mt-6 mb-3">
            <div className="relative flex-shrink-0">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.username} className="w-16 h-16 rounded-2xl border-4 border-gray-900 block object-cover" />
                : <div className="w-16 h-16 rounded-2xl border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{profile.username.charAt(0).toUpperCase()}</span>
                  </div>
              }
              <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
            </div>

            <div className="flex-1 min-w-0 pt-6">
              <h1 className="text-base font-bold text-white truncate">{profile.username}</h1>
              {profile.githubUsername && <p className="text-xs text-gray-400 truncate">@{profile.githubUsername}</p>}

              <div className="grid grid-cols-4 gap-1 mt-2 text-center border-t border-gray-800/80 pt-2">
                {[
                  { label: "Projects",      value: stats?.projects ?? 0,      color: "text-indigo-400" },
                  { label: "Contribs",      value: stats?.contributions ?? 0, color: "text-green-400" },
                  { label: "Connect",       value: stats?.connections ?? 0,   color: "text-blue-400" },
                  { label: "Likes",         value: stats?.likesReceived ?? 0, color: "text-red-400" },
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
              {!isSelf ? (
                <>
                  <ConnectButton userId={userId} />
                  <Link href={`/messages?user=${userId}`}
                    className="text-xs text-gray-300 border border-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-800 transition whitespace-nowrap">
                    Message
                  </Link>
                </>
              ) : (
                <Link href="/settings" className="text-xs text-indigo-400 border border-indigo-800 px-3 py-1.5 rounded-xl hover:bg-indigo-900/30 transition whitespace-nowrap">
                  Edit Profile
                </Link>
              )}
            </div>

            {profile.bio && <p className="text-xs text-gray-300 leading-relaxed">{profile.bio}</p>}

            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.location}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}</span>
              {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400"><Globe className="h-3 w-3" />Website</a>}
              {profile.githubProfileUrl && <a href={profile.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400"><ExternalLink className="h-3 w-3" />GitHub</a>}
            </div>

            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(profile.skills as string[]).map((s: string, i: number) => (
                  <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2 py-0.5 rounded-full font-medium">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop Full Hero card (hidden lg:block) ───────────────────────── */}
      <div className="hidden lg:block bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900" />
        <div className="px-5 pb-5 relative">
          <div className="relative inline-block -mt-8 mb-3">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.username} className="w-16 h-16 rounded-2xl border-4 border-gray-900 block" />
              : <div className="w-16 h-16 rounded-2xl border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{profile.username.charAt(0).toUpperCase()}</span>
                </div>
            }
            <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
          </div>

          <div className="flex gap-2 flex-wrap items-center mb-3">
            {!isSelf ? (
              <>
                <ConnectButton userId={userId} />
                <Link href={`/messages?user=${userId}`}
                  className="text-sm text-gray-300 border border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-800 transition whitespace-nowrap">
                  Message
                </Link>
              </>
            ) : (
              <Link href="/settings" className="text-xs text-indigo-400 border border-indigo-800 px-3 py-1.5 rounded-xl hover:bg-indigo-900/30 transition whitespace-nowrap">
                Edit Profile
              </Link>
            )}
          </div>

          <h1 className="text-xl font-bold text-white">{profile.username}</h1>
          {profile.githubUsername && <p className="text-sm text-gray-400">@{profile.githubUsername}</p>}
          {profile.bio && <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-lg">{profile.bio}</p>}

          <div className="flex flex-wrap gap-3 mt-3">
            {profile.location && <span className="flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
            <span className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="h-3.5 w-3.5" />Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}</span>
            {profile.website && <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"><Globe className="h-3.5 w-3.5" />Website</a>}
            {profile.githubProfileUrl && <a href={profile.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"><ExternalLink className="h-3.5 w-3.5" />GitHub</a>}
            {profile.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Link2 className="h-3.5 w-3.5" />LinkedIn</a>}
            {profile.availabilityHours && <span className="flex items-center gap-1 text-xs text-green-400"><Clock className="h-3.5 w-3.5" />{profile.availabilityHours}h/wk</span>}
          </div>

          {profile.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(profile.skills as string[]).map((s: string, i: number) => (
                <span key={i} className="text-xs text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-800 text-center">
            {[
              { label: "Projects",      value: stats?.projects ?? 0,      color: "text-indigo-400" },
              { label: "Contributions", value: stats?.contributions ?? 0, color: "text-green-400" },
              { label: "Connections",   value: stats?.connections ?? 0,   color: "text-blue-400" },
              { label: "Likes Received",value: stats?.likesReceived ?? 0, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className={`text-xl font-bold ${color}`}>{value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column: left = streak/rep/heatmap/projects, right = badges/activity ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start w-full min-w-0 max-w-full">
        {/* LEFT */}
        <div className="w-full lg:flex-1 min-w-0 max-w-full space-y-4">
          {/* AI Mentor Reputation Engine Card */}
          {profile.githubUsername && (
            <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/40 to-neutral-900 rounded-2xl border border-indigo-500/30 p-3.5 sm:p-4 w-full min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                      <span>AI Mentor Engineering Rating</span>
                      <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0">
                        Live GitHub Evidence
                      </span>
                    </h2>
                    <p className="text-xs text-gray-400">@{profile.githubUsername}</p>
                  </div>
                </div>
                <Link
                  href={`/mentor`}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition flex items-center gap-1 shadow-lg"
                >
                  Analyze Profile →
                </Link>
              </div>
            </div>
          )}
          {/* Streak + Reputation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full min-w-0 max-w-full">
            {/* Contribution Streak Card */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />Daily Streak
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
            </div>

            {/* Reputation Score Card */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />Reputation
              </h2>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-800/80">
                <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-indigo-950/50 border border-indigo-500/30 flex-shrink-0 min-w-[64px]">
                  <span className="text-2xl font-black text-indigo-400 leading-none">{rep?.level ?? 1}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mt-1">Level</span>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-bold text-white truncate">{rep?.label ?? "Beginner"}</p>
                  <p className="text-[11px] text-gray-400">{rep?.score?.toLocaleString() ?? 0} pts</p>
                  {rep?.next && (
                    <p className="text-[10px] text-indigo-400">
                      {(rep.next - rep.score).toLocaleString()} to Lv {(rep.level ?? 0) + 1}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
            <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />Contribution Activity
            </h2>
            <p className="text-xs text-gray-500 mb-3">Weekly contributions — last 52 weeks</p>
            {streak?.activityGrid
              ? <ActivityHeatmap grid={streak.activityGrid as Record<string, number>} />
              : <div className="h-16 bg-gray-800 rounded-xl animate-pulse" />
            }
          </div>

          {/* Contributor Profile */}
          {(stats?.prsSubmitted > 0 || profileFull?.ratings?.avgOverall || profile?.isPaidContributor) && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-3.5 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-400" /> Contributor Profile
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">Tier</p>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-900/40 text-purple-400">
                    {(profile?.contributorTier ?? "TESTER").replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 mb-1">PRs Submitted</p>
                  <span className="text-sm font-bold text-indigo-400">{stats?.prsSubmitted ?? 0}</span>
                </div>
                {profileFull?.ratings?.avgOverall && (
                  <>
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1">Avg Rating</p>
                      <span className="text-sm font-bold text-yellow-400">⭐ {profileFull.ratings.avgOverall}/5</span>
                    </div>
                    <div className="space-y-1">
                      {[
                        { label: "Code Quality",   val: profileFull.ratings.avgCodeQuality },
                        { label: "Communication",  val: profileFull.ratings.avgCommunication },
                        { label: "Timeliness",     val: profileFull.ratings.avgTimeliness },
                      ].map(({ label, val }) => val && (
                        <div key={label} className="flex justify-between text-[10px]">
                          <span className="text-gray-500">{label}</span>
                          <span className="text-white">{val}/5</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {profile?.isPaidContributor && (
                  <div className="col-span-2 pt-2 border-t border-gray-800">
                    <p className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-green-400" /> Paid Contributor Rates
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {profile.pricePerBug    && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">${profile.pricePerBug}/bug</span>}
                      {profile.pricePerFeature && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">${profile.pricePerFeature}/feature</span>}
                      {profile.hourlyRate      && <span className="text-[10px] bg-green-900/30 text-green-400 px-2 py-0.5 rounded-full">${profile.hourlyRate}/hr</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects */}
          {userProjects && userProjects.length > 0 && (            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Projects by {profile.username}</h2>
                {userProjects.length > 4 && (
                  <span className="text-xs text-gray-500">{userProjects.length} projects</span>
                )}
              </div>
              <div className="space-y-3">
                {userProjects.slice(0, 6).map((proj: any) => (
                  <Link key={proj.id} href={`/projects/${proj.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-700 flex-shrink-0 overflow-hidden">
                      {proj.coverImage
                        ? <img src={proj.coverImage} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <FolderGit2 className="h-5 w-5 text-gray-500" />
                          </div>
                      }
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
        <div className="hidden lg:block w-[272px] flex-shrink-0 space-y-4 sticky top-4">
          {/* Badges */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-400" />Achievements
              <span className="ml-auto text-xs text-gray-500">{badges.length}</span>
            </h2>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 192, scrollbarWidth: "thin" }}>
              {badges.length > 0 ? badges.map((b: any) => (
                <BadgeCard key={b.id} badge={b} earned={true} />
              )) : (
                <p className="text-xs text-gray-600 py-2 text-center">No badges yet</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          {profileFull.recentActivity?.length > 0 && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-400" />Recent Activity
              </h2>
              <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 192, scrollbarWidth: "thin" }}>
                {(profileFull.recentActivity as any[]).map((act: any) => (
                  <div key={act.id} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                      {act.emoji ?? "⚡"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-gray-300 leading-snug">{act.description}</p>
                      <p className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
