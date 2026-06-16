"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { statsAPI, projectsAPI } from "@/lib/api";
import {
  FolderGit2,
  Users,
  GitPullRequest,
  Activity,
  ArrowRight,
  Github,
} from "lucide-react";
import ProjectCard from "@/components/ProjectCard";

export default function Home() {
  const { isAuthenticated, login } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["platformStats"],
    queryFn: async () => {
      const { data } = await statsAPI.getPlatformStats();
      return data;
    },
  });

  const { data: projectsData } = useQuery({
    queryKey: ["projects", { limit: 6 }],
    queryFn: async () => {
      const { data } = await projectsAPI.getAll({ limit: 6 });
      return data;
    },
  });

  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to DevMitra
          </h1>
          <p className="text-xl mb-8 text-indigo-100 max-w-2xl mx-auto">
            A developer collaboration platform where you can discover amazing
            projects, request access to contribute, and build together with
            talented developers worldwide.
          </p>
          {!isAuthenticated ? (
            <button
              onClick={login}
              className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
            >
              <Github className="h-6 w-6" />
              <span>Get Started with GitHub</span>
            </button>
          ) : (
            <Link
              href="/projects"
              className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition text-lg"
            >
              <span>Explore Projects</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-12 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Users className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.users}
                </div>
                <div className="text-gray-600">Developers</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <FolderGit2 className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.projects}
                </div>
                <div className="text-gray-600">Projects</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <GitPullRequest className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.accessRequests.total}
                </div>
                <div className="text-gray-600">Requests</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className="p-3 bg-orange-100 rounded-full">
                    <Activity className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.activities}
                </div>
                <div className="text-gray-600">Activities</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Projects */}
      {projectsData && projectsData.projects.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Recent Projects
              </h2>
              <Link
                href="/projects"
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectsData.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Discover Projects</h3>
              <p className="text-gray-600">
                Browse through amazing projects created by developers worldwide.
                Filter by tech stack, search by name, or explore trending
                projects.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Request Access</h3>
              <p className="text-gray-600">
                Found an interesting project? Submit an access request with your
                reason and how you can contribute. Project owners will review
                your request.
              </p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Collaborate</h3>
              <p className="text-gray-600">
                Once approved, become a contributor! Work with the team, track
                activities, and help build something amazing together.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
