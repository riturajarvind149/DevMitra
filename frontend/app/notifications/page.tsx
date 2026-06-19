"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "@/lib/api";
import {
  Bell, CheckCheck, Check, GitPullRequest, CheckCircle,
  XCircle, Users, Heart, MessageSquare, KeyRound, Briefcase,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, subDays } from "date-fns";
import Link from "next/link";

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: "all",       label: "All" },
  { key: "proposals", label: "Proposals" },
  { key: "comments",  label: "Comments" },
  { key: "social",    label: "Social" },
];

const TYPE_CATEGORY: Record<string, string> = {
  ACCESS_REQUEST: "proposals", REQUEST_APPROVED: "proposals", REQUEST_REJECTED: "proposals",
  REPO_REQUEST: "proposals", REPO_APPROVED: "proposals", REPO_REJECTED: "proposals",
  OPPORTUNITY_APPLICATION: "proposals", OPPORTUNITY_APPROVED: "proposals",
  PROJECT_COMMENTED: "comments",
  PROJECT_LIKED: "social", CONNECTION_REQUEST: "social", CONNECTION_ACCEPTED: "social",
  CONTRIBUTOR_REMOVED: "social",
};

const NOTIF_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  ACCESS_REQUEST:          { icon: GitPullRequest, color: "text-indigo-400",  bg: "bg-indigo-900/40" },
  REQUEST_APPROVED:        { icon: CheckCircle,    color: "text-green-400",   bg: "bg-green-900/40"  },
  REQUEST_REJECTED:        { icon: XCircle,        color: "text-red-400",     bg: "bg-red-900/40"    },
  REPO_REQUEST:            { icon: KeyRound,       color: "text-yellow-400",  bg: "bg-yellow-900/40" },
  REPO_APPROVED:           { icon: CheckCircle,    color: "text-green-400",   bg: "bg-green-900/40"  },
  REPO_REJECTED:           { icon: XCircle,        color: "text-red-400",     bg: "bg-red-900/40"    },
  OPPORTUNITY_APPLICATION: { icon: Briefcase,      color: "text-indigo-400",  bg: "bg-indigo-900/40" },
  OPPORTUNITY_APPROVED:    { icon: CheckCircle,    color: "text-green-400",   bg: "bg-green-900/40"  },
  PROJECT_COMMENTED:       { icon: MessageSquare,  color: "text-blue-400",    bg: "bg-blue-900/40"   },
  PROJECT_LIKED:           { icon: Heart,          color: "text-red-400",     bg: "bg-red-900/40"    },
  CONNECTION_REQUEST:      { icon: Users,          color: "text-purple-400",  bg: "bg-purple-900/40" },
  CONNECTION_ACCEPTED:     { icon: CheckCircle,    color: "text-green-400",   bg: "bg-green-900/40"  },
  CONTRIBUTOR_REMOVED:     { icon: XCircle,        color: "text-red-400",     bg: "bg-red-900/40"    },
};

function timeLabel(date: string) {
  const d = new Date(date);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return "Yesterday";
  return formatDistanceToNow(d, { addSuffix: true });
}

function isNew(date: string) {
  return new Date(date) > subDays(new Date(), 1);
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await notificationsAPI.getAll({ limit: 50 });
      return data;
    },
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const markAllMut = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
  });

  const markOneMut = useMutation({
    mutationFn: (id: string) => notificationsAPI.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
  });

  const all = data?.notifications ?? [];
  const unread = data?.unreadCount ?? 0;

  // Filter by category
  const filtered = category === "all"
    ? all
    : all.filter(n => (TYPE_CATEGORY[n.type] ?? "social") === category);

  // Split into NEW (< 24h) and EARLIER
  const newNotifs     = filtered.filter(n => !n.read || isNew(n.createdAt));
  const earlierNotifs = filtered.filter(n => n.read && !isNew(n.createdAt));

  const NotifRow = ({ notif }: { notif: (typeof all)[0] }) => {
    const meta = NOTIF_META[notif.type] ?? { icon: Bell, color: "text-gray-400", bg: "bg-gray-800" };
    const Icon = meta.icon;
    return (
      <div
        className={`flex items-start gap-3 px-4 py-3.5 transition hover:bg-gray-800/50 ${
          !notif.read ? "bg-gray-900/80" : ""
        }`}
        onClick={() => !notif.read && markOneMut.mutate(notif.id)}
      >
        {/* Avatar or icon */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          {notif.sender?.avatarUrl ? (
            <img src={notif.sender.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
          ) : (
            <Icon className={`h-4 w-4 ${meta.color}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${!notif.read ? "text-white font-medium" : "text-gray-300"}`}>
            {notif.message}
          </p>
          <p className="text-[10px] text-gray-600 mt-0.5">{timeLabel(notif.createdAt)}</p>
          {notif.link && (
            <Link href={notif.link}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-0.5 inline-block"
              onClick={e => e.stopPropagation()}>
              View →
            </Link>
          )}
        </div>

        {/* Unread dot */}
        {!notif.read && (
          <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            Notifications {unread > 0 && (
              <span className="text-sm font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">{unread}</span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{unread > 0 ? `${unread} unread` : "You're all caught up"}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white border border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-800 transition disabled:opacity-50">
            <CheckCheck className="h-4 w-4" />Mark all read
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-4 w-fit">
        {CATEGORIES.map(({ key, label }) => {
          const count = key === "all" ? unread
            : all.filter(n => !n.read && (TYPE_CATEGORY[n.type] ?? "social") === key).length;
          return (
            <button key={key} onClick={() => setCategory(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                category === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
              {label}
              {count > 0 && (
                <span className="text-[10px] font-bold bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800 last:border-0">
              <div className="w-9 h-9 rounded-full bg-gray-800 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-800 animate-pulse rounded w-3/4" />
                <div className="h-2.5 bg-gray-800 animate-pulse rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
          {/* NEW section */}
          {newNotifs.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-800/50 border-b border-gray-800">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">New</span>
              </div>
              <div className="divide-y divide-gray-800/50">
                {newNotifs.map(n => <NotifRow key={n.id} notif={n} />)}
              </div>
            </>
          )}

          {/* EARLIER section */}
          {earlierNotifs.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gray-800/30 border-t border-b border-gray-800">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Earlier</span>
              </div>
              <div className="divide-y divide-gray-800/50">
                {earlierNotifs.map(n => <NotifRow key={n.id} notif={n} />)}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-900 rounded-2xl border border-gray-800 text-gray-600">
          <Bell className="h-12 w-12 mb-3 text-gray-800" />
          <p className="text-white font-medium">No notifications</p>
          <p className="text-sm mt-1">
            {category === "all" ? "You're all caught up!" : `No ${category} notifications yet`}
          </p>
        </div>
      )}
    </div>
  );
}
