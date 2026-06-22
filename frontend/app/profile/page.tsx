"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { profileDataAPI, usersAPI } from "@/lib/api";
import {
  Calendar, FolderGit2, Users, ExternalLink,
  MapPin, Globe, Clock, Link2, Flame, Trophy,
  TrendingUp, Zap, Star, Heart,
  DollarSign, Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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
    <div className="space-y-4">
      <div className="flex gap-4 items-start">
        {/* Heatmap — left side */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-0.5 flex-wrap">
            {weeks.map((wk, i) => (
              <div key={i} title={`Week of ${wk.startDate}: ${wk.total} contributions`}
                className={`w-4 h-8 rounded-sm cursor-default transition-opacity hover:opacity-80 ${getColor(wk.total)}`} />
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

        {/* Stats box — right side */}
        <div className="flex-shrink-0 w-44 bg-gray-800/60 rounded-xl border border-gray-700/50 p-3 space-y-2">
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
  const { user, isAuthenticated } = useAuth();

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
    <div className="min-h-screen bg-gray-950 space-y-4">

      {/* Hero card */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900" />
        <div className="px-6 pb-6 relative">
          {/* Avatar overlaps banner */}
          <div className="relative inline-block -mt-10 mb-3">
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.username} className="w-20 h-20 rounded-2xl border-4 border-gray-900 block" />
              : <div className="w-20 h-20 rounded-2xl border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                </div>
            }
            <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-gray-900" />
          </div>
          {/* Edit Profile button — in normal flow, never overlaps banner */}
          <div className="flex mb-2">
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
          </div>        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 items-start">

        {/* LEFT — streak, reputation, heatmap, projects */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Streak + Reputation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />Contribution Streak
              </h2>
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <div className="text-4xl font-black text-orange-400">{streak?.currentStreak ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Current</div>
                </div>
                <div className="flex-1 space-y-2.5">
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Longest</span><span className="text-white font-semibold">{streak?.longestStreak ?? 0} days</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Total days</span><span className="text-white font-semibold">{streak?.totalActiveDays ?? 0}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Weekly</span><span className="text-orange-300 font-semibold">{streak?.weeklyStreak ?? 0} wks</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500">Monthly</span><span className="text-orange-300 font-semibold">{streak?.monthlyStreak ?? 0} mo</span></div>
                  <div className="flex gap-1">{[...Array(7)].map((_, i) => <div key={i} className={`flex-1 h-2 rounded-full ${i < Math.min(streak?.currentStreak ?? 0, 7) ? "bg-orange-400" : "bg-gray-800"}`} />)}</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
                {[{days:3,icon:"🔥",label:"3d"},{days:7,icon:"⚡",label:"7d"},{days:14,icon:"💫",label:"14d"},{days:30,icon:"💎",label:"30d"}].map(({days,icon,label}) => (
                  <div key={days} className={`flex-1 flex flex-col items-center gap-0.5 p-2 rounded-xl border ${(streak?.longestStreak??0)>=days ? "border-orange-800/50 bg-orange-900/20" : "border-gray-800 opacity-40"}`}>
                    <span className="text-base">{icon}</span>
                    <span className="text-[9px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" />Reputation Score
              </h2>
              <div className="flex items-center gap-5">
                {rep && <ReputationRing score={rep.score} level={rep.level} label={rep.label} next={rep.next} />}
                <div className="flex-1 space-y-2">
                  {[
                    { label:"Projects",      val:p?.stats?.projects??0,      pts:(p?.stats?.projects??0)*10,     color:"bg-indigo-500" },
                    { label:"Contributions", val:p?.stats?.contributions??0, pts:(p?.stats?.contributions??0)*8, color:"bg-green-500" },
                    { label:"Connections",   val:p?.stats?.connections??0,   pts:(p?.stats?.connections??0)*3,   color:"bg-blue-500" },
                    { label:"Likes",         val:p?.stats?.likesReceived??0, pts:(p?.stats?.likesReceived??0)*2, color:"bg-red-500" },
                  ].map(({label,val,pts,color}) => (
                    <div key={label}>
                      <div className="flex justify-between text-[10px] text-gray-500 mb-0.5"><span>{label} ({val})</span><span className="text-white">+{pts}</span></div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className={`h-full ${color} rounded-full`} style={{width:`${Math.min((val/20)*100,100)}%`}} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
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
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
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
          {myProjects && myProjects.length > 0 && (            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2"><FolderGit2 className="h-4 w-4 text-indigo-400" />Projects</h2>
                <Link href="/my-projects" className="text-xs text-indigo-400 hover:text-indigo-300">View all →</Link>
              </div>
              <div className="space-y-3">
                {myProjects.slice(0, 4).map((proj: any) => (
                  <Link key={proj.id} href={`/projects/${proj.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition">
                    <div className="w-10 h-10 rounded-xl bg-gray-700 flex-shrink-0 overflow-hidden">
                      {proj.coverImage ? <img src={proj.coverImage} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><FolderGit2 className="h-5 w-5 text-gray-500" /></div>}
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

        {/* RIGHT — badges + activity (fixed width, sticky) */}
        <div className="w-72 flex-shrink-0 space-y-4 sticky top-4">

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
    </div>
  );
}
