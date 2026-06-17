"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { usersAPI, connectionsAPI, aiAPI } from "@/lib/api";
import {
  Mail, Calendar, FolderGit2, Users, ExternalLink,
  MapPin, Globe, Bookmark, Clock, Link2, Brain,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import Link from "next/link";
import { ProfileSkeleton, FeedSkeleton } from "@/components/Skeleton";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  const { data: userProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["userProjects", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserProjects(user!.id); return data; },
    enabled: !!user,
  });

  const { data: userMemberships } = useQuery({
    queryKey: ["userMemberships", user?.id],
    queryFn: async () => { const { data } = await usersAPI.getUserMemberships(user!.id); return data; },
    enabled: !!user,
  });

  const { data: counts } = useQuery({
    queryKey: ["connCounts", user?.id],
    queryFn: async () => { const { data } = await connectionsAPI.getCounts(user!.id); return data; },
    enabled: !!user,
  });

  const { data: suggestedProjects } = useQuery({
    queryKey: ["aiSuggestedProjects"],
    queryFn: async () => { const { data } = await aiAPI.getSuggestedProjects(); return data; },
    enabled: !!user,
  });

  if (!isAuthenticated || !user) return (
    <div className="flex items-center justify-center py-20 text-gray-400">Please login</div>
  );

  const contributing = (userMemberships ?? []).filter((m: any) => m.role !== "OWNER");

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Profile Card */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-5">
        <div className="flex items-start gap-5">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-20 h-20 rounded-2xl flex-shrink-0" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{user.username}</h1>
              <Link href="/settings" className="text-xs text-indigo-400 border border-indigo-800 px-3 py-1.5 rounded-xl hover:bg-indigo-900/30 transition">
                Edit Profile
              </Link>
            </div>
            {user.bio && <p className="text-sm text-gray-400 mt-1 max-w-md leading-relaxed">{user.bio}</p>}

            <div className="flex flex-wrap gap-3 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3.5 w-3.5" />{user.email}</span>
              {user.githubUsername && (
                <a href={user.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                  <ExternalLink className="h-3.5 w-3.5" />@{user.githubUsername}
                </a>
              )}
              {user.location && <span className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                  <Globe className="h-3.5 w-3.5" />Website
                </a>
              )}
              {(user as any).linkedinUrl && (
                <a href={(user as any).linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                  <Link2 className="h-3.5 w-3.5" />LinkedIn
                </a>
              )}
              {(user as any).twitterUrl && (
                <a href={(user as any).twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300">
                  <Link2 className="h-3.5 w-3.5" />Twitter
                </a>
              )}
              {(user as any).portfolioUrl && (
                <a href={(user as any).portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300">
                  <Globe className="h-3.5 w-3.5" />Portfolio
                </a>
              )}
              {(user as any).availabilityHours && (
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <Clock className="h-3.5 w-3.5" />{(user as any).availabilityHours} hrs/week available
                </span>
              )}
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <Calendar className="h-3.5 w-3.5" />Joined {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((s, i) => (
                <span key={i} className="text-xs text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-800 text-center">
          {[
            { label: "Projects",    value: user._count?.projects ?? 0 },
            { label: "Memberships", value: user._count?.projectMemberships ?? 0 },
            { label: "Connections", value: counts?.connections ?? 0 },
            { label: "Followers",   value: counts?.followers ?? 0 },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { href: "/my-projects",   label: "My Projects",    icon: FolderGit2, color: "indigo" },
          { href: "/connections",   label: "Connections",    icon: Users,      color: "purple" },
          { href: "/saved",         label: "Saved",          icon: Bookmark,   color: "yellow" },
          { href: "/repo-requests", label: "Repo Requests",  icon: FolderGit2, color: "pink" },
        ].map(({ href, label, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2 text-sm text-gray-300 bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl hover:border-gray-700 transition">
            <Icon className={`h-4 w-4 text-${color}-400`} />{label}
          </Link>
        ))}
      </div>

      {/* AI Suggested Projects */}
      {suggestedProjects && suggestedProjects.length > 0 && (
        <div className="mb-5">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-indigo-400" />Recommended For You
          </h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {suggestedProjects.slice(0, 4).map(p => <ProjectFeedCard key={p.id} project={p} />)}
          </div>
        </div>
      )}

      {/* Owned Projects */}
      {loadingProjects ? (
        <FeedSkeleton count={2} />
      ) : userProjects && userProjects.length > 0 ? (
        <div className="mb-5">
          <h2 className="text-base font-semibold text-white mb-3">Owned Projects</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {userProjects.map(p => <ProjectFeedCard key={p.id} project={p} />)}
          </div>
        </div>
      ) : null}

      {/* Contributing */}
      {contributing.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Contributing To</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {contributing.map((m: any) => <ProjectFeedCard key={m.id} project={m.project} />)}
          </div>
        </div>
      )}
    </div>
  );
}
