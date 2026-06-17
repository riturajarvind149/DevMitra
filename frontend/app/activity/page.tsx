"use client";

import { useQuery } from "@tanstack/react-query";
import { developersAPI } from "@/lib/api";
import { Activity, FolderGit2, Users, Heart, UserPlus, KeyRound, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const ACTION_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  PROJECT_CREATED:   { icon: FolderGit2, color: "text-indigo-400", bg: "bg-indigo-900/40" },
  PROJECT_UPDATED:   { icon: FolderGit2, color: "text-blue-400",   bg: "bg-blue-900/40" },
  PROJECT_DELETED:   { icon: FolderGit2, color: "text-red-400",    bg: "bg-red-900/40" },
  MEMBER_JOINED:     { icon: UserPlus,   color: "text-green-400",  bg: "bg-green-900/40" },
  MEMBER_LEFT:       { icon: Users,      color: "text-yellow-400", bg: "bg-yellow-900/40" },
  ACCESS_REQUEST_CREATED:  { icon: Users, color: "text-purple-400", bg: "bg-purple-900/40" },
  ACCESS_REQUEST_APPROVED: { icon: Users, color: "text-green-400",  bg: "bg-green-900/40" },
  ACCESS_REQUEST_REJECTED: { icon: Users, color: "text-red-400",    bg: "bg-red-900/40" },
};

export default function ActivityFeedPage() {
  const { data: activities, isLoading } = useQuery({
    queryKey: ["activityFeed"],
    queryFn: async () => { const { data } = await developersAPI.getActivityFeed({ limit: 50 }); return data; },
    refetchInterval: 60000,
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Activity className="h-6 w-6 text-green-400" />Activity Feed
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">What's happening across the community</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : activities && activities.length > 0 ? (
        <div className="space-y-2">
          {(activities as any[]).map((act: any) => {
            const meta = ACTION_META[act.action] ?? { icon: Activity, color: "text-gray-400", bg: "bg-gray-800" };
            const Icon = meta.icon;
            return (
              <div key={act.id} className="flex items-start gap-4 p-4 bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  {act.user?.avatarUrl
                    ? <img src={act.user.avatarUrl} alt="" className="w-9 h-9 rounded-xl object-cover" />
                    : <Icon className={`h-4 w-4 ${meta.color}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 leading-snug">{act.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-600">{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</span>
                    {act.project && (
                      <Link href={`/projects/${act.project.id}`} className="text-xs text-indigo-400 hover:text-indigo-300">
                        {act.project.title}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
          <Activity className="h-12 w-12 mx-auto mb-3 text-gray-700" />
          <p className="text-white font-medium mb-1">No activity yet</p>
          <p className="text-sm text-gray-500">Community activity will appear here</p>
        </div>
      )}
    </div>
  );
}
