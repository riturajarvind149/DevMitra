"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  usersAPI,
  savesAPI,
  repoRequestsAPI,
  accessRequestsAPI,
  activitiesAPI,
  bugReportsAPI,
  pullRequestsAPI,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  HeartIcon,
  ChatIcon,
  BookmarkIcon,
  LockIcon,
  BriefcaseIcon,
  ActivityIcon,
  CheckIcon,
  CloseIcon,
  FolderIcon,
  UsersIcon,
  GitPrIcon,
  AlertTriangleIcon,
} from "@/components/icons";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

// Status pills
const STATUS_PILL = {
  PENDING:  "text-amber-500 bg-amber-500/10 border border-amber-500/30",
  APPROVED: "text-emerald-500 bg-emerald-500/10 border border-emerald-500/30",
  REJECTED: "text-red-500 bg-red-500/10 border border-red-500/30",
  OPEN:     "text-sky-500 bg-sky-500/10 border border-sky-500/30",
};

// Activity action icons
const ACTION_META = {
  PROJECT_CREATED:         { icon: FolderIcon,     color: "text-amber-500",  label: "Created project" },
  PROJECT_UPDATED:         { icon: FolderIcon,     color: "text-sky-500",    label: "Updated project" },
  MEMBER_JOINED:           { icon: UsersIcon,      color: "text-emerald-500",label: "Joined project" },
  MEMBER_LEFT:             { icon: UsersIcon,      color: "text-red-500",    label: "Left project" },
  ACCESS_REQUEST_CREATED:  { icon: GitPrIcon,      color: "text-amber-500",  label: "Requested access" },
  ACCESS_REQUEST_APPROVED: { icon: CheckIcon,      color: "text-emerald-500",label: "Access approved" },
  ACCESS_REQUEST_REJECTED: { icon: CloseIcon,      color: "text-red-500",    label: "Access rejected" },
};

