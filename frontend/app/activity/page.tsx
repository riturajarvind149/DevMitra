"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { likesAPI, commentsAPI, savesAPI, repoRequestsAPI, opportunitiesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Heart, MessageSquare, Bookmark, KeyRound, Briefcase, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const TABS = [
  { key: "likes",       label: "Likes",        icon: Heart },
  { key: "comments",    label: "Comments",      icon: MessageSquare },
  { key: "saved",       label: "Saved",         icon: Bookmark },
  { key: "repo",        label: "Repo Requests", icon: KeyRound },
  { key: "applications",label: "Applications",  icon: Briefcase },
] as const;
type Tab = typeof TABS[number]["key"];

const STATUS_COLORS: Record<string, string> = {
  PENDING:  "text-yellow-400 bg-yellow-900/30",
  APPROVED: "text-green-400 bg-green-900/30",
  REJECTED: "text-red-400 bg-red-900/30",
  OPEN:     "text-blue-400 bg-blue-900/30",
};

export default function YourActivityPage() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("likes");

  const { data: savedProjects } = useQuery({
    queryKey: ["saved-activity"],
    queryFn: async () => { const { data } = await savesAPI.getSaved(); return data; },
    enabled: isAuthenticated && tab === "saved",
  });

  const { data: repoRequests } = useQuery({
    queryKey: ["repo-activity"],
    queryFn: async () => { const { data } = await repoRequestsAPI.getMine(); return data; },
    enabled: isAuthenticated && tab === "repo",
  });

  const { data: myOpportunities } = useQuery({
    queryKey: ["opp-apps-activity"],
    queryFn: async () => { const { data } = await opportunitiesAPI.getMine(); return data; },
    enabled: isAuthenticated && tab === "applications",
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-500">Please login to view your activity</div>
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Likes tab — projects the user liked */}
      {tab === "likes" && <LikesTab userId={user!.id} />}

      {/* Comments tab */}
      {tab === "comments" && <CommentsTab userId={user!.id} />}

      {/* Saved projects */}
      {tab === "saved" && (
        savedProjects?.length ? (
          <div className="space-y-3">
            {savedProjects.map((p: any) => (
              <Link key={p.id} href={`/projects/${p.id}`}
                className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition">
                <Bookmark className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{p.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{p.description}</p>
                </div>
                <span className="text-xs text-gray-600 flex-shrink-0">{p.owner?.username}</span>
              </Link>
            ))}
          </div>
        ) : <Empty icon={Bookmark} label="No saved projects" sub="Bookmark projects to find them here" />
      )}

      {/* Repo requests */}
      {tab === "repo" && (
        repoRequests?.length ? (
          <div className="space-y-3">
            {repoRequests.map((r: any) => (
              <div key={r.id} className="p-4 bg-gray-900 border border-gray-800 rounded-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/projects/${r.project?.id}`} className="text-sm font-semibold text-white hover:text-indigo-400 transition">{r.project?.title}</Link>
                    <p className="text-xs text-gray-500 mt-0.5">Role: {r.requestedRole}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[r.status] ?? "text-gray-400 bg-gray-800"}`}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : <Empty icon={KeyRound} label="No repo requests" sub="Request repository access to projects you want to contribute to" />
      )}

      {/* Applications */}
      {tab === "applications" && (
        myOpportunities?.length ? (
          <div className="space-y-3">
            {myOpportunities.map((o: any) => (
              <Link key={o.id} href={`/explore?tab=opportunities`}
                className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition">
                <Briefcase className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{o.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{o.role}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${STATUS_COLORS[o.status] ?? "text-gray-400 bg-gray-800"}`}>{o.status}</span>
              </Link>
            ))}
          </div>
        ) : <Empty icon={Briefcase} label="No applications yet" sub="Apply to opportunities to see them here" />
      )}
    </div>
  );
}

function Empty({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
      <Icon className="h-12 w-12 mx-auto mb-3 text-gray-700" />
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-sm text-gray-500">{sub}</p>
    </div>
  );
}

function LikesTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-likes-activity", userId],
    queryFn: async () => {
      const { data } = await import("@/lib/api").then(m => m.activitiesAPI.getUserActivities(userId, { limit: 50 }));
      return (data as any).activities?.filter((a: any) => a.action === "PROJECT_LIKED" || a.action?.includes("LIKE")) ?? [];
    },
  });

  if (isLoading) return <Spinner />;
  if (!data?.length) return <Empty icon={Heart} label="No liked projects" sub="Like projects to see them here" />;
  return (
    <div className="space-y-3">
      {data.map((a: any) => (
        <div key={a.id} className="flex items-center gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl">
          <Heart className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-gray-300">{a.description}</p>
            {a.project && <Link href={`/projects/${a.project.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 mt-0.5 block">{a.project.title}</Link>}
          </div>
          <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
        </div>
      ))}
    </div>
  );
}

function CommentsTab({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["user-comments-activity", userId],
    queryFn: async () => {
      const { data } = await import("@/lib/api").then(m => m.activitiesAPI.getUserActivities(userId, { limit: 50 }));
      return (data as any).activities?.filter((a: any) => a.action?.includes("COMMENT")) ?? [];
    },
  });

  if (isLoading) return <Spinner />;
  if (!data?.length) return <Empty icon={MessageSquare} label="No comments yet" sub="Comment on projects to see them here" />;
  return (
    <div className="space-y-3">
      {data.map((a: any) => (
        <div key={a.id} className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl">
          <MessageSquare className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-300">{a.description}</p>
            {a.project && <Link href={`/projects/${a.project.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 mt-0.5 block">{a.project.title}</Link>}
            <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
}
