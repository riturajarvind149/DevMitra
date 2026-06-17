"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI, projectMembersAPI, accessRequestsAPI, activitiesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ExternalLink, Github, Users, Calendar, Activity as ActivityIcon, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState("");
  const [suggestion, setSuggestion] = useState("");

  // Fetch project details
  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data } = await projectsAPI.getById(projectId);
      console.log("Project loaded:", data);
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch membership status
  const { data: membership } = useQuery({
    queryKey: ["membership", projectId],
    queryFn: async () => {
      const { data } = await projectMembersAPI.checkMembership(projectId);
      console.log("Membership status:", data);
      return data;
    },
    enabled: isAuthenticated && !!projectId,
  });

  // Fetch activities
  const { data: activitiesData } = useQuery({
    queryKey: ["activities", projectId],
    queryFn: async () => {
      const { data } = await activitiesAPI.getProjectActivities(projectId, { limit: 10 });
      console.log("Activities loaded:", data);
      return data;
    },
    enabled: !!projectId,
  });

  // Create access request
  const requestMutation = useMutation({
    mutationFn: (data: { projectId: string; reason: string; suggestion: string }) =>
      accessRequestsAPI.create(data),
    onSuccess: () => {
      console.log("Access request created successfully");
      alert("Access request submitted successfully!");
      setShowRequestModal(false);
      setReason("");
      setSuggestion("");
      queryClient.invalidateQueries({ queryKey: ["membership", projectId] });
    },
    onError: (error: any) => {
      console.error("Failed to create access request:", error);
      alert(error.response?.data?.message || "Failed to submit request");
    },
  });

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    requestMutation.mutate({ projectId, reason, suggestion });
  };

  const isOwner = user && project && project.ownerId === user.id;
  const isMember = membership?.isMember;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600">Failed to load project</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/projects"
        className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Projects
      </Link>

      {/* Project Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
            <p className="text-gray-600 text-lg">{project.description}</p>
          </div>
          {isAuthenticated && !isOwner && !isMember && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="ml-4 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Request Access
            </button>
          )}
          {isMember && !isOwner && (
            <span className="ml-4 bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium">
              ✓ Member
            </span>
          )}
          {isOwner && (
            <span className="ml-4 bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium">
              Owner
            </span>
          )}
        </div>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-6">
          <div className="flex items-center space-x-2">
            {project.owner?.avatarUrl && (
              <img
                src={project.owner.avatarUrl}
                alt={project.owner.username}
                className="h-6 w-6 rounded-full"
              />
            )}
            <span>by {project.owner?.username || "Unknown"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{project._count?.members || 0} members</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Links */}
        <div className="flex space-x-4 pt-6 border-t border-gray-200">
          <a
            href={project.deployedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ExternalLink className="h-5 w-5" />
            <span>Visit Live Site</span>
          </a>
          {project.githubRepoUrl && !project.isRepoPrivate && (
            <a
              href={project.githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              <Github className="h-5 w-5" />
              <span>View Repository</span>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Members */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Team Members ({project.members?.length || 0})
            </h2>
            <div className="space-y-3">
              {project.members && project.members.length > 0 ? (
                project.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {member.user.avatarUrl && (
                        <img
                          src={member.user.avatarUrl}
                          alt={member.user.username}
                          className="h-10 w-10 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{member.user.username}</p>
                        <p className="text-sm text-gray-600">{member.user.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        member.role === "OWNER"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {member.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-600">No members yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ActivityIcon className="h-5 w-5 mr-2" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {activitiesData && activitiesData.activities.length > 0 ? (
                activitiesData.activities.map((activity) => (
                  <div key={activity.id} className="text-sm">
                    <p className="text-gray-900">{activity.description}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-sm">No activity yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request Access
            </h2>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to join? *
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="I'm interested in contributing because..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How can you contribute? *
                </label>
                <textarea
                  required
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="I can help with..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={requestMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition disabled:bg-gray-400"
                >
                  {requestMutation.isPending ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
