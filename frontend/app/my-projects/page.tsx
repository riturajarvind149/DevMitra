"use client";

import { useQuery } from "@tanstack/react-query";
import { projectsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ProjectCard from "@/components/ProjectCard";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function MyProjectsPage() {
  const { user, isAuthenticated } = useAuth();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["myProjects"],
    queryFn: async () => {
      const { data } = await projectsAPI.getMyProjects();
      console.log("My projects loaded:", data);
      return data;
    },
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Required
        </h1>
        <p className="text-gray-600">Please login to view your projects</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
          <p className="text-gray-600 mt-2">
            Projects you own and manage
          </p>
        </div>
        <Link
          href="/projects/new"
          className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5" />
          <span>Create Project</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your projects...</p>
        </div>
      ) : projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600 mb-4">You haven't created any projects yet</p>
          <Link
            href="/projects/new"
            className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
          >
            <Plus className="h-5 w-5" />
            <span>Create Your First Project</span>
          </Link>
        </div>
      )}
    </div>
  );
}