function Empty({ icon: Icon, label, sub }) {
  return (
    <div className="text-center py-14 surface-card rounded-sm border border-subtle p-6 space-y-2">
      <Icon className="h-8 w-8 mx-auto text-muted mb-2" />
      <p className="text-sm font-bold font-mono text-primary">{label}</p>
      <p className="text-xs text-muted max-w-sm mx-auto font-sans">{sub}</p>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-14">
      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function CountBadge({ count, active }) {
  if (!count) return null;
  return (
    <span
      className={`ml-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-[2px] ${
        active
          ? "bg-gray-950 text-amber-400"
          : "surface-card text-muted border border-subtle"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function YourActivityPage() {
  const { user, isAuthenticated } = useAuth();
  const [tab, setTab] = useState("likes");

  const { data: likedProjects, isLoading: likesLoading } = useQuery({
    queryKey: ["activity-likes", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserLikedProjects(user.id); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: userComments, isLoading: commentsLoading } = useQuery({
    queryKey: ["activity-comments", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserComments(user.id); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: savedProjects, isLoading: savedLoading } = useQuery({
    queryKey: ["activity-saved"],
    queryFn: async () => { const { data } = await savesAPI.getSaved(); return data; },
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const { data: repoRequests, isLoading: repoLoading } = useQuery({
    queryKey: ["activity-repo", user?.id],
    queryFn: async () => { const { data } = await repoRequestsAPI.getMine(); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: accessRequests, isLoading: accessLoading } = useQuery({
    queryKey: ["activity-access", user?.id],
    queryFn: async () => { const { data } = await accessRequestsAPI.getMine(); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: myApplications, isLoading: appsLoading } = useQuery({
    queryKey: ["activity-applications", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getMyApplications(); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: myBugReports, isLoading: bugsLoading } = useQuery({
    queryKey: ["activity-bugs", user?.id],
    queryFn: async () => { const { data } = await bugReportsAPI.getMine(); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: myPRs, isLoading: prsLoading } = useQuery({
    queryKey: ["activity-prs", user?.id],
    queryFn: async () => { const { data } = await pullRequestsAPI.getMine(); return data; },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 30000,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ["activity-timeline", user?.id],
    queryFn: async () => {
      const { data } = await activitiesAPI.getUserActivities(user.id, { limit: 20 });
      return data.activities ?? [];
    },
    enabled: isAuthenticated && !!user?.id,
    staleTime: 60000,
  });

  if (!isAuthenticated || !user) return (
    <div className="flex items-center justify-center py-20 text-muted font-mono">
      Please sign in to view your activity log
    </div>
  );

  const repoCount = (repoRequests?.length ?? 0) + (accessRequests?.length ?? 0);

  const TABS = [
    { key: "likes",        label: "Likes",         icon: HeartIcon,         count: likedProjects?.length ?? 0 },
    { key: "comments",     label: "Comments",      icon: ChatIcon,          count: userComments?.length ?? 0 },
    { key: "saved",        label: "Saved",         icon: BookmarkIcon,      count: savedProjects?.length ?? 0 },
    { key: "repo",         label: "Repo Requests", icon: LockIcon,          count: repoCount },
    { key: "applications", label: "Applications",  icon: BriefcaseIcon,     count: myApplications?.length ?? 0 },
    { key: "bugs",         label: "Bug Reports",   icon: AlertTriangleIcon, count: myBugReports?.length ?? 0 },
    { key: "prs",          label: "Pull Requests", icon: GitPrIcon,         count: myPRs?.length ?? 0 },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-2">
          <ActivityIcon className="h-5 w-5 text-amber-500" />
          <span>Your Activity</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Everything you have engineered, reviewed, and saved on DevMitra
        </p>
      </div>

      {/* Recent Activity Timeline */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="surface-card rounded-sm border border-subtle p-4">
          <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <ActivityIcon className="h-3.5 w-3.5 text-amber-500" />
            <span>Recent Activity</span>
          </h2>
          <div className="space-y-2">
            {recentActivity.slice(0, 8).map((act) => {
              const meta = ACTION_META[act.action] ?? { icon: ActivityIcon, color: "text-muted", label: act.action };
              const Icon = meta.icon;
              return (
                <div key={act.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-sm surface-raised border border-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className={`h-3 w-3 ${meta.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary leading-snug">{act.description}</p>
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  {act.project && (
                    <Link
                      href={`/projects/${act.project.id}`}
                      className="text-[10px] font-mono text-amber-500 hover:underline flex-shrink-0"
                    >
                      View &rarr;
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs with count badges */}
      <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm flex-wrap w-fit">
        {TABS.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono transition ${
              tab === key
                ? "bg-amber-500 text-gray-950 font-bold"
                : "text-muted hover:text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
            <CountBadge count={count} active={tab === key} />
          </button>
        ))}
      </div>

      {/* Likes */}
      {tab === "likes" && (
        likesLoading ? <Spinner /> :
        likedProjects?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {likedProjects.map((like) => {
              const p = like.project;
              if (!p) return null;
              return (
                <Link
                  key={like.id}
                  href={`/projects/${p.id}`}
                  className="flex items-start gap-3 p-3.5 surface-card border border-subtle rounded-sm hover:border-amber-500/40 transition group"
                >
                  <div className="w-12 h-12 rounded-sm surface-raised border border-subtle flex-shrink-0 overflow-hidden">
                    {p.coverImage
                      ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-red-400">
                          <HeartIcon className="h-4 w-4" filled />
                        </div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold font-mono text-primary group-hover:text-amber-500 transition truncate">
                      {p.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{p.description}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted font-mono">
                      <span>@{p.owner?.username}</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1 text-red-400">
                        <HeartIcon className="h-3 w-3" filled />
                        <span>{p._count?.likes ?? 0}</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <Empty icon={HeartIcon} label="No liked projects yet"
            sub="Browse the repository feed and star projects to view them here." />
        )
      )}

      {/* Comments */}
      {tab === "comments" && (
        commentsLoading ? <Spinner /> :
        userComments?.length ? (
          <div className="space-y-2.5">
            {userComments.map((c) => (
              <div key={c.id} className="p-3.5 surface-card border border-subtle rounded-sm">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div>
                    <Link
                      href={`/projects/${c.project?.id}`}
                      className="text-xs font-bold font-mono text-amber-500 hover:underline"
                    >
                      {c.project?.title ?? "Unknown Project"}
                    </Link>
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <ChatIcon className="h-3.5 w-3.5 text-muted flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-xs text-secondary leading-relaxed font-sans">{c.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={ChatIcon} label="No comments posted yet"
            sub="Contribute feedback and discussion on active repositories." />
        )
      )}

      {/* Saved */}
      {tab === "saved" && (
        savedLoading ? <Spinner /> :
        savedProjects?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {savedProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                className="flex items-start gap-3 p-3.5 surface-card border border-subtle rounded-sm hover:border-amber-500/40 transition group"
              >
                <div className="w-12 h-12 rounded-sm surface-raised border border-subtle flex-shrink-0 overflow-hidden">
                  {p.coverImage
                    ? <img src={p.coverImage} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-amber-500">
                        <BookmarkIcon className="h-4 w-4" filled />
                      </div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold font-mono text-primary group-hover:text-amber-500 transition truncate">
                    {p.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5 line-clamp-1">{p.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted font-mono">
                    <span>@{p.owner?.username}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Empty icon={BookmarkIcon} label="No bookmarks saved"
            sub="Bookmark repositories you want to track or collaborate on later." />
        )
      )}

      {/* Repo Requests */}
      {tab === "repo" && (
        (repoLoading || accessLoading) ? <Spinner /> : (
          <div className="space-y-4">
            {repoRequests && repoRequests.length > 0 && (
              <div>
                <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <LockIcon className="h-3.5 w-3.5 text-amber-500" />
                  <span>Repository Access Requests</span>
                </h2>
                <div className="space-y-2">
                  {repoRequests.map((r) => (
                    <div key={r.id} className="p-3.5 surface-card border border-subtle rounded-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/projects/${r.project?.id}`}
                            className="text-xs font-bold font-mono text-primary hover:text-amber-500 block truncate"
                          >
                            {r.project?.title ?? "Unknown Project"}
                          </Link>
                          <p className="text-xs text-muted mt-0.5 font-sans">
                            Role: <span className="text-secondary font-mono">{r.requestedRole}</span>
                          </p>
                          <p className="text-[10px] text-muted font-mono mt-0.5">
                            Submitted {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] flex-shrink-0 ${STATUS_PILL[r.status] ?? "text-muted surface-raised"}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {accessRequests && accessRequests.length > 0 && (
              <div>
                <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <GitPrIcon className="h-3.5 w-3.5 text-sky-500" />
                  <span>Project Access Requests</span>
                </h2>
                <div className="space-y-2">
                  {accessRequests.map((r) => (
                    <div key={r.id} className="p-3.5 surface-card border border-subtle rounded-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/projects/${r.project?.id}`}
                            className="text-xs font-bold font-mono text-primary hover:text-amber-500 block truncate"
                          >
                            {r.project?.title ?? "Unknown Project"}
                          </Link>
                          <p className="text-xs text-muted mt-0.5 line-clamp-1">{r.reason}</p>
                          <p className="text-[10px] text-muted font-mono mt-0.5">
                            Submitted {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] flex-shrink-0 ${STATUS_PILL[r.status] ?? "text-muted surface-raised"}`}>
                          {r.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!repoRequests?.length && !accessRequests?.length) && (
              <Empty icon={LockIcon} label="No repo requests found"
                sub="Request repository access or apply to join projects across DevMitra." />
            )}
          </div>
        )
      )}

      {/* Applications */}
      {tab === "applications" && (
        appsLoading ? <Spinner /> :
        myApplications?.length ? (
          <div className="space-y-2.5">
            {myApplications.map((app) => {
              const opp = app.opportunity;
              return (
                <div key={app.id} className="p-3.5 surface-card border border-subtle rounded-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold font-mono text-primary truncate">
                        {opp?.title ?? "Unknown Opportunity"}
                      </p>
                      <p className="text-xs text-amber-500 font-mono mt-0.5">{opp?.role}</p>
                      {opp?.project && (
                        <Link
                          href={`/projects/${opp.project.id}`}
                          className="text-[10px] text-muted hover:underline mt-0.5 block font-mono"
                        >
                          Project: {opp.project.title}
                        </Link>
                      )}
                      <p className="text-[10px] text-muted font-mono mt-0.5">
                        Applied {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] flex-shrink-0 ${STATUS_PILL[app.status] ?? "text-muted surface-raised"}`}>
                      {app.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <Empty icon={BriefcaseIcon} label="No applications submitted yet"
            sub="Browse open opportunities to apply for roles with verified builders." />
        )
      )}

      {/* Bug Reports */}
      {tab === "bugs" && (
        bugsLoading ? <Spinner /> :
        (myBugReports ?? []).length ? (
          <div className="space-y-2.5">
            {myBugReports.map((report) => (
              <div key={report.id} className="p-3.5 surface-card border border-subtle rounded-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-[2px] bg-red-500/10 text-red-500 border border-red-500/30">
                        {report.severity}
                      </span>
                      <span className="text-[10px] text-muted font-mono">{report.type?.replace("_", " ")}</span>
                    </div>
                    <p className="text-xs font-bold font-mono text-primary">{report.title}</p>
                    {report.project && (
                      <Link
                        href={`/projects/${report.project.id}`}
                        className="text-[10px] text-amber-500 hover:underline block mt-0.5 font-mono"
                      >
                        &rarr; {report.project.title}
                      </Link>
                    )}
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] flex-shrink-0 ${STATUS_PILL[report.status] ?? "text-muted surface-raised"}`}>
                    {report.status?.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={AlertTriangleIcon} label="No bug reports logged"
            sub="File bug reports on repositories to coordinate issue resolution." />
        )
      )}

      {/* Pull Requests */}
      {tab === "prs" && (
        prsLoading ? <Spinner /> :
        (myPRs ?? []).length ? (
          <div className="space-y-2.5">
            {myPRs.map((pr) => (
              <div key={pr.id} className="p-3.5 surface-card border border-subtle rounded-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-muted font-mono">{pr.type?.replace("_", " ")}</span>
                      {pr.isPaid && (
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.2 rounded-[2px]">
                          Paid
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold font-mono text-primary">{pr.title}</p>
                    {pr.project && (
                      <Link
                        href={`/projects/${pr.project.id}`}
                        className="text-[10px] text-amber-500 hover:underline block mt-0.5 font-mono"
                      >
                        &rarr; {pr.project.title}
                      </Link>
                    )}
                    <p className="text-[10px] text-muted font-mono mt-0.5">
                      {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[2px] flex-shrink-0 ${
                    pr.status === "MERGED" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30" :
                    pr.status === "CLOSED" ? "surface-raised text-muted border border-subtle" :
                    "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                  }`}>
                    {pr.status?.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={GitPrIcon} label="No pull requests found"
            sub="Submit code changes to collaborative repositories to track PRs here." />
        )
      )}
    </div>
  );
}
