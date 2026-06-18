"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI, projectMembersAPI, accessRequestsAPI, activitiesAPI, repoRequestsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  ExternalLink, Users, Calendar, Activity as ActivityIcon,
  ArrowLeft, FolderGit2, GitPullRequest, CheckCircle,
  Lock, Globe, EyeOff, Briefcase, Shield, GitBranch, Clock, XCircle, Pencil, KeyRound, UserMinus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import CommentSection from "@/components/CommentSection";

// ── Visibility badge ──────────────────────────────────────────────────────────
function VisibilityBadge({ visibility }: { visibility: string }) {
  if (visibility === "PRIVATE")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-900/40 text-red-400">
        <Lock className="h-3 w-3" /> Private
      </span>
    );
  if (visibility === "UNLISTED")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-900/40 text-yellow-400">
        <EyeOff className="h-3 w-3" /> Unlisted
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-900/40 text-green-400">
      <Globe className="h-3 w-3" /> Public
    </span>
  );
}

// ── Request status badge ──────────────────────────────────────────────────────
function RequestStatusBadge({ status }: { status: string }) {
  if (status === "PENDING")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-yellow-900/40 text-yellow-400">
        <Clock className="h-3.5 w-3.5" /> Request Pending
      </span>
    );
  if (status === "APPROVED")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-green-900/40 text-green-400">
        <CheckCircle className="h-3.5 w-3.5" /> Request Approved
      </span>
    );
  if (status === "REJECTED")
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-red-900/40 text-red-400">
        <XCircle className="h-3.5 w-3.5" /> Request Rejected
      </span>
    );
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; username: string } | null>(null);

  // Repo access request modal state
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoForm, setRepoForm] = useState({
    requestedRole: "", githubProfile: "", experienceDescription: "",
    availabilityHours: "", portfolioUrl: "", additionalMessage: "",
  });

  // Project data
  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => { const { data } = await projectsAPI.getById(projectId); return data; },
    enabled: !!projectId,
  });

  // Membership status
  const { data: membership } = useQuery({
    queryKey: ["membership", projectId],
    queryFn: async () => {
      const { data } = await projectMembersAPI.checkMembership(projectId);
      return data;
    },
    enabled: isAuthenticated && !!projectId,
  });

  // Existing access request status
  const { data: myRequest } = useQuery({
    queryKey: ["myRequest", projectId],
    queryFn: async () => {
      const { data } = await accessRequestsAPI.checkMyRequest(projectId);
      return data;
    },
    enabled: isAuthenticated && !!projectId,
  });

  // Activity feed
  const { data: activitiesData } = useQuery({
    queryKey: ["activities", projectId],
    queryFn: async () => {
      const { data } = await activitiesAPI.getProjectActivities(projectId, { limit: 10 });
      return data;
    },
    enabled: !!projectId,
  });

  // Repo access request status
  const { data: repoReqData } = useQuery({
    queryKey: ["repoReq", projectId],
    queryFn: async () => { const { data } = await repoRequestsAPI.check(projectId); return data; },
    enabled: isAuthenticated && !!projectId,
  });

  // Submit repo access request
  const repoRequestMutation = useMutation({
    mutationFn: () => repoRequestsAPI.create({
      projectId,
      requestedRole: repoForm.requestedRole,
      githubProfile: repoForm.githubProfile,
      experienceDescription: repoForm.experienceDescription,
      availabilityHours: parseInt(repoForm.availabilityHours),
      portfolioUrl: repoForm.portfolioUrl || undefined,
      additionalMessage: repoForm.additionalMessage || undefined,
    }),
    onSuccess: () => {
      setShowRepoModal(false);
      setRepoForm({ requestedRole:"", githubProfile:"", experienceDescription:"", availabilityHours:"", portfolioUrl:"", additionalMessage:"" });
      queryClient.invalidateQueries({ queryKey: ["repoReq", projectId] });
    },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to submit request"),
  });

  // Submit access request
  const requestMutation = useMutation({
    mutationFn: (d: { projectId: string; reason: string; suggestion: string }) =>
      accessRequestsAPI.create(d),
    onSuccess: () => {
      setShowRequestModal(false);
      setReason(""); setSuggestion("");
      queryClient.invalidateQueries({ queryKey: ["myRequest", projectId] });
      queryClient.invalidateQueries({ queryKey: ["membership", projectId] });
    },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to submit request"),
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => projectMembersAPI.removeMember(projectId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["myProjects"] });
      setConfirmRemove(null);
    },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to remove member"),
  });

  const isOwner = !!(user && project && project.ownerId === user.id);
  const isMember = !!membership?.isMember;
  const existingRequest = myRequest?.request;
  const hasPending = existingRequest?.status === "PENDING";
  const wasRejected = existingRequest?.status === "REJECTED";
  // Can request: logged in, not owner, not already a member, no pending request
  const canRequest = isAuthenticated && !isOwner && !isMember && !hasPending;


  // ── Loading / error states ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 gap-3">
        <Lock className="h-12 w-12 text-gray-700" />
        <p className="text-white font-medium">
          {(error as any)?.response?.status === 403
            ? "This project is private"
            : "Project not found"}
        </p>
        <Link href="/" className="text-sm text-indigo-400 hover:text-indigo-300">← Go home</Link>
      </div>
    );
  }

  // Determine whether to show the GitHub URL
  const showGithubUrl = project.githubRepoUrl && !project._repoHidden;
  const repoIsHidden = project.githubRepoUrl && project._repoHidden;


  return (
    <div className="min-h-screen bg-gray-950 p-6">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-5 transition">
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      {/* ── Cover Image ──────────────────────────────────────────────────────── */}
      <div className="relative w-full h-56 bg-gray-800 rounded-2xl overflow-hidden mb-5">
        {project.coverImage ? (
          <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderGit2 className="h-16 w-16 text-gray-700" />
          </div>
        )}
        {/* Category */}
        {project.category && (
          <span className="absolute top-4 left-4 bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
            {project.category}
          </span>
        )}
        {/* Visibility */}
        <div className="absolute top-4 right-4">
          <VisibilityBadge visibility={project.visibility ?? "PUBLIC"} />
        </div>
        {/* Role badges */}
        <div className="absolute bottom-4 right-4 flex gap-2">
          {isOwner && (
            <span className="bg-purple-600/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <Shield className="h-3 w-3" /> Owner
            </span>
          )}
          {isMember && !isOwner && (
            <span className="bg-green-600/90 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Member
            </span>
          )}
        </div>
      </div>

      {/* ── Project Header ───────────────────────────────────────────────────── */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-2">{project.title}</h1>
            <p className="text-gray-400 leading-relaxed">{project.description}</p>
          </div>

          {/* Action button */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {isOwner ? (
              <Link
                href={`/projects/${project.id}/edit`}
                className="flex items-center gap-2 text-sm font-medium text-indigo-400 border border-indigo-700 px-4 py-2.5 rounded-xl hover:bg-indigo-900/30 transition"
              >
                <Pencil className="h-4 w-4" /> Edit Project
              </Link>
            ) : isMember ? (
              <span className="flex items-center gap-2 text-sm font-medium text-green-400 border border-green-800 px-4 py-2.5 rounded-xl bg-green-900/20">
                <CheckCircle className="h-4 w-4" /> You're a Member
              </span>
            ) : existingRequest ? (
              <RequestStatusBadge status={existingRequest.status} />
            ) : isAuthenticated ? (
              <button
                onClick={() => setShowRequestModal(true)}
                className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition"
              >
                <GitPullRequest className="h-4 w-4" /> Request Access
              </button>
            ) : null}
          </div>
        </div>

        {/* Tags / Tech Stack */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {project.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-xs text-indigo-300 bg-indigo-900/40 px-3 py-1 rounded-full">
                <GitBranch className="h-3 w-3" /> {tag}
              </span>
            ))}
          </div>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-5">
          <div className="flex items-center gap-1.5">
            {project.owner?.avatarUrl
              ? <img src={project.owner.avatarUrl} alt="" className="h-5 w-5 rounded-full" />
              : <div className="h-5 w-5 rounded-full bg-indigo-700" />}
            <span>by <span className="text-gray-300 font-medium">{project.owner?.username}</span></span>
          </div>
          <div className="flex items-center gap-1"><Users className="h-4 w-4" />{project._count?.members ?? 0} members</div>
          <div className="flex items-center gap-1"><GitPullRequest className="h-4 w-4" />{project._count?.accessRequests ?? 0} proposals</div>
          <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</div>
        </div>

        {/* Links row */}
        <div className="flex flex-wrap gap-3 pt-5 border-t border-gray-800">
          <a href={project.deployedUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-gray-300 border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-800 transition">
            <ExternalLink className="h-4 w-4" /> Visit Live Site
          </a>

          {showGithubUrl && (
            <a href={project.githubRepoUrl!} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-300 border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-800 transition">
              <FolderGit2 className="h-4 w-4" /> View Repository
            </a>
          )}

          {/* Repo is private — show request button for non-members */}
          {repoIsHidden && !isOwner && !isMember && isAuthenticated && (
            <>
              {repoReqData?.hasRequest ? (
                <span className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl ${
                  repoReqData.request?.status === "APPROVED" ? "text-green-400 bg-green-900/20 border border-green-800"
                  : repoReqData.request?.status === "REJECTED" ? "text-red-400 bg-red-900/20 border border-red-800"
                  : "text-yellow-400 bg-yellow-900/20 border border-yellow-800"
                }`}>
                  <Clock className="h-4 w-4" />
                  {repoReqData.request?.status === "APPROVED" ? "Repo Access Granted"
                   : repoReqData.request?.status === "REJECTED" ? "Repo Access Rejected"
                   : "Repo Request Pending"}
                </span>
              ) : (
                <button onClick={() => setShowRepoModal(true)}
                  className="flex items-center gap-2 text-sm font-medium text-white bg-purple-600 px-4 py-2 rounded-xl hover:bg-purple-700 transition">
                  <KeyRound className="h-4 w-4" /> Request Repository Access
                </button>
              )}
            </>
          )}

          {repoIsHidden && (isOwner || isMember) && project.githubRepoUrl && (
            <a href={project.githubRepoUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-300 border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-800 transition">
              <FolderGit2 className="h-4 w-4" /> View Repository
            </a>
          )}
        </div>
      </div>


      {/* ── Bottom grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT: Members + Open Roles */}
        <div className="lg:col-span-2 space-y-5">

          {/* Open Roles */}
          {project.openRoles && project.openRoles.length > 0 && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-yellow-400" /> Open Roles
              </h2>
              <div className="flex flex-wrap gap-2">
                {project.openRoles.map((role, i) => (
                  <span key={i}
                    className="text-sm text-yellow-300 bg-yellow-900/30 border border-yellow-800/50 px-3 py-1.5 rounded-xl font-medium">
                    {role}
                  </span>
                ))}
              </div>
              {canRequest && (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="mt-4 flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition"
                >
                  <GitPullRequest className="h-4 w-4" /> Apply for a Role
                </button>
              )}
            </div>
          )}

          {/* Team Members */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400" />
              Team Members <span className="text-gray-500 font-normal text-sm">({project.members?.length ?? 0})</span>
            </h2>
            <div className="space-y-2">
              {project.members && project.members.length > 0 ? (
                project.members.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      {member.user.avatarUrl
                        ? <img src={member.user.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
                        : <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-sm font-bold text-white">
                            {member.user.username.charAt(0).toUpperCase()}
                          </div>
                      }
                      <div>
                        <p className="text-sm font-medium text-white">{member.user.username}</p>
                        {member.user.githubUsername && (
                          <a href={member.user.githubProfileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-gray-500 hover:text-indigo-400 transition">
                            @{member.user.githubUsername}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        member.role === "OWNER"
                          ? "bg-purple-900/50 text-purple-400"
                          : "bg-blue-900/50 text-blue-400"
                      }`}>{member.role}</span>
                      {/* Remove button — owner only, not self */}
                      {isOwner && member.userId !== user?.id && (
                        <button
                          onClick={() => setConfirmRemove({ userId: member.userId, username: member.user.username })}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-800 px-2 py-1 rounded-lg transition"
                          title="Remove contributor"
                        >
                          <UserMinus className="h-3 w-3" />Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-2">No members yet</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Project Info + Activity */}
        <div className="space-y-5">

          {/* Project Info card */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" /> Project Info
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Visibility</span>
                <VisibilityBadge visibility={project.visibility ?? "PUBLIC"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Repository</span>
                {project.githubRepoUrl ? (
                  project.isRepoPrivate ? (
                    <span className="flex items-center gap-1 text-xs text-red-400 bg-red-900/30 px-2.5 py-1 rounded-full">
                      <Lock className="h-3 w-3" /> Private
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full">
                      <Globe className="h-3 w-3" /> Public
                    </span>
                  )
                ) : (
                  <span className="text-xs text-gray-600">Not linked</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Members</span>
                <span className="text-white font-medium">{project._count?.members ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Proposals</span>
                <span className="text-white font-medium">{project._count?.accessRequests ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Category</span>
                <span className="text-white font-medium">{project.category ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-white text-xs">{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <ActivityIcon className="h-4 w-4 text-green-400" /> Recent Activity
            </h2>
            <div className="space-y-3">
              {activitiesData?.activities && activitiesData.activities.length > 0
                ? activitiesData.activities.map(act => (
                    <div key={act.id} className="border-l-2 border-gray-800 pl-3">
                      <p className="text-sm text-gray-300 leading-snug">{act.description}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                : <p className="text-sm text-gray-500">No activity yet</p>
              }
            </div>
          </div>
        </div>
      </div>


      {/* ── Like / Save row ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mt-5 p-4 bg-gray-900 rounded-2xl border border-gray-800">
        <LikeButton projectId={projectId} size="md" />
        <div className="flex items-center gap-2 ml-auto">
          <SaveButton projectId={projectId} size="md" />
          <span className="text-sm text-gray-500">Save project</span>
        </div>
      </div>

      {/* ── Comments ─────────────────────────────────────────────────────────── */}
      <div className="mt-5">
        <CommentSection projectId={projectId} />
      </div>
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700 overflow-hidden">
            {/* Modal header */}
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Request Access</h2>
              <p className="text-sm text-gray-400 mt-1">
                Applying to join <span className="text-white font-medium">{project.title}</span>
              </p>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                requestMutation.mutate({ projectId, reason, suggestion });
              }}
              className="p-6 space-y-4"
            >
              {/* Open roles hint */}
              {project.openRoles && project.openRoles.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-800/40 rounded-xl p-3">
                  <p className="text-xs text-yellow-400 font-medium mb-1.5">Open Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.openRoles.map((r, i) => (
                      <span key={i} className="text-xs text-yellow-300 bg-yellow-900/40 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Why do you want to join? <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="I'm experienced with React and passionate about this project because..."
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none placeholder-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  How can you contribute? <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  value={suggestion}
                  onChange={e => setSuggestion(e.target.value)}
                  rows={3}
                  placeholder="I can help with frontend development, API design, testing..."
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none placeholder-gray-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={requestMutation.isPending || !reason.trim() || !suggestion.trim()}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {requestMutation.isPending ? "Submitting…" : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRequestModal(false); setReason(""); setSuggestion(""); }}
                  className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Repo Access Request Modal ────────────────────────────────────────── */}
      {showRepoModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700 my-4">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-purple-400" /> Request Repository Access
              </h2>
              <p className="text-sm text-gray-500 mt-1">Tell the owner why you need access to the repository for <span className="text-white">{project.title}</span></p>
            </div>
            <form onSubmit={e => { e.preventDefault(); repoRequestMutation.mutate(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Requested Role *</label>
                <input type="text" required value={repoForm.requestedRole}
                  onChange={e => setRepoForm(f => ({ ...f, requestedRole: e.target.value }))}
                  placeholder="e.g. Frontend Developer, Full Stack Engineer"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">GitHub Profile URL *</label>
                <input type="url" required value={repoForm.githubProfile}
                  onChange={e => setRepoForm(f => ({ ...f, githubProfile: e.target.value }))}
                  placeholder="https://github.com/yourusername"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Experience Description *</label>
                <textarea required value={repoForm.experienceDescription}
                  onChange={e => setRepoForm(f => ({ ...f, experienceDescription: e.target.value }))}
                  rows={3} placeholder="Describe your relevant experience and skills..."
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-purple-500 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Availability (hrs/week) *</label>
                  <input type="number" required min="1" max="80" value={repoForm.availabilityHours}
                    onChange={e => setRepoForm(f => ({ ...f, availabilityHours: e.target.value }))}
                    placeholder="20" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Portfolio URL</label>
                  <input type="url" value={repoForm.portfolioUrl}
                    onChange={e => setRepoForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                    placeholder="https://yourportfolio.com"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-purple-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Additional Message</label>
                <textarea value={repoForm.additionalMessage}
                  onChange={e => setRepoForm(f => ({ ...f, additionalMessage: e.target.value }))}
                  rows={2} placeholder="Anything else you'd like the owner to know..."
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-purple-500 focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={repoRequestMutation.isPending}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition">
                  {repoRequestMutation.isPending ? "Submitting…" : "Submit Request"}
                </button>
                <button type="button" onClick={() => setShowRepoModal(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Remove Member Modal ──────────────────────────────────────── */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-red-900/50 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <UserMinus className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Remove Contributor?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              <span className="text-white font-medium">{confirmRemove.username}</span> will lose access to this project and it will disappear from their Contributing tab.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => removeMemberMutation.mutate(confirmRemove.userId)}
                disabled={removeMemberMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                {removeMemberMutation.isPending ? "Removing…" : "Remove"}
              </button>
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
