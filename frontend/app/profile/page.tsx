"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { usersAPI } from "@/lib/api";
import { Github, Mail, Calendar, FolderGit2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ProjectCard from "@/components/ProjectCard";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();

  const { data: userProjects } = useQuery({
    queryKey: ["userProjects", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await usersAPI.getUserProjects(user.id);
      console.log("User projects loaded:", data);
      return data;
    },
    enabled: !!user,
  });

  const { data: userMemberships } = useQuery({
    queryKey: ["userMemberships", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await usersAPI.getUserMemberships(user.id);
      console.log("User memberships loaded:", data);
      return data;
    },
    enabled: !!user,
  });

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Required
        </h1>
        <p className="text-gray-600">Please login to view your profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
        <div className="flex items-start space-x-6">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="h-24 w-24 rounded-full"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-3xl font-bold text-indigo-600">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {user.username}
            </h1>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              {user.githubUsername && (
                <div className="flex items-center space-x-2 text-gray-600">
                  <Github className="h-4 w-4" />
                  <a
                    href={user.githubProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    @{user.githubUsername}
                  </a>
                </div>
              )}
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined{" "}
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-gray-200">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <FolderGit2 className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {user._count?.projects || 0}
            </div>
            <div className="text-sm text-gray-600">Owned Projects</div>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {user._count?.projectMemberships || 0}
            </div>
            <div className="text-sm text-gray-600">Memberships</div>
          </div>
        </div>
      </div>

      {/* Owned Projects */}
      {userProjects && userProjects.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Owned Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {/* Project Memberships */}
      {userMemberships && userMemberships.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Contributing To
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userMemberships.map((membership) => (
              <ProjectCard key={membership.id} project={membership.project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
