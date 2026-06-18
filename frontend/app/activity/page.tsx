"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersAPI, savesAPI, repoRequestsAPI, opportunitiesAPI, accessRequestsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MessageSquare, Bookmark, KeyRound, Briefcase, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const TABS = [
  { key: "likes",        label: "Likes",           icon: Heart },
  { key: "comments",     label: "Comments",         icon: MessageSquare },
  { key: "saved",        label: "Saved",            icon: Bookmark },
  { key: "repo",         label: "Repo Requests",    icon: KeyRound },
  { key: "applications", label: "Applications",     icon: Briefcase },
] as const;
type Tab = typeof TABS[number]["key"];

const STATUS_PILL: Record<string, string> = {
  PENDING:  "text-yellow-400 bg-yellow-900/30 border border-yellow-800/40",
  APPROVED: "text-green-400 bg-green-900/30 border border-green-800/40",
  REJECTED: "text-red-400 bg-red-900/30 border border-red-800/40",
  OPEN:     "text-blue-400 bg-blue-900/30 border border-blue-800/40",
};

function Empty({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
      <Icon className="h-12 w-12 mx-auto mb-3 text-gray-700" />
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-sm text-gray-500">{sub}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function YourActivityPage() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("likes");

  // Likes — direct DB query via new endpoint
  const { data: likedProjects, isLoading: likesLoading } = useQuery({
    queryKey: ["activity-likes", user?.id],
    queryFn: async () => {
      const { data } = await usersAPI.getUserLikedProjects(user!.id);
      return data;
    },
    enabled: isAuthenticated && tab === "likes" && !!user?.id,
  });

  // Comments — direct DB query via new endpoint
  const { data: userComments, isLoading: commentsLoading } = useQuery({
    queryKey: ["activity-comments", user?.id],
    queryFn: async () => {
      const { data } = await usersAPI.getUserComments(user!.id);
      return data;
    },
    enabled: isAuthenticated && tab === "comments" && !!user?.id,
  });

  // Saved projects
  const { data: savedProjects, isLoading: savedLoading } = useQuery({
    queryKey: ["activity-saved"],
    queryFn: async () => {
      const { data } = await savesAPI.getSaved();
      return data;
    },
    enabled: isAuthenticated && tab === "saved",
  });

  // Repo requests — both RepositoryAccessRequest and ProjectAccessRequest
  const { data: repoRequests, isLoading: repoLoading } = useQuery({
    queryKey: ["activity-repo"],
    queryFn: async () => {
      const { data } = await repoRequestsAPI.getMine();
      return data;
    },
    enabled: isAuthenticated && tab === "repo",
  });

  const { data: accessRequests, isLoading: accessLoading } = useQuery({
    queryKey: ["activity-access"],
    queryFn: async () => {
      const { data } = await accessRequestsAPI.getMine();
      return data;
    },
    enabled: isAuthenticated && tab === "repo",
  });

  // Applications (opportunity applications)
  const { data: myOpps, isLoading: oppsLoading } = useQuery({
    queryKey: ["activity-applications"],
    queryFn: async () => {
      const { data } = await opportunitiesAPI.getMine();
      return data;
    },
    enabled: isAuthenticated && tab === "applications",
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-500">
      Please login to view your activity
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-green-400" />Your Activity
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Everything you've done on DevMitra</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* ── Likes ─────────────────────────────────────────────────────────── */}
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
                  {/* Project cover thumbnail */}
                  <div className="w-16 h-16 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden">
                    {p.coverImage
                      ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center">
                          <Heart className="h-6 w-6 text-red-400" />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition truncate">{p.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {p.owner?.avatarUrl && <img src={p.owner.avatarUrl} alt="" className="w-4 h-4 rounded-full" />}
                      <span className="text-[10px] text-gray-600">{p.owner?.username}</span>
                      <span className="text-[10px] text-gray-700">·</span>
                      <span className="flex items-center gap-1 text-[10px] text-red-400">
                        <Heart className="h-3 w-3" />{p._count?.likes ?? 0}
                      </span>
                      <span className="text-[10px] text-gray-600 ml-auto">
                        {formatDistanceToNow(new Date(like.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : <Empty icon={Heart} label="No liked projects" sub="Like projects on the explore page to see them here" />
      )}

      {/* ── Comments ──────────────────────────────────────────────────────── */}
      {tab === "comments" && (
        commentsLoading ? <Spinner /> :
        userComments?.length ? (
          <div className="space-y-3">
            {userComments.map((c: any) => (
              <div key={c.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <Link href={`/projects/${c.project?.id}`}
                    className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition">
                    {c.project?.title ?? "Unknown Project"}
                  </Link>
                  <span className="text-[10px] text-gray-600 flex-shrink-0">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
        ) : <Empty icon={MessageSquare} label="No comments yet" sub="Comment on projects to see them here" />
      )}

      {/* ── Saved ─────────────────────────────────────────────────────────── */}
      {tab === "saved" && (
        savedLoading ? <Spinner /> :
        savedProjects?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedProjects.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`}
                className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition group">
                <div className="w-16 h-16 rounded-xl bg-gray-800 flex-shrink-0 overflow-hidden">
                  {p.coverImage
                    ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center">
                        <Bookmark className="h-6 w-6 text-indigo-400" />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white group-hover:text-indigo-400 transition truncate">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {p.owner?.avatarUrl && <img src={p.owner.avatarUrl} alt="" className="w-4 h-4 rounded-full" />}
                    <span className="text-[10px] text-gray-600">{p.owner?.username}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : <Empty icon={Bookmark} label="No saved projects" sub="Bookmark projects to find them here" />
      )}

      {/* ── Repo Requests ─────────────────────────────────────────────────── */}
      {tab === "repo" && (
        (repoLoading || accessLoading) ? <Spinner /> : (
          <>
            {/* Repository access requests */}
            {repoRequests && repoRequests.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-purple-400" />Repository Access Requests
                </h2>
                <div className="space-y-3">
                  {repoRequests.map((r: any) => (
                    <div key={r.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${r.project?.id}`}
                            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition">
                            {r.project?.title ?? "Unknown Project"}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5">Role requested: {r.requestedRole}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </p>
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

            {/* Project access requests */}
            {accessRequests && accessRequests.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-indigo-400" />Project Access Requests
                </h2>
                <div className="space-y-3">
                  {accessRequests.map((r: any) => (
                    <div key={r.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link href={`/projects/${r.project?.id}`}
                            className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 transition">
                            {r.project?.title ?? "Unknown Project"}
                          </Link>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{r.reason}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </p>
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
              <Empty icon={KeyRound} label="No requests sent" sub="Request access to projects and it will appear here" />
            )}
          </>
        )
      )}

      {/* ── Applications ──────────────────────────────────────────────────── */}
      {tab === "applications" && (
        oppsLoading ? <Spinner /> :
        myOpps?.length ? (
          <div className="space-y-3">
            {myOpps.map((o: any) => (
              <Link key={o.id} href={`/explore?tab=opportunities`}
                className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition">
                <Briefcase className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{o.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{o.role}</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {formatDistanceToNow(new Date(o.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_PILL[o.status] ?? "text-gray-400 bg-gray-800"}`}>
                  {o.status}
                </span>
              </Link>
            ))}
          </div>
        ) : <Empty icon={Briefcase} label="No applications yet" sub="Apply to opportunities to see them here" />
      )}
    </div>
  );
}
