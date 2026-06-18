"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usersAPI, connectionsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Calendar, FolderGit2, Users, ExternalLink, MapPin, Globe, Lock, Link2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import ConnectButton from "@/components/ConnectButton";
import { ProfileSkeleton, FeedSkeleton } from "@/components/Skeleton";
import Link from "next/link";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { user: me } = useAuth();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: async () => { const { data } = await usersAPI.getById(userId); return data; },
    enabled: !!userId,
  });

  const { data: userProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["userProjectsPublic", userId],
    queryFn: async () => { const { data } = await usersAPI.getUserProjects(userId); return data; },
    enabled: !!userId && !(error),
  });

  const { data: counts } = useQuery({
    queryKey: ["connCounts", userId],
    queryFn: async () => { const { data } = await connectionsAPI.getCounts(userId); return data; },
    enabled: !!userId,
  });

  if (isLoading) return <ProfileSkeleton />;

  if ((error as any)?.response?.status === 403) return (
    <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
      <Lock className="h-12 w-12 mx-auto mb-3 text-gray-700" />
      <p className="text-white font-medium mb-1">Private Profile</p>
      <p className="text-sm text-gray-500">This developer's profile is not publicly visible</p>
    </div>
  );

  if (!profile) return <div className="text-center py-20 text-gray-500">User not found</div>;

  const isSelf = me?.id === userId;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Profile Card */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <Link href={`/users/${userId}`}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="w-20 h-20 rounded-2xl flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-white">{profile.username.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">{profile.username}</h1>
              {profile.bio && <p className="text-sm text-gray-400 mt-1 max-w-md leading-relaxed">{profile.bio}</p>}
              <div className="flex flex-wrap gap-3 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3.5 w-3.5" />{profile.email}</span>
                {profile.githubUsername && (
                  <a href={profile.githubProfileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                    <ExternalLink className="h-3.5 w-3.5" />@{profile.githubUsername}
                  </a>
                )}
                {profile.location && <span className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300">
                    <Globe className="h-3.5 w-3.5" />Website
                  </a>
                )}
                {(profile as any).linkedinUrl && (
                  <a href={(profile as any).linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                    <Link2 className="h-3.5 w-3.5" />LinkedIn
                  </a>
                )}
                {(profile as any).twitterUrl && (
                  <a href={(profile as any).twitterUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300">
                    <Link2 className="h-3.5 w-3.5" />Twitter
                  </a>
                )}
                {(profile as any).portfolioUrl && (
                  <a href={(profile as any).portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300">
                    <Globe className="h-3.5 w-3.5" />Portfolio
                  </a>
                )}
                {(profile as any).availabilityHours && (
                  <span className="flex items-center gap-1.5 text-xs text-green-400">
                    <Clock className="h-3.5 w-3.5" />{(profile as any).availabilityHours} hrs/week
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Calendar className="h-3.5 w-3.5" />Joined {formatDistanceToNow(new Date(profile.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center flex-shrink-0">
            {!isSelf && (
              <>
                <ConnectButton userId={userId} />
                <Link href={`/messages?user=${userId}`}
                  className="flex items-center gap-2 text-sm text-gray-300 border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-800 transition">
                  Message
                </Link>
              </>
            )}
            {isSelf && (
              <Link href="/settings" className="text-xs text-indigo-400 border border-indigo-800 px-3 py-1.5 rounded-xl hover:bg-indigo-900/30 transition">
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {(profile.skills as string[]).map((s: string, i: number) => (
                <span key={i} className="text-xs text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t border-gray-800 text-center">
          {[
            { label: "Projects",    value: profile._count?.projects ?? 0 },
            { label: "Memberships", value: profile._count?.projectMemberships ?? 0 },
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

      {/* Projects */}
      {loadingProjects ? (
        <FeedSkeleton count={2} />
      ) : userProjects && userProjects.length > 0 ? (
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Projects by {profile.username}</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {userProjects.map(p => <ProjectFeedCard key={p.id} project={p} />)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
