"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersAPI, savesAPI, repoRequestsAPI, opportunitiesAPI, accessRequestsAPI, activitiesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Heart, MessageSquare, Bookmark, KeyRound, Briefcase,
  Activity, CheckCircle, Clock, XCircle, FolderGit2,
  UserPlus, GitPullRequest,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
type Tab = "likes" | "comments" | "saved" | "repo" | "applications";

const STATUS_PILL: Record<string, string> = {
  PENDING:  "text-yellow-400 bg-yellow-900/30 border border-yellow-800/40",
  APPROVED: "text-green-400 bg-green-900/30 border border-green-800/40",
  REJECTED: "text-red-400 bg-red-900/30 border border-red-800/40",
  OPEN:     "text-blue-400 bg-blue-900/30 border border-blue-800/40",
};

// ── Activity icon map ─────────────────────────────────────────────────────────
const ACTION_META: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  PROJECT_CREATED:         { icon: FolderGit2,    color: "text-indigo-400",  label: "Created project" },
  PROJECT_UPDATED:         { icon: FolderGit2,    color: "text-blue-400",    label: "Updated project" },
  MEMBER_JOINED:           { icon: UserPlus,      color: "text-green-400",   label: "Joined project" },
  MEMBER_LEFT:             { icon: UserPlus,      color: "text-red-400",     label: "Left project" },
  ACCESS_REQUEST_CREATED:  { icon: GitPullRequest,color: "text-purple-400",  label: "Requested access" },
  ACCESS_REQUEST_APPROVED: { icon: CheckCircle,   color: "text-green-400",   label: "Access approved" },
  ACCESS_REQUEST_REJECTED: { icon: XCircle,       color: "text-red-400",     label: "Access rejected" },
};

