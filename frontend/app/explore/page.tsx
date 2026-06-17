"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsAPI } from "@/lib/api";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import { Search, Filter } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { FeedSkeleton } from "@/components/Skeleton";

const CATEGORIES = ["All", "SaaS", "AI/ML", "Health", "Marketing", "E-commerce", "DevTools", "Mobile", "Other"];

function ExploreContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [owner, setOwner] = useState("");
  const [category, setCategory] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["explore", search, owner, category],
    queryFn: async () => {
      const { data } = await projectsAPI.getAll({
        search: search || undefined,
        owner: owner || undefined,
        limit: 50,
      });
      // Client-side category filter
      if (category !== "All") {
        return { ...data, projects: data.projects.filter(p => p.category === category) };
      }
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Explore Projects</h1>
        <p className="text-sm text-gray-500">Discover projects from developers around the world</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-6 border border-gray-800 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by owner..."
              value={owner}
              onChange={e => setOwner(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                category === cat
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <FeedSkeleton count={4} />
      ) : data && data.projects.length > 0 ? (
        <>
          <p className="text-sm text-gray-500 mb-4">{data.projects.length} projects found</p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {data.projects.map(project => (
              <ProjectFeedCard key={project.id} project={project} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <Search className="h-12 w-12 mx-auto mb-3 text-gray-700" />
          <p>No projects found</p>
          <p className="text-sm mt-1">Try different search terms</p>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense>
      <ExploreContent />
    </Suspense>
  );
}
