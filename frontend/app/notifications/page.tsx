"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "@/lib/api";
import { Bell, CheckCheck, Check, GitPullRequest, CheckCircle, XCircle, Users, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { NotificationSkeleton } from "@/components/Skeleton";

const NOTIF_META: Record<string, { icon: React.ElementType; iconColor: string; bg: string }> = {
  ACCESS_REQUEST:        { icon: GitPullRequest, iconColor: "text-indigo-400",  bg: "bg-indigo-900/40" },
  REQUEST_APPROVED:      { icon: CheckCircle,    iconColor: "text-green-400",   bg: "bg-green-900/40"  },
  REQUEST_REJECTED:      { icon: XCircle,        iconColor: "text-red-400",     bg: "bg-red-900/40"    },
  NEW_MEMBER:            { icon: Users,          iconColor: "text-blue-400",    bg: "bg-blue-900/40"   },
  PROJECT_UPDATE:        { icon: RefreshCw,      iconColor: "text-yellow-400",  bg: "bg-yellow-900/40" },
  PROJECT_LIKED:         { icon: CheckCircle,    iconColor: "text-red-400",     bg: "bg-red-900/40"    },
  PROJECT_COMMENTED:     { icon: Bell,           iconColor: "text-blue-400",    bg: "bg-blue-900/40"   },
  CONNECTION_REQUEST:    { icon: Users,          iconColor: "text-purple-400",  bg: "bg-purple-900/40" },
  CONNECTION_ACCEPTED:   { icon: CheckCircle,    iconColor: "text-green-400",   bg: "bg-green-900/40"  },
  REPO_REQUEST:          { icon: GitPullRequest, iconColor: "text-yellow-400",  bg: "bg-yellow-900/40" },
  REPO_APPROVED:         { icon: CheckCircle,    iconColor: "text-green-400",   bg: "bg-green-900/40"  },
  REPO_REJECTED:         { icon: XCircle,        iconColor: "text-red-400",     bg: "bg-red-900/40"    },
  OPPORTUNITY_APPLICATION:{ icon: Users,         iconColor: "text-indigo-400",  bg: "bg-indigo-900/40" },
  OPPORTUNITY_APPROVED:  { icon: CheckCircle,    iconColor: "text-green-400",   bg: "bg-green-900/40"  },
  MENTION:               { icon: Bell,           iconColor: "text-purple-400",  bg: "bg-purple-900/40" },
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await notificationsAPI.getAll({ limit: 50 });
      return data;
    },
    refetchInterval: 15000,  // poll every 15s — notifications appear without refresh
    staleTime: 10000,
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
  });

  const unread = data?.unreadCount ?? 0;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread > 0 ? `${unread} unread` : "You're all caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 border border-gray-700 px-3 py-2 rounded-xl transition hover:bg-gray-800 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <NotificationSkeleton key={i} />)}
        </div>
      ) : data?.notifications && data.notifications.length > 0 ? (
        <div className="space-y-2">
          {data.notifications.map(notif => {
            const meta = NOTIF_META[notif.type] ?? { icon: Bell, iconColor: "text-gray-400", bg: "bg-gray-800" };
            const Icon = meta.icon;
            return (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition ${
                  notif.read
                    ? "bg-gray-900 border-gray-800"
                    : "bg-gray-900 border-indigo-800/60 ring-1 ring-indigo-800/30"
                }`}
              >
                {/* Icon or avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                  {notif.sender?.avatarUrl ? (
                    <img src={notif.sender.avatarUrl} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <Icon className={`h-5 w-5 ${meta.iconColor}`} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${notif.read ? "text-gray-300" : "text-white font-medium"}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                  </p>
                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="inline-block text-xs text-indigo-400 hover:text-indigo-300 mt-1.5 transition"
                      onClick={() => !notif.read && markOneMutation.mutate(notif.id)}
                    >
                      View →
                    </Link>
                  )}
                </div>

                {/* Mark as read */}
                {!notif.read && (
                  <button
                    onClick={() => markOneMutation.mutate(notif.id)}
                    disabled={markOneMutation.isPending}
                    className="flex-shrink-0 text-gray-600 hover:text-indigo-400 transition p-1 rounded-lg hover:bg-gray-800"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <Bell className="h-14 w-14 mb-4 text-gray-800" />
          <p className="text-white font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