// ── Helper components ─────────────────────────────────────────────────────────
function Empty({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
      <Icon className="h-10 w-10 mx-auto mb-3 text-gray-700" />
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-sm text-gray-500">{sub}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function CountBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-1 text-[10px] font-bold bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">
      {count > 99 ? "99+" : count}
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function YourActivityPage() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("likes");

  // ── Fetch all data (always fetch regardless of tab for count badges) ────────
  const { data: likedProjects, isLoading: likesLoading } = useQuery({
    queryKey: ["activity-likes", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserLikedProjects(user!.id); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: userComments, isLoading: commentsLoading } = useQuery({
    queryKey: ["activity-comments", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserComments(user!.id); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: savedProjects, isLoading: savedLoading } = useQuery({
    queryKey: ["activity-saved"],
    queryFn: async () => { const { data } = await savesAPI.getSaved(); return data; },
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  // Repo requests — RepositoryAccessRequest (private repo access)
  const { data: repoRequests, isLoading: repoLoading } = useQuery({
    queryKey: ["activity-repo", user?.id],
    queryFn: async () => { const { data } = await repoRequestsAPI.getMine(); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  // Project access requests (join project requests)
  const { data: accessRequests, isLoading: accessLoading } = useQuery({
    queryKey: ["activity-access", user?.id],
    queryFn: async () => { const { data } = await accessRequestsAPI.getMine(); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  // Opportunity applications submitted BY the user (not opportunities they own)
  const { data: myApplications, isLoading: appsLoading } = useQuery({
    queryKey: ["activity-applications", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserApplications(user!.id); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  // Recent activity timeline — user's own activity log entries
  const { data: recentActivity } = useQuery({
    queryKey: ["activity-timeline", user?.id],
    queryFn: async () => {
      const { data } = await activitiesAPI.getUserActivities(user!.id, { limit: 20 });
      return (data as any).activities ?? [];
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 60000,
  });

  if (!isAuthenticated || !user) return (
    <div className="flex items-center justify-center py-20 text-gray-500">
      Please login to view your activity
    </div>
  );

  // ── Count badges ──────────────────────────────────────────────────────────
  const repoCount = (repoRequests?.length ?? 0) + (accessRequests?.length ?? 0);

  const TABS: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "likes",        label: "Likes",         icon: Heart,          count: likedProjects?.length ?? 0 },
    { key: "comments",     label: "Comments",       icon: MessageSquare,  count: userComments?.length ?? 0 },
    { key: "saved",        label: "Saved",          icon: Bookmark,       count: savedProjects?.length ?? 0 },
    { key: "repo",         label: "Repo Requests",  icon: KeyRound,       count: repoCount },
    { key: "applications", label: "Applications",   icon: Briefcase,      count: myApplications?.length ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-green-400" />Your Activity
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Everything you've done on DevMitra</p>
      </div>

      {/* ── Recent Activity Timeline ────────────────────────────────────────── */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="mb-6 bg-gray-900 rounded-2xl border border-gray-800 p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-green-400" />Recent Activity
          </h2>
          <div className="space-y-2">
            {recentActivity.slice(0, 8).map((act: any) => {
              const meta = ACTION_META[act.action] ?? { icon: Activity, color: "text-gray-400", label: act.action };
              const Icon = meta.icon;
              return (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className={`h-3 w-3 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 leading-snug">{act.description}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {act.project && (
                    <Link href={`/projects/${act.project.id}`}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex-shrink-0">
                      View →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tabs with count badges ──────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 flex-wrap">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}>
            <Icon className="h-4 w-4" />
            {label}
            <CountBadge count={count} />
          </button>
        ))}
      </div>

      {/* ── Likes ──────────────────────────────────────────────────────────── */}
      {tab === "likes" && (
        likesLoading ? <Spinner /> :
        likedProjects?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {likedProjects.map((like: any) => {
              const p = like.project;
              if (!p) return null;
              return (
                <Link key={like.id} href={`/projects/${p.id}`}
                  className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition group">
                  <div className="w-14 h-14 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden">
                    {p.coverImage
                      ? (p.coverImage.startsWith("data:video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(p.coverImage)
                        ? <video src={p.coverImage} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                        : <img src={p.coverImage} alt="" className="w-full h-full object-cover" />)
                      : <div className="w-full h-full flex items-center justify-center">
                          <Heart className="h-5 w-5 text-red-400" />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition truncate">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {p.owner?.avatarUrl && <img src={p.owner.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full" />}
                      <span className="text-[10px] text-gray-600">{p.owner?.username}</span>
                      <span className="flex items-center gap-1 text-[10px] text-red-400 ml-auto">
                        <Heart className="h-3 w-3" />{p._count?.likes ?? 0}
                        <span className="text-gray-700 ml-1">·</span>
                        <span className="text-gray-600">{formatDistanceToNow(new Date(like.createdAt), { addSuffix: true })}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty icon={Heart} label="You haven't liked any projects yet"
            sub="Browse projects and hit the heart button to like them" />
        )
      )}

      {/* ── Comments ───────────────────────────────────────────────────────── */}
      {tab === "comments" && (
        commentsLoading ? <Spinner /> :
        userComments?.length ? (
          <div className="space-y-3">
            {userComments.map((c: any) => (
              <div key={c.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <Link href={`/projects/${c.project?.id}`}
                      className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition">
                      {c.project?.title ?? "Unknown Project"}
                    </Link>
                    <p className="text-[10px] text-gray-600 mt-0.5">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <MessageSquare className="h-4 w-4 text-gray-700 flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={MessageSquare} label="You haven't commented on any projects yet"
            sub="Go to a project page and leave a comment" />
        )
      )}

      {/* ── Saved ──────────────────────────────────────────────────────────── */}
      {tab === "saved" && (
        savedLoading ? <Spinner /> :
        savedProjects?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedProjects.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`}
                className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition group">
                <div className="w-14 h-14 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden">
                  {p.coverImage
                    ? (p.coverImage.startsWith("data:video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(p.coverImage)
                      ? <video src={p.coverImage} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                      : <img src={p.coverImage} alt="" className="w-full h-full object-cover" />)
                    : <div className="w-full h-full flex items-center justify-center">
                        <Bookmark className="h-5 w-5 text-indigo-400" />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition truncate">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {p.owner?.avatarUrl && <img src={p.owner.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full" />}
                    <span className="text-[10px] text-gray-600">{p.owner?.username}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty icon={Bookmark} label="You haven't saved any projects yet"
            sub="Click the bookmark icon on any project to save it here" />
        )
      )}

      {/* ── Repo Requests ──────────────────────────────────────────────────── */}
      {tab === "repo" && (
        (repoLoading || accessLoading) ? <Spinner /> : (
          <>
            {/* Repository access requests (private repo) */}
            {repoRequests && repoRequests.length > 0 && (
              <div className="mb-5">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-purple-400" />Repository Access Requests
                </h2>
                <div className="space-y-3">
                  {repoRequests.map((r: any) => (
                    <div key={r.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${r.project?.id}`}
                            className="text-sm font-semibold text-white hover:text-indigo-400 transition block truncate">
                            {r.project?.title ?? "Unknown Project"}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Role: <span className="text-gray-300">{r.requestedRole}</span>
                          </p>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            Submitted {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </p>
                          {r.status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-green-400 mt-1">
                              <CheckCircle className="h-3 w-3" />Joined Project
                            </span>
                          )}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_PILL[r.status] ?? "text-gray-400 bg-gray-800"}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project join requests */}
            {accessRequests && accessRequests.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GitPullRequest className="h-3.5 w-3.5 text-indigo-400" />Project Access Requests
                </h2>
                <div className="space-y-3">
                  {accessRequests.map((r: any) => (
                    <div key={r.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${r.project?.id}`}
                            className="text-sm font-semibold text-white hover:text-indigo-400 transition block truncate">
                            {r.project?.title ?? "Unknown Project"}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.reason}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            Submitted {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </p>
                          {r.status === "APPROVED" && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-green-400 mt-1">
                              <CheckCircle className="h-3 w-3" />Joined Project
                            </span>
                          )}
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_PILL[r.status] ?? "text-gray-400 bg-gray-800"}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!repoRequests?.length && !accessRequests?.length) && (
              <Empty icon={KeyRound} label="You haven't sent any repo requests yet"
                sub="Request repository access or join access on project pages" />
            )}
          </>
        )
      )}

      {/* ── Applications ───────────────────────────────────────────────────── */}
      {tab === "applications" && (
        appsLoading ? <Spinner /> :
        myApplications?.length ? (
          <div className="space-y-3">
            {myApplications.map((app: any) => {
              const opp = app.opportunity;
              return (
                <div key={app.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {opp?.title ?? "Unknown Opportunity"}
                      </p>
                      <p className="text-xs text-indigo-400 mt-0.5">{opp?.role}</p>
                      {opp?.project && (
                        <Link href={`/projects/${opp.project.id}`}
                          className="text-[10px] text-gray-500 hover:text-gray-400 mt-0.5 block">
                          Project: {opp.project.title}
                        </Link>
                      )}
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_PILL[app.status] ?? "text-gray-400 bg-gray-800"}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty icon={Briefcase} label="You haven't applied to any opportunities yet"
            sub="Browse the Opportunities tab in Explore and apply" />
        )
      )}
    </div>
  );
}
