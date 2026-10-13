"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI } from "@/lib/api";
import {
  Bell, CheckCheck, GitPullRequest, CheckCircle,
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

const TYPE_CATEGORY = {
  ACCESS_REQUEST: "proposals", REQUEST_APPROVED: "proposals", REQUEST_REJECTED: "proposals",
  REPO_REQUEST: "proposals", REPO_APPROVED: "proposals", REPO_REJECTED: "proposals",
  OPPORTUNITY_APPLICATION: "proposals", OPPORTUNITY_APPROVED: "proposals",
  PROJECT_COMMENTED: "comments",
  PROJECT_LIKED: "social", CONNECTION_REQUEST: "social", CONNECTION_ACCEPTED: "social",
  CONTRIBUTOR_REMOVED: "social",
  STORY_LIKE: "social",
  BUG_REPORT: "proposals", PULL_REQUEST: "proposals", PR_REVIEWED: "proposals",
  NEW_RATING: "social", ANNOUNCEMENT: "proposals", PROJECT_COMPLETED: "social",
};

const NOTIF_META = {
  ACCESS_REQUEST:          { icon: GitPullRequest, color: "text-amber-500",  bg: "bg-amber-500/10" },
  REQUEST_APPROVED:        { icon: CheckCircle,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
  REQUEST_REJECTED:        { icon: XCircle,        color: "text-red-500",     bg: "bg-red-500/10" },
  REPO_REQUEST:            { icon: KeyRound,       color: "text-amber-500",  bg: "bg-amber-500/10" },
  REPO_APPROVED:           { icon: CheckCircle,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
  REPO_REJECTED:           { icon: XCircle,        color: "text-red-500",     bg: "bg-red-500/10" },
  OPPORTUNITY_APPLICATION: { icon: Briefcase,      color: "text-amber-500",  bg: "bg-amber-500/10" },
  OPPORTUNITY_APPROVED:    { icon: CheckCircle,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
  PROJECT_COMMENTED:       { icon: MessageSquare,  color: "text-sky-500",    bg: "bg-sky-500/10" },
  PROJECT_LIKED:           { icon: Heart,          color: "text-red-500",     bg: "bg-red-500/10" },
  STORY_LIKE:              { icon: Heart,          color: "text-red-500",     bg: "bg-red-500/10" },
  CONNECTION_REQUEST:      { icon: Users,          color: "text-amber-500",  bg: "bg-amber-500/10" },
  CONNECTION_ACCEPTED:     { icon: CheckCircle,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
  CONTRIBUTOR_REMOVED:     { icon: XCircle,        color: "text-red-500",     bg: "bg-red-500/10" },
  BUG_REPORT:              { icon: Bell,           color: "text-amber-500",  bg: "bg-amber-500/10" },
  PULL_REQUEST:            { icon: GitPullRequest, color: "text-amber-500",  bg: "bg-amber-500/10" },
  PR_REVIEWED:             { icon: CheckCircle,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
  NEW_RATING:              { icon: Heart,          color: "text-amber-500",  bg: "bg-amber-500/10" },
  ANNOUNCEMENT:            { icon: Bell,           color: "text-amber-500",  bg: "bg-amber-500/10" },
  PROJECT_COMPLETED:       { icon: CheckCircle,    color: "text-emerald-500", bg: "bg-emerald-500/10" },
};

function timeLabel(date) {
  const d = new Date(date);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return "Yesterday";
  return formatDistanceToNow(d, { addSuffix: true });
}

function isNew(notif) {
  // NEW = unread AND created within 6 hours
  // Once read, it always moves to EARLIER regardless of age
  if (notif.read) return false;
  return new Date(notif.createdAt) > subDays(new Date(), 0.25); // 0.25 days = 6 hours
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

  // Auto-mark all as read when the page is visited — optimistically zero the count
  // immediately so the TopBar bell badge clears without waiting for the server
  useEffect(() => {
    queryClient.setQueryData(["notificationCount"], 0);
    notificationsAPI.markAllAsRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAllMut = useMutation({
    mutationFn: () => notificationsAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationCount"] });
    },
  });

  const markOneMut = useMutation({
    mutationFn: (id) => notificationsAPI.markAsRead(id),
    // Optimistically mark read in cache so it moves to EARLIER immediately
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const prev = queryClient.getQueryData(["notifications"]);
      queryClient.setQueryData(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: Math.max(0, (old.unreadCount ?? 1) - 1),
          notifications: old.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        };
      });
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["notifications"], ctx.prev);
    },
    onSettled: () => {
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

  // Split into NEW (unread, < 6h) and EARLIER (everything else)
  const newNotifs     = filtered.filter(n => isNew(n));
  const earlierNotifs = filtered.filter(n => !isNew(n));

  const NotifRow = ({ notif }) => {
    const meta = NOTIF_META[notif.type] ?? { icon: Bell, color: "text-muted", bg: "surface-raised" };
    const Icon = meta.icon;
    return (
      <div
        className={`flex items-start gap-3 px-4 py-3.5 transition hover:surface-raised cursor-pointer ${
          !notif.read ? "bg-amber-500/[0.05]" : ""
        }`}
        onClick={() => !notif.read && markOneMut.mutate(notif.id)}
      >
        {/* Avatar or icon */}
        <div className={`w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
          {notif.sender?.avatarUrl ? (
            <img src={notif.sender.avatarUrl} alt="" className="w-9 h-9 rounded-sm object-cover" />
          ) : (
            <Icon className={`h-4 w-4 ${meta.color}`} />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${!notif.read ? "text-primary font-semibold" : "text-secondary"}`}>
            {notif.message}
          </p>
          <p className="text-[10px] text-muted font-mono mt-0.5">{timeLabel(notif.createdAt)}</p>
          {notif.link && (
            <Link href={notif.link}
              className="text-[10px] text-amber-500 hover:underline mt-0.5 inline-block font-mono"
              onClick={e => e.stopPropagation()}>
              View →
            </Link>
          )}
        </div>

        {/* Unread dot */}
        {!notif.read && (
          <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-2">
            <span>Notifications</span>
            {unread > 0 && (
              <span className="text-xs font-mono font-bold bg-amber-500 text-gray-950 px-2 py-0.5 rounded-[2px]">{unread}</span>
            )}
          </h1>
          <p className="text-xs text-muted mt-0.5 font-mono">{unread > 0 ? `${unread} unread events` : "All notifications caught up"}</p>
        </div>
        {unread > 0 && (
          <button onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-secondary hover:text-primary surface-card border border-subtle px-3 py-1.5 rounded-sm hover:surface-raised transition disabled:opacity-50">
            <CheckCheck className="h-3.5 w-3.5" />Mark all read
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm w-fit flex-wrap">
        {CATEGORIES.map(({ key, label }) => {
          const count = key === "all" ? unread
            : all.filter(n => !n.read && (TYPE_CATEGORY[n.type] ?? "social") === key).length;
          return (
            <button key={key} onClick={() => setCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono transition ${
                category === key ? "bg-amber-500 text-gray-950 font-bold" : "text-muted hover:text-primary"}`}>
              <span>{label}</span>
              {count > 0 && (
                <span className="text-[9px] font-mono font-bold bg-red-500 text-white min-w-[14px] h-3.5 px-1 rounded-[2px] flex items-center justify-center">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="surface-card rounded-sm border border-subtle overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-subtle last:border-0">
              <div className="w-9 h-9 rounded-sm surface-raised animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 surface-raised animate-pulse rounded w-3/4" />
                <div className="h-2.5 surface-raised animate-pulse rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="surface-card rounded-sm border border-subtle overflow-hidden">
          {/* NEW section */}
          {newNotifs.length > 0 && (
            <>
              <div className="px-4 py-2 surface-raised border-b border-subtle">
                <span className="text-[10px] font-bold text-muted font-mono uppercase tracking-widest">New</span>
              </div>
              <div className="divide-y divide-subtle">
                {newNotifs.map(n => <NotifRow key={n.id} notif={n} />)}
              </div>
            </>
          )}

          {/* EARLIER section */}
          {earlierNotifs.length > 0 && (
            <>
              <div className="px-4 py-2 surface-raised border-t border-b border-subtle">
                <span className="text-[10px] font-bold text-muted font-mono uppercase tracking-widest">Earlier</span>
              </div>
              <div className="divide-y divide-subtle">
                {earlierNotifs.map(n => <NotifRow key={n.id} notif={n} />)}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 surface-card rounded-sm border border-subtle text-muted">
          <Bell className="h-12 w-12 mb-3 text-muted/40" />
          <p className="text-primary font-medium">No notifications</p>
          <p className="text-sm mt-1 font-mono">
            {category === "all" ? "You're all caught up!" : `No ${category} notifications yet`}
          </p>
        </div>
      )}
    </div>
  );
}
