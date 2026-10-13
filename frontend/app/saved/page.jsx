"use client";

import { useQuery } from "@tanstack/react-query";
import { savesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import { BookmarkIcon, ArrowRightIcon } from "@/components/icons";
import Link from "next/link";

export default function SavedProjectsPage() {
  const { isAuthenticated } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["savedProjects"],
    queryFn: async () => { const { data } = await savesAPI.getSaved(); return data; },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-muted font-mono">
      Please sign in to view bookmarked repositories
    </div>
  );

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-2">
          <BookmarkIcon className="h-5 w-5 text-amber-500" filled />
          <span>Saved Projects</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-0.5">
          Projects and repositories you have bookmarked for quick access
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-5">
          {projects.map(p => <ProjectFeedCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="text-center py-16 surface-card rounded-sm border border-subtle p-6 space-y-3 font-mono">
          <BookmarkIcon className="h-10 w-10 mx-auto text-muted" />
          <p className="text-sm font-bold text-primary">No saved projects</p>
          <p className="text-xs text-muted max-w-sm mx-auto font-sans">
            Bookmark repositories you want to track or reference anytime.
          </p>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-amber-500 hover:underline mt-2"
          >
            <span>Browse Repositories</span>
            <ArrowRightIcon className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
