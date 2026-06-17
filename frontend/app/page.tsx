"use client";

import { useAuth } from "@/hooks/useAuth";
import { projectsAPI, storiesAPI, developersAPI } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import StoryBar from "@/components/StoryBar";
import { FolderGit2, GitPullRequest, Users, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import ConnectButton from "@/components/ConnectButton";
import { FeedSkeleton, DeveloperCardSkeleton } from "@/components/Skeleton";

export default function Home() {
  const { isAuthenticated, login, user } = useAuth();

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["homeFeed"],
    queryFn: async () => { const { data } = await projectsAPI.getAll({ limit: 12 }); return data; },
    enabled: isAuthenticated,
  });

  const { data: storiesData } = useQuery({
    queryKey: ["activeStories"],
    queryFn: async () => { const { data } = await storiesAPI.getActive(); return data; },
    enabled: isAuthenticated,
  });

  const { data: suggestedDevs, isLoading: loadingDevs } = useQuery({
    queryKey: ["suggestedDevs"],
    queryFn: async () => {
      try {
        const { data } = await developersAPI.getSuggested();
        return data;
      } catch {
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  // ── Landing ───────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center max-w-xl mb-16">
          <div className="w-18 h-18 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-500/30 p-4">
            <FolderGit2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            Where Developers<br /><span className="text-indigo-400">Build Together</span>
          </h1>
          <p className="text-lg text-gray-400 mb-10">
            Discover projects, showcase your work, connect with developers — the LinkedIn + GitHub + Instagram for builders.
          </p>
          <button onClick={login}
            className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition shadow-xl">
            <span>🔗</span>
            <span>Continue with GitHub</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-900 border border-gray-800 rounded-2xl p-8">
          {[
            { icon: FolderGit2, color: "indigo", title: "Discover Projects", desc: "Browse real projects by developers worldwide." },
            { icon: GitPullRequest, color: "purple", title: "Request to Collaborate", desc: "Submit proposals and get approved by owners." },
            { icon: Users, color: "pink", title: "Grow Your Network", desc: "Connect with developers and share your journey." },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-gray-800">
                <Icon className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Authenticated feed ────────────────────────────────────────────────────
  const trending = [...(projectsData?.projects ?? [])].sort((a, b) => (b._count?.members ?? 0) - (a._count?.members ?? 0)).slice(0, 4);
  const recent   = projectsData?.projects ?? [];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Welcome */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-white">Welcome back, {user?.username}!</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening in the community</p>
      </div>

      {/* Stories */}
      <StoryBar stories={storiesData ?? []} />

      {/* Suggested Developers */}
      {(loadingDevs || (suggestedDevs && suggestedDevs.length > 0)) && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-400" />Suggested Developers
            </h2>
            <Link href="/developers" className="text-xs text-indigo-400 hover:text-indigo-300">See more</Link>
          </div>
          {loadingDevs ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <DeveloperCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(suggestedDevs ?? []).slice(0, 4).map((dev: any) => (
                <div key={dev.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3 hover:border-gray-700 transition">
                  <Link href={`/users/${dev.id}`}>
                    {dev.avatarUrl ? (
                      <img src={dev.avatarUrl} alt="" className="w-10 h-10 rounded-xl flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-white">{dev.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/users/${dev.id}`} className="text-sm font-medium text-white hover:text-indigo-400 transition block truncate">{dev.username}</Link>
                    {dev.skills?.length > 0 && (
                      <p className="text-[10px] text-gray-500 truncate">{dev.skills.slice(0, 3).join(" · ")}</p>
                    )}
                  </div>
                  <ConnectButton userId={dev.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Trending */}
      {trending.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />Trending Projects
            </h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {trending.map(p => <ProjectFeedCard key={p.id} project={p} />)}
          </div>
        </div>
      )}

      {/* Full feed */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-white">Project Feed</h2>
        <Link href="/explore" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          Explore all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {loadingProjects ? (
        <FeedSkeleton count={4} />
      ) : recent.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {recent.map(p => <ProjectFeedCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
          <FolderGit2 className="h-12 w-12 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400">No projects yet — be the first!</p>
          <Link href="/projects/new" className="mt-2 inline-block text-sm text-indigo-400">Create a project →</Link>
        </div>
      )}
    </div>
  );
}
