"use client";

import { useQuery } from "@tanstack/react-query";
import { savesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import { Bookmark } from "lucide-react";
import Link from "next/link";

export default function SavedProjectsPage() {
  const { isAuthenticated } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["savedProjects"],
    queryFn: async () => { const { data } = await savesAPI.getSaved(); return data; },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-500">Please login to view saved projects</div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bookmark className="h-6 w-6 text-indigo-400" /> Saved Projects
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Projects you've bookmarked</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {projects.map(p => <ProjectFeedCard key={p.id} project={p} />)}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
          <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-700" />
          <p className="text-white font-medium mb-1">No saved projects</p>
          <p className="text-sm text-gray-500 mb-4">Bookmark projects you want to revisit</p>
          <Link href="/explore" className="inline-block text-sm text-indigo-400 hover:text-indigo-300">Browse Projects →</Link>
        </div>
      )}
    </div>
  );
}
