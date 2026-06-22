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
    <div className="space-y-3">
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0">
          <div className="flex gap-0.5 flex-wrap">
            {weeks.map((wk, i) => (
              <div key={i} title={`Week of ${wk.startDate}: ${wk.total}`}
                className={`w-4 h-8 rounded-sm cursor-default ${getColor(wk.total)}`} />
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
        <div className="flex-shrink-0 w-36 bg-gray-800/60 rounded-xl border border-gray-700/50 p-2.5 space-y-1.5">
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
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${earned ? "border-gray-700 bg-gray-800/60" : "border-gray-800 opacity-40 grayscale"}`}>
      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center text-base flex-shrink-0`}>{badge.icon}</div>
      <div className="min-w-0">
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
      <p className="text-sm text-gray-500">This developer's profile is not publicly visible</p>
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
    <div className="min-h-screen bg-gray-950 space-y-4">

      {/* ── Hero card ─────────────────────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900" />
        <div className="px-5 pb-5 relative">
          {/* Avatar — overlaps the banner */}
          <div className="relative inline-block -mt-8 mb-3">
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt={profile.username} className="w-16 h-16 rounded-2xl border-4 border-gray-900 block" />
              : <div className="w-16 h-16 rounded-2xl border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{profile.username.charAt(0).toUpperCase()}</span>
                </div>
            }
            <span className="absolute bottom-1 right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
          </div>

          {/* Buttons — sit in normal flow, never overlap banner */}
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
          </div>        </div>
      </div>

      {/* ── Two-column: left = streak/rep/heatmap/projects, right = badges/activity ── */}
      <div className="flex gap-4 items-start">
        {/* LEFT */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Streak + Reputation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />Daily Streak
              </h2>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-orange-400">{streak?.currentStreak ?? 0}</div>
                  <div className="text-[10px] text-gray-500">Current</div>
                </div>
                <div className="flex-1 space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Longest</span><span className="text-white font-semibold">{streak?.longestStreak ?? 0}d</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total days</span><span className="text-white font-semibold">{streak?.totalActiveDays ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Weekly</span><span className="text-orange-300 font-semibold">{streak?.weeklyStreak ?? 0} wks</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Monthly</span><span className="text-orange-300 font-semibold">{streak?.monthlyStreak ?? 0} mo</span></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />Reputation
              </h2>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-3xl font-black text-indigo-400">{rep?.level ?? 0}</div>
                  <div className="text-[10px] text-gray-500">Level</div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">{rep?.label ?? "Beginner"}</p>
                  <p className="text-xs text-gray-500">{rep?.score?.toLocaleString() ?? 0} pts</p>
                  {rep?.next && <p className="text-[10px] text-indigo-400">{(rep.next - rep.score).toLocaleString()} to Level {(rep.level ?? 0) + 1}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
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
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
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
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition">
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
                      <p className="text-xs text-gray-500 truncate">{proj.description}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 flex-shrink-0">
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{proj._count?.likes ?? 0}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{proj._count?.members ?? 0}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — badges + activity */}
        <div className="w-68 flex-shrink-0 space-y-4 sticky top-4" style={{ width: 272 }}>
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
