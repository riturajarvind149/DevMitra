"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { projectsAPI, storiesAPI, developersAPI } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import StoryBar from "@/components/StoryBar";
import Carousel from "@/components/Carousel";
import {
  FolderIcon,
  GitPrIcon,
  UsersIcon,
  ArrowRightIcon,
  TerminalIcon,
  ExternalLinkIcon,
  ShieldIcon,
  ActivityIcon,
} from "@/components/icons";
import Link from "next/link";
import ConnectButton from "@/components/ConnectButton";
import { FeedSkeleton, DeveloperCardSkeleton } from "@/components/Skeleton";

export default function Home() {
  const { isAuthenticated, login, user } = useAuth();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) {
        if (err === "oauth_csrf") {
          setAuthError("OAuth session expired or blocked by browser shields. Please try again.");
        } else if (err === "auth_failed") {
          setAuthError("GitHub authentication failed. Please verify your account credentials.");
        } else {
          setAuthError("Authentication error occurred. Please try again.");
        }
      }
    }
  }, []);

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ["homeFeed"],
    queryFn: async () => {
      const { data } = await projectsAPI.getAll({ limit: 20 });
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: storiesData } = useQuery({
    queryKey: ["activeStories"],
    queryFn: async () => {
      const { data } = await storiesAPI.getActive();
      return data;
    },
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

  // ── GUEST / LANDING INTERFACE ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen surface-base text-primary flex flex-col justify-between px-4 sm:px-8 py-12 font-sans">
        <div className="max-w-5xl mx-auto w-full my-auto space-y-12">
          {/* Main Hero Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
            <div className="max-w-xl space-y-5">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 surface-raised border border-subtle rounded-sm text-[11px] font-mono text-amber-500">
                <TerminalIcon className="h-3.5 w-3.5" />
                <span>DEVMITRA PLATFORM V2.4</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-primary tracking-tight leading-tight">
                Where Developers <br />
                <span className="text-amber-500 font-mono">Build And Ship Together</span>
              </h1>

              <p className="text-sm text-secondary leading-relaxed font-sans max-w-lg">
                Showcase real repositories, coordinate code reviews, track resolved bugs,
                and connect with engineers worldwide through verified GitHub evidence.
              </p>

              {authError && (
                <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-mono">
                  ERROR: {authError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={login}
                  className="flex items-center justify-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold px-6 py-3 rounded-sm transition text-xs"
                >
                  <FolderIcon className="h-4 w-4" />
                  <span>Continue with GitHub</span>
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </button>

                <Link
                  href="/explore"
                  className="flex items-center justify-center gap-2 surface-raised hover:bg-amber-500/10 text-secondary hover:text-primary border border-subtle font-mono px-5 py-3 rounded-sm transition text-xs"
                >
                  <span>Explore Repositories</span>
                </Link>
              </div>
            </div>

            {/* Split Product Demo Panel */}
            <div className="w-full lg:w-96 surface-card border border-subtle rounded-sm p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-subtle pb-3 text-xs font-mono">
                <span className="text-muted uppercase tracking-wider">Live Platform Telemetry</span>
                <span className="text-emerald-500 flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Operational
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="p-3 surface-input border border-subtle rounded-sm flex justify-between items-center">
                  <span className="text-secondary">Verified Developers</span>
                  <span className="text-amber-500 font-bold">1,250+</span>
                </div>
                <div className="p-3 surface-input border border-subtle rounded-sm flex justify-between items-center">
                  <span className="text-secondary">Repositories Deployed</span>
                  <span className="text-blue-500 font-bold">450+</span>
                </div>
                <div className="p-3 surface-input border border-subtle rounded-sm flex justify-between items-center">
                  <span className="text-secondary">Pull Requests Merged</span>
                  <span className="text-emerald-500 font-bold">2,100+</span>
                </div>
                <div className="p-3 surface-input border border-subtle rounded-sm flex justify-between items-center">
                  <span className="text-secondary">AI Code Audits</span>
                  <span className="text-amber-500 font-bold">890 Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── AUTHENTICATED WORKSTATION FEED ─────────────────────────────────────────
  const recent = projectsData?.projects ?? [];
  const spotlightProjects = recent.slice(0, 3);

  return (
    <div className="space-y-5 font-sans">
      {/* Welcome Banner */}
      <div className="surface-card border border-subtle rounded-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-primary font-mono">
            Welcome back, @{user?.username}
          </h1>
          <p className="text-xs text-muted mt-0.5 font-sans">
            Community activity feed and active project updates
          </p>
        </div>

        <Link
          href="/projects/new"
          className="self-start sm:self-auto text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 px-3.5 py-1.5 rounded-sm transition"
        >
          + Publish Project
        </Link>
      </div>

      {/* Ephemeral Developer Stories */}
      <StoryBar stories={storiesData ?? []} />

      {/* Featured Showcase Carousel */}
      {spotlightProjects.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FolderIcon className="h-3.5 w-3.5 text-amber-500" />
              Community Spotlight
            </h2>
            <span className="text-[10px] font-mono text-muted">Live Repositories</span>
          </div>

          <Carousel
            items={spotlightProjects}
            renderItem={(item) => (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold text-amber-500">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-mono text-muted surface-raised px-1.5 py-0.5 rounded-[2px] border border-subtle">
                      @{item.owner?.username}
                    </span>
                  </div>
                  <p className="text-xs text-secondary line-clamp-2 max-w-xl font-sans">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link
                    href={`/projects/${item.id}`}
                    className="text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-gray-950 px-3 py-1.5 rounded-sm transition"
                  >
                    View Project
                  </Link>
                </div>
              </div>
            )}
          />
        </div>
      )}

      {/* Suggested Developers Strip */}
      {(loadingDevs || (suggestedDevs && suggestedDevs.length > 0)) && (
        <div className="surface-card border border-subtle rounded-sm p-4">
          <div className="flex items-center justify-between mb-3 border-b border-subtle pb-2">
            <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <UsersIcon className="h-3.5 w-3.5 text-sky-500" />
              Engineers to Connect With
            </h2>
            <Link
              href="/connections?tab=discover"
              className="text-xs font-mono text-amber-500 hover:underline"
            >
              View Directory
            </Link>
          </div>

          {loadingDevs ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[...Array(3)].map((_, i) => (
                <DeveloperCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(suggestedDevs ?? []).slice(0, 3).map((dev) => (
                <div
                  key={dev.id}
                  className="surface-raised border border-subtle rounded-sm p-3 flex items-center justify-between gap-2.5"
                >
                  <Link href={`/users/${dev.id}`} className="flex items-center gap-2.5 min-w-0">
                    {dev.avatarUrl ? (
                      <img
                        src={dev.avatarUrl}
                        alt={dev.username}
                        className="w-8 h-8 rounded-sm object-cover border border-subtle"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-sm surface-base border border-subtle flex items-center justify-center font-mono font-bold text-amber-500 text-xs">
                        {dev.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-primary block truncate hover:text-amber-500 font-mono">
                        @{dev.username}
                      </span>
                      {dev.skills?.length > 0 && (
                        <span className="text-[10px] font-mono text-muted block truncate">
                          {dev.skills.slice(0, 2).join(", ")}
                        </span>
                      )}
                    </div>
                  </Link>
                  <ConnectButton userId={dev.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Project Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <ActivityIcon className="h-3.5 w-3.5 text-amber-500" />
            Repository Feed
          </h2>
          <Link
            href="/explore"
            className="text-xs font-mono text-amber-500 hover:underline flex items-center gap-1"
          >
            <span>Explore all</span>
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>

        {loadingProjects ? (
          <FeedSkeleton count={3} />
        ) : recent.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {recent.map((p) => (
              <ProjectFeedCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 surface-card rounded-sm border border-subtle p-6 space-y-3 font-mono">
            <FolderIcon className="h-10 w-10 mx-auto text-muted" />
            <p className="text-xs text-muted">No projects published yet in the community.</p>
            <Link
              href="/projects/new"
              className="inline-block text-xs font-bold text-amber-500 hover:underline"
            >
              + Create the first project
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
