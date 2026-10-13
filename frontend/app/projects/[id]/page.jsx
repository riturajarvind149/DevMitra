"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI, projectMembersAPI, accessRequestsAPI, repoRequestsAPI, announcementsAPI, bugReportsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  ExternalLink, Users, Calendar, ArrowLeft, FolderGit2, GitPullRequest,
  CheckCircle, Lock, Globe, EyeOff, Briefcase, Shield, GitBranch, Clock,
  XCircle, Pencil, KeyRound, UserMinus, AlertTriangle, Megaphone, Plus,
  Trash2, CheckSquare, RotateCcw, Send, UserPlus, X, MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import SaveButton from "@/components/SaveButton";
import CommentSection from "@/components/CommentSection";
import BugCommentThread from "@/components/BugCommentThread";

function VisibilityBadge({ visibility }) {
  if (visibility === "PRIVATE")
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-red-900/40 text-red-400"><Lock className="h-3 w-3" /> Private</span>;
  if (visibility === "UNLISTED")
    return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-900/40 text-yellow-400"><EyeOff className="h-3 w-3" /> Unlisted</span>;
  return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-900/40 text-green-400"><Globe className="h-3 w-3" /> Public</span>;
}

function RequestStatusBadge({ status }) {
  if (status === "PENDING") return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-yellow-900/40 text-yellow-400"><Clock className="h-3.5 w-3.5" /> Request Pending</span>;
  if (status === "APPROVED") return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-green-900/40 text-green-400"><CheckCircle className="h-3.5 w-3.5" /> Request Approved</span>;
  if (status === "REJECTED") return <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-red-900/40 text-red-400"><XCircle className="h-3.5 w-3.5" /> Request Rejected</span>;
  return null;
}

const BUG_TYPES = ["BUG", "UI_ISSUE", "PERFORMANCE", "SECURITY", "FEATURE_REQUEST"];
const BUG_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const SEV_COLOR = { CRITICAL: "bg-red-900/50 text-red-400", HIGH: "bg-orange-900/50 text-orange-400", MEDIUM: "bg-yellow-900/50 text-yellow-400", LOW: "bg-blue-900/50 text-blue-400" };
const STATUS_COLOR = { RESOLVED: "bg-green-900/40 text-green-400", IN_PROGRESS: "bg-yellow-900/40 text-yellow-400", WONT_FIX: "bg-gray-700 text-gray-500", OPEN: "bg-amber-500/10 text-amber-500 border border-amber-500/30" };

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id;
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reason, setReason] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [repoForm, setRepoForm] = useState({ requestedRole: "", githubProfile: "", experienceDescription: "", availabilityHours: "", portfolioUrl: "", additionalMessage: "" });
  const [showAnnForm, setShowAnnForm] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annAudience, setAnnAudience] = useState("ALL");
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmDeleteAnn, setConfirmDeleteAnn] = useState(null);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [showBugModal, setShowBugModal] = useState(false);
  const [bugForm, setBugForm] = useState({ title: "", description: "", type: "BUG", severity: "MEDIUM" });
  const [showBugList, setShowBugList] = useState(false);
  const [confirmAddContributor, setConfirmAddContributor] = useState(null);
  // Bug detail chat modal
  const [activeBug, setActiveBug] = useState(null);
  const [confirmResolveBug, setConfirmResolveBug] = useState(null);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => { const { data } = await projectsAPI.getById(projectId); return data; },
    enabled: !!projectId,
  });
  const { data: membership } = useQuery({
    queryKey: ["membership", projectId],
    queryFn: async () => { const { data } = await projectMembersAPI.checkMembership(projectId); return data; },
    enabled: isAuthenticated && !!projectId,
  });
  const { data: myRequest } = useQuery({
    queryKey: ["myRequest", projectId],
    queryFn: async () => { const { data } = await accessRequestsAPI.checkMyRequest(projectId); return data; },
    enabled: isAuthenticated && !!projectId,
  });
  const { data: repoReqData } = useQuery({
    queryKey: ["repoReq", projectId],
    queryFn: async () => { const { data } = await repoRequestsAPI.check(projectId); return data; },
    enabled: isAuthenticated && !!projectId,
  });
  const { data: announcements = [] } = useQuery({
    queryKey: ["announcements", projectId],
    queryFn: async () => { const { data } = await announcementsAPI.get(projectId); return data; },
    enabled: !!projectId,
  });
  const { data: bugReports = [] } = useQuery({
    queryKey: ["projectBugs", projectId],
    queryFn: async () => { const { data } = await bugReportsAPI.getForProject(projectId); return data.bugReports ?? []; },
    enabled: !!projectId,
  });

  // Mutations
  const repoRequestMut = useMutation({
    mutationFn: () => repoRequestsAPI.create({ projectId, requestedRole: repoForm.requestedRole, githubProfile: repoForm.githubProfile, experienceDescription: repoForm.experienceDescription, availabilityHours: parseInt(repoForm.availabilityHours), portfolioUrl: repoForm.portfolioUrl || undefined, additionalMessage: repoForm.additionalMessage || undefined }),
    onSuccess: () => { setShowRepoModal(false); setRepoForm({ requestedRole: "", githubProfile: "", experienceDescription: "", availabilityHours: "", portfolioUrl: "", additionalMessage: "" }); queryClient.invalidateQueries({ queryKey: ["repoReq", projectId] }); },
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });
  const requestMut = useMutation({
    mutationFn: (d) => accessRequestsAPI.create(d),
    onSuccess: () => { setShowRequestModal(false); setReason(""); setSuggestion(""); queryClient.invalidateQueries({ queryKey: ["myRequest", projectId] }); queryClient.invalidateQueries({ queryKey: ["membership", projectId] }); },
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });
  const removeMemberMut = useMutation({
    mutationFn: (userId) => projectMembersAPI.removeMember(projectId, userId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project", projectId] }); setConfirmRemove(null); },
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });
  const annCreateMut = useMutation({
    mutationFn: () => announcementsAPI.create(projectId, { title: annTitle, content: annContent, audience: annAudience }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["announcements", projectId] }); setShowAnnForm(false); setAnnTitle(""); setAnnContent(""); setAnnAudience("ALL"); },
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });
  const annDeleteMut = useMutation({
    mutationFn: (id) => announcementsAPI.delete(projectId, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["announcements", projectId] }),
  });
  const completeMut = useMutation({
    mutationFn: () => announcementsAPI.markComplete(projectId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project", projectId] }); setConfirmComplete(false); },
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });
  const reopenMut = useMutation({
    mutationFn: () => announcementsAPI.reopen(projectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["project", projectId] }),
  });
  const bugCreateMut = useMutation({
    mutationFn: () => bugReportsAPI.create({ projectId, ...bugForm }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["projectBugs", projectId] }); setShowBugModal(false); setBugForm({ title: "", description: "", type: "BUG", severity: "MEDIUM" }); },
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });
  const bugUpdateMut = useMutation({
    mutationFn: ({ id, status }) => bugReportsAPI.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projectBugs", projectId] }),
  });
  // Add reporter as contributor via access request approval simulation — we add directly
  const addContributorMut = useMutation({
    mutationFn: async ({ userId }) => {
      // Use the existing access request flow but grant membership directly
      return fetch(`/api/projects/${projectId}/members/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["project", projectId] }); setConfirmAddContributor(null); },
  });

  const isOwner = !!(user && project && project.ownerId === user.id);
  const isMember = !!membership?.isMember;
  const existingRequest = myRequest?.request;
  const hasPending = existingRequest?.status === "PENDING";
  const canRequest = isAuthenticated && !isOwner && !isMember && !hasPending;
  const showGithubUrl = project?.githubRepoUrl && !project?._repoHidden;
  const repoIsHidden = project?.githubRepoUrl && project?._repoHidden;
  const openBugs = bugReports.filter((b) => b.status === "OPEN").length;

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !project) return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 font-mono"><Lock className="h-10 w-10 text-muted" /><p className="text-sm font-bold text-primary">{(error)?.response?.status === 403 ? "This project is private" : "Project not found"}</p><Link href="/" className="text-xs text-amber-500 hover:underline">← Go home</Link></div>;

  return (
    <div className="space-y-6 font-sans">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-mono text-muted hover:text-primary mb-4 transition"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link>

      {project.isCompleted && (
        <div className="mb-4 flex items-center justify-between bg-green-900/30 border border-green-700/50 rounded-2xl px-5 py-3">
          <div className="flex items-center gap-2"><CheckSquare className="h-5 w-5 text-green-400" /><div><p className="text-sm font-semibold text-green-300">Project Completed</p><p className="text-xs text-green-600">Hidden from public explore.</p></div></div>
          {isOwner && <button onClick={() => setConfirmReopen(true)} disabled={reopenMut.isPending} className="flex items-center gap-1.5 text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-xl hover:bg-gray-800 transition"><RotateCcw className="h-3.5 w-3.5" /> Reopen</button>}
        </div>
      )}

      {/* Cover */}
      <div className="relative w-full h-56 surface-input border border-subtle rounded-sm overflow-hidden mb-5">
        {project.coverImage
          ? project.coverImage.startsWith("data:video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(project.coverImage)
            ? <video src={project.coverImage} className="w-full h-full object-cover" muted autoPlay loop playsInline />
            : <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><FolderGit2 className="h-16 w-16 text-muted" /></div>}
        {project.category && <span className="absolute top-4 left-4 bg-amber-500 text-gray-950 font-mono font-bold text-xs px-2.5 py-0.5 rounded-sm">{project.category}</span>}
        <div className="absolute top-4 right-4"><VisibilityBadge visibility={project.visibility ?? "PUBLIC"} /></div>
        <div className="absolute bottom-4 right-4 flex gap-2">
          {isOwner && <span className="bg-amber-500 text-gray-950 font-mono font-bold text-xs px-2.5 py-0.5 rounded-sm flex items-center gap-1"><Shield className="h-3 w-3" /> Owner</span>}
          {isMember && !isOwner && <span className="surface-raised border border-emerald-500/40 text-emerald-500 font-mono font-bold text-xs px-2.5 py-0.5 rounded-sm flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Member</span>}
        </div>
      </div>

      {/* Project Header */}
      <div className="surface-card rounded-sm border border-subtle p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold font-mono text-primary mb-2">{project.title}</h1>
            <p className="text-muted leading-relaxed font-sans">{project.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {isOwner ? (
              <div className="flex flex-col gap-2 items-end">
                <Link href={`/projects/${project.id}/edit`} className="flex items-center gap-2 text-xs font-mono font-bold text-amber-500 border border-subtle surface-raised px-3.5 py-2 rounded-sm hover:text-amber-400 transition"><Pencil className="h-3.5 w-3.5" /> Edit Project</Link>
                {!project.isCompleted && <button onClick={() => setConfirmComplete(true)} className="flex items-center gap-2 text-xs font-mono text-emerald-500 border border-emerald-800/40 surface-raised px-3 py-1.5 rounded-sm hover:text-emerald-400 transition"><CheckSquare className="h-3.5 w-3.5" /> Mark Complete</button>}
              </div>
            ) : isMember ? (
              <span className="flex items-center gap-2 text-xs font-mono font-medium text-emerald-500 border border-emerald-800/40 px-3.5 py-2 rounded-sm surface-raised"><CheckCircle className="h-3.5 w-3.5" /> You're a Member</span>
            ) : existingRequest ? <RequestStatusBadge status={existingRequest.status} />
            : isAuthenticated ? <button onClick={() => setShowRequestModal(true)} className="flex items-center gap-2 text-xs font-mono font-bold text-gray-950 bg-amber-500 px-4 py-2 rounded-sm hover:bg-amber-400 transition"><GitPullRequest className="h-3.5 w-3.5" /> Request Access</button>
            : null}
          </div>
        </div>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">{project.tags.map((tag, i) => <span key={i} className="inline-flex items-center gap-1 text-[11px] font-mono text-amber-500 surface-raised border border-subtle px-2 py-0.5 rounded-[2px]"><GitBranch className="h-3 w-3" /> {tag}</span>)}</div>
        )}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted mb-5">
          <div className="flex items-center gap-1.5">{project.owner?.avatarUrl ? <img src={project.owner.avatarUrl} alt="" className="h-5 w-5 rounded-sm object-cover border border-subtle" /> : <div className="h-5 w-5 rounded-sm surface-raised border border-subtle text-amber-500 flex items-center justify-center font-bold text-[10px]">{project.owner?.username?.charAt(0).toUpperCase()}</div>}<span>by <span className="text-primary font-medium">{project.owner?.username}</span></span></div>
          <div className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{project._count?.members ?? 0} members</div>
          <div className="flex items-center gap-1"><GitPullRequest className="h-3.5 w-3.5" />{project._count?.accessRequests ?? 0} proposals</div>
          <div className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</div>
          {project.isPaid && <span className="flex items-center gap-1 text-emerald-500 text-xs font-semibold surface-raised border border-emerald-500/30 px-2 py-0.5 rounded-sm">💰 Paid contributions</span>}
        </div>
        <div className="flex flex-wrap gap-2 pt-4 border-t border-subtle">
          <a href={project.deployedUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-mono text-secondary border border-subtle surface-raised px-3 py-1.5 rounded-sm hover:text-primary transition"><ExternalLink className="h-3.5 w-3.5" /> Visit Live Site</a>
          {showGithubUrl && <a href={project.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-mono text-secondary border border-subtle surface-raised px-3 py-1.5 rounded-sm hover:text-primary transition"><FolderGit2 className="h-3.5 w-3.5" /> View Repository</a>}
          {repoIsHidden && !isOwner && !isMember && isAuthenticated && (repoReqData?.hasRequest
            ? <span className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-sm ${repoReqData.request?.status === "APPROVED" ? "text-emerald-500 surface-raised border border-emerald-500/30" : repoReqData.request?.status === "REJECTED" ? "text-red-400 surface-raised border border-red-500/30" : "text-amber-400 surface-raised border border-amber-500/30"}`}><Clock className="h-3.5 w-3.5" />{repoReqData.request?.status === "APPROVED" ? "Repo Access Granted" : repoReqData.request?.status === "REJECTED" ? "Repo Access Rejected" : "Repo Request Pending"}</span>
            : <button onClick={() => setShowRepoModal(true)} className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-950 bg-amber-500 px-3.5 py-1.5 rounded-sm hover:bg-amber-400 transition"><KeyRound className="h-3.5 w-3.5" /> Request Repository Access</button>)}
          {repoIsHidden && (isOwner || isMember) && project.githubRepoUrl && <a href={project.githubRepoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-mono text-secondary border border-subtle surface-raised px-3 py-1.5 rounded-sm hover:text-primary transition"><FolderGit2 className="h-3.5 w-3.5" /> View Repository</a>}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT col — Open Roles + Members + Like/Save + Comments */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {project.openRoles && project.openRoles.length > 0 && (
            <div className="surface-card rounded-sm border border-subtle p-5">
              <h2 className="text-sm font-mono font-bold text-primary mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-amber-500" /> Open Roles</h2>
              <div className="flex flex-wrap gap-2">{project.openRoles.map((role, i) => <span key={i} className="text-xs font-mono text-amber-500 surface-raised border border-amber-500/30 px-2.5 py-1 rounded-sm font-medium">{role}</span>)}</div>
              {canRequest && <button onClick={() => setShowRequestModal(true)} className="mt-4 flex items-center gap-2 text-xs font-mono font-bold text-gray-950 bg-amber-500 px-4 py-2 rounded-sm hover:bg-amber-400 transition"><GitPullRequest className="h-3.5 w-3.5" /> Apply for a Role</button>}
            </div>
          )}

          {/* Team Members */}
          <div className="surface-card rounded-sm border border-subtle p-5">
            <h2 className="text-sm font-mono font-bold text-primary mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-amber-500" /> Team Members <span className="text-muted font-normal text-xs font-mono">({project.members?.length ?? 0})</span></h2>
            <div className="space-y-2">
              {project.members && project.members.length > 0 ? project.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2.5 surface-raised border border-subtle rounded-sm">
                  <div className="flex items-center gap-2.5">
                    {member.user.avatarUrl ? <img src={member.user.avatarUrl} alt="" className="w-8 h-8 rounded-sm object-cover border border-subtle" /> : <div className="w-8 h-8 rounded-sm surface-card border border-subtle flex items-center justify-center text-xs font-mono font-bold text-amber-500">{member.user.username.charAt(0).toUpperCase()}</div>}
                    <div>
                      <p className="text-xs font-mono font-semibold text-primary">{member.user.username}</p>
                      {member.user.githubUsername && <a href={member.user.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-mono text-muted hover:text-amber-500 transition">@{member.user.githubUsername}</a>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px] ${member.role === "OWNER" ? "surface-card border border-amber-500/40 text-amber-500" : "surface-card border border-subtle text-muted"}`}>{member.role}</span>
                    {isOwner && member.userId !== user?.id && (
                      <button onClick={() => setConfirmRemove({ userId: member.userId, username: member.user.username })} className="flex items-center gap-1 text-[11px] font-mono text-muted hover:text-red-400 border border-subtle hover:border-red-500 px-2 py-0.5 rounded-sm transition"><UserMinus className="h-3 w-3" /> Remove</button>
                    )}
                  </div>
                </div>
              )) : <p className="text-xs text-muted font-mono py-2">No members yet</p>}
            </div>
          </div>

          {/* Like / Save */}
          <div className="flex items-center gap-4 p-4 surface-card rounded-sm border border-subtle">
            <LikeButton projectId={projectId} size="md" />
            <div className="flex items-center gap-2 ml-auto">
              <SaveButton projectId={projectId} size="md" />
              <span className="text-xs font-mono text-muted">Save project</span>
            </div>
          </div>

          {/* Comments */}
          <CommentSection projectId={projectId} />
        </div>

        {/* RIGHT col — Announcements + Bug Reports, fixed height 280px each, sticky */}
        <div className="flex flex-col gap-5 lg:sticky lg:top-6 self-start">

          {/* ── Announcements — fixed 280px ── */}
          <div className="surface-card rounded-sm border border-subtle flex flex-col" style={{ height: 280 }}>
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 flex-shrink-0 border-b border-subtle">
              <h2 className="text-xs font-mono font-bold text-primary flex items-center gap-2"><Megaphone className="h-3.5 w-3.5 text-amber-500" /> Announcements</h2>
              {isOwner && <button onClick={() => setShowAnnForm(v => !v)} className="flex items-center gap-1 text-xs font-mono text-amber-500 border border-subtle surface-raised px-2 py-0.5 rounded-sm hover:text-amber-400 transition"><Plus className="h-3 w-3" /> Post</button>}
            </div>
            {isOwner && showAnnForm && (
              <div className="mx-3 mt-2 p-3 surface-raised rounded-sm border border-subtle space-y-2 flex-shrink-0">
                <input type="text" aria-label="Announcement title" value={annTitle} onChange={e => setAnnTitle(e.target.value)} placeholder="Title…" className="w-full surface-input border border-subtle text-primary text-xs px-2.5 py-1.5 rounded-sm focus:border-amber-500 focus:outline-none font-mono" />
                <textarea aria-label="Announcement content" rows={2} value={annContent} onChange={e => setAnnContent(e.target.value)} placeholder="Update…" className="w-full surface-input border border-subtle text-primary text-xs px-2.5 py-1.5 rounded-sm focus:border-amber-500 focus:outline-none resize-none font-sans" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["ALL", "CONTRIBUTORS"]).map(a => (
                    <button key={a} type="button" onClick={() => setAnnAudience(a)} className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-medium transition ${annAudience === a ? "bg-amber-500 text-gray-950 font-bold" : "surface-input border border-subtle text-muted hover:text-primary"}`}>{a === "ALL" ? "👥 All" : "🔧 Contributors"}</button>
                  ))}
                  <div className="flex gap-1.5 ml-auto">
                    <button onClick={() => annCreateMut.mutate()} disabled={annCreateMut.isPending || !annTitle.trim() || !annContent.trim()} className="text-[10px] font-mono font-bold bg-amber-500 text-gray-950 px-2.5 py-1 rounded-sm hover:bg-amber-400 disabled:opacity-50 transition flex items-center gap-1"><Send className="h-2.5 w-2.5" />{annCreateMut.isPending ? "…" : "Post"}</button>
                    <button onClick={() => setShowAnnForm(false)} className="text-[10px] text-muted px-1.5 py-1 rounded-sm hover:surface-input transition"><X className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0" style={{ scrollbarWidth: "thin" }}>
              {announcements.length > 0 ? announcements.map((ann) => (
                <div key={ann.id} className="p-2.5 surface-input rounded-sm border border-subtle">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                        <p className="text-xs font-semibold text-primary">{ann.title}</p>
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm flex-shrink-0 ${ann.audience === "CONTRIBUTORS" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "surface-raised text-muted border border-subtle"}`}>{ann.audience === "CONTRIBUTORS" ? "Contributors" : "Everyone"}</span>
                      </div>
                      <p className="text-[11px] text-secondary leading-snug">{ann.content}</p>
                      <p className="text-[10px] text-muted mt-0.5 font-mono">{formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}</p>
                    </div>
                    {isOwner && <button onClick={() => setConfirmDeleteAnn(ann.id)} className="text-muted hover:text-red-500 transition flex-shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>}
                  </div>
                </div>
              )) : <p className="text-xs text-gray-600 text-center py-4">No announcements yet</p>}
            </div>
          </div>

          {/* ── Bug Reports — fixed 280px ── */}
          <div className="surface-card rounded-sm border border-subtle flex flex-col shadow-sm" style={{ height: 280 }}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3 flex-shrink-0 border-b border-subtle">
              <h2 className="text-xs font-mono font-bold text-primary flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Bug Reports
                {openBugs > 0 && <span className="text-[10px] font-mono bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded-sm">{openBugs} open</span>}
              </h2>
              {!isOwner && isAuthenticated && (
                <button onClick={() => setShowBugModal(true)} className="flex items-center gap-1.5 text-xs font-mono text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-sm hover:bg-amber-500/10 transition"><Plus className="h-3.5 w-3.5" /> Report</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0" style={{ scrollbarWidth: "thin" }}>
              {bugReports.length > 0 ? bugReports.map((bug) => (
                <button key={bug.id}
                  onClick={() => setActiveBug(bug)}
                  className="w-full text-left p-2.5 surface-input rounded-sm border border-subtle hover:border-amber-500/30 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1 mb-0.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${SEV_COLOR[bug.severity] ?? "surface-raised text-muted border border-subtle"}`}>{bug.severity}</span>
                        <span className="text-[9px] font-mono text-muted">{bug.type.replace("_", " ")}</span>
                      </div>
                      <p className="text-xs font-semibold text-primary leading-snug">{bug.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {bug.reporter?.avatarUrl && <img src={bug.reporter.avatarUrl} alt="" className="w-3 h-3 rounded-full" />}
                        <span className="text-[10px] text-muted font-mono">{bug.reporter?.username}</span>
                        <span className="text-[10px] text-muted font-mono">· {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })}</span>
                        <MessageSquare className="h-2.5 w-2.5 text-muted ml-auto" />
                      </div>
                    </div>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm flex-shrink-0 ${STATUS_COLOR[bug.status] ?? "surface-raised text-muted border border-subtle"}`}>
                      {bug.status.replace("_", " ")}
                    </span>
                  </div>
                </button>
              )) : <p className="text-xs text-muted font-mono text-center py-4">No bug reports yet</p>}
            </div>
          </div>

        </div>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* ── Confirm Resolve Bug ──────────────────────────────────────────────────── */}
      {confirmResolveBug && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[55] p-4">
          <div className="surface-card rounded-sm p-5 border border-green-500/30 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-sm flex items-center justify-center flex-shrink-0 border border-green-500/20"><CheckCircle className="h-4 w-4 text-green-500" /></div>
              <h3 className="text-sm font-semibold text-primary">Mark as Resolved?</h3>
            </div>
            <p className="text-xs text-secondary mb-4 font-mono">This will close the bug report. The reporter will be able to reopen it if the issue persists.</p>
            <div className="flex gap-2.5">
              <button onClick={() => { bugUpdateMut.mutate({ id: confirmResolveBug, status: "RESOLVED" }); setConfirmResolveBug(null); setActiveBug(null); }}
                disabled={bugUpdateMut.isPending}
                className="flex-1 bg-green-600 text-white py-2 rounded-sm text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition">
                {bugUpdateMut.isPending ? "Resolving…" : "Mark Resolved"}
              </button>
              <button onClick={() => setConfirmResolveBug(null)} className="flex-1 surface-input border border-subtle text-secondary py-2 rounded-sm text-xs font-medium hover:text-primary transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bug Detail + Chat Modal ────────────────────────────────────────────── */}
      {activeBug && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm w-full max-w-lg border border-subtle flex flex-col max-h-[85vh] shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-800 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SEV_COLOR[activeBug.severity] ?? "bg-gray-800 text-gray-400"}`}>{activeBug.severity}</span>
                  <span className="text-[10px] text-gray-500">{activeBug.type.replace("_", " ")}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLOR[activeBug.status] ?? "bg-gray-800 text-gray-400"}`}>{activeBug.status.replace("_", " ")}</span>
                </div>
                <h2 className="text-base font-semibold text-white">{activeBug.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  {activeBug.reporter?.avatarUrl
                    ? <img src={activeBug.reporter.avatarUrl} alt="" className="w-4 h-4 rounded-sm object-cover" />
                    : <div className="w-4 h-4 rounded-sm bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center font-bold"><span className="text-[8px]">{activeBug.reporter?.username?.charAt(0)}</span></div>}
                  <Link href={`/users/${activeBug.reporter?.id}`} className="text-xs text-secondary hover:text-amber-500 transition font-mono" onClick={() => setActiveBug(null)}>
                    @{activeBug.reporter?.username}
                  </Link>
                  <span className="text-[10px] text-muted font-mono">· {formatDistanceToNow(new Date(activeBug.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
              <button onClick={() => setActiveBug(null)} className="text-muted hover:text-primary ml-3 flex-shrink-0"><X className="h-4 w-4" /></button>
            </div>

            {/* Description */}
            <div className="px-5 py-4 border-b border-subtle flex-shrink-0">
              <p className="text-sm text-secondary leading-relaxed whitespace-pre-wrap">{activeBug.description}</p>
            </div>

            {/* Owner actions */}
            {isOwner && (activeBug.status === "OPEN" || activeBug.status === "IN_PROGRESS") && (
              <div className="px-5 py-3 border-b border-subtle flex flex-wrap gap-2 flex-shrink-0">
                <button onClick={() => setConfirmResolveBug(activeBug.id)}
                  className="flex items-center gap-1.5 text-xs text-emerald-400 border border-emerald-500/40 px-3 py-1.5 rounded-sm hover:bg-emerald-500/10 transition font-mono">
                  <CheckCircle className="h-3.5 w-3.5" /> Resolve
                </button>
                {activeBug.status === "OPEN" && (
                  <button onClick={() => { bugUpdateMut.mutate({ id: activeBug.id, status: "IN_PROGRESS" }); setActiveBug((b) => ({ ...b, status: "IN_PROGRESS" })); }}
                    className="flex items-center gap-1.5 text-xs text-amber-500 border border-amber-500/40 px-3 py-1.5 rounded-sm hover:bg-amber-500/10 transition font-mono">
                    ⚡ In Progress
                  </button>
                )}
                {activeBug.status === "IN_PROGRESS" && (
                  <button onClick={() => { bugUpdateMut.mutate({ id: activeBug.id, status: "WONT_FIX" }); setActiveBug((b) => ({ ...b, status: "WONT_FIX" })); }}
                    className="flex items-center gap-1.5 text-xs text-secondary border border-subtle px-3 py-1.5 rounded-sm hover:surface-raised transition font-mono">
                    ✕ Won't Fix
                  </button>
                )}
                {activeBug.reporter && !project.members?.some((m) => m.userId === activeBug.reporter.id) && (
                  <button onClick={() => { setConfirmAddContributor({ userId: activeBug.reporter.id, username: activeBug.reporter.username }); setActiveBug(null); }}
                    className="flex items-center gap-1.5 text-xs text-amber-500 border border-amber-500/40 px-3 py-1.5 rounded-sm hover:bg-amber-500/10 transition font-mono">
                    <UserPlus className="h-3.5 w-3.5" /> Add as Contributor
                  </button>
                )}
              </div>
            )}

            {/* Chat thread — in-modal, private between reporter and owner */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="px-5 py-2.5 border-b border-subtle flex-shrink-0 flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-xs text-muted">Private thread — visible only to <span className="text-primary font-medium">@{activeBug.reporter?.username}</span> and the project owner</p>
              </div>
              {/* Comment list */}
              <BugCommentThread bugId={activeBug.id} projectOwnerId={project.ownerId} reporterId={activeBug.reporter?.id} />
            </div>
          </div>
        </div>
      )}

      {confirmComplete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-5 border border-green-500/30 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 bg-green-500/10 border border-green-500/20 rounded-sm flex items-center justify-center flex-shrink-0"><CheckSquare className="h-4 w-4 text-green-500" /></div><h3 className="text-sm font-semibold text-primary">Mark Project Complete?</h3></div>
            <p className="text-xs text-secondary mb-4 font-mono">This will hide <span className="text-primary font-medium">{project.title}</span> from public explore and notify all members.</p>
            <div className="flex gap-2.5">
              <button onClick={() => completeMut.mutate()} disabled={completeMut.isPending} className="flex-1 bg-green-600 text-white py-2 rounded-sm text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition">{completeMut.isPending ? "…" : "Mark Complete"}</button>
              <button onClick={() => setConfirmComplete(false)} className="flex-1 surface-input border border-subtle text-secondary py-2 rounded-sm text-xs font-medium hover:text-primary transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showBugModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm max-w-md w-full border border-subtle shadow-xl">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Report a Bug</h2>
              <button onClick={() => setShowBugModal(false)} className="text-muted hover:text-primary"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); bugCreateMut.mutate(); }} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-mono text-secondary mb-1">Type</label><select value={bugForm.type} onChange={e => setBugForm(f => ({ ...f, type: e.target.value }))} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none">{BUG_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}</select></div>
                <div><label className="block text-xs font-mono text-secondary mb-1">Severity</label><select value={bugForm.severity} onChange={e => setBugForm(f => ({ ...f, severity: e.target.value }))} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none">{BUG_SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="block text-xs font-mono text-secondary mb-1">Title *</label><input required type="text" value={bugForm.title} onChange={e => setBugForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief summary" className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none" /></div>
              <div><label className="block text-xs font-mono text-secondary mb-1">Description *</label><textarea required rows={4} value={bugForm.description} onChange={e => setBugForm(f => ({ ...f, description: e.target.value }))} placeholder="Steps to reproduce, expected vs actual…" className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none resize-none font-sans" /></div>
              <div className="flex gap-2.5 pt-1"><button type="submit" disabled={bugCreateMut.isPending} className="flex-1 bg-amber-500 text-black py-2 rounded-sm text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 transition">{bugCreateMut.isPending ? "…" : "Submit Report"}</button><button type="button" onClick={() => setShowBugModal(false)} className="flex-1 surface-input border border-subtle text-secondary py-2 rounded-sm text-xs font-medium hover:text-primary transition">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {confirmAddContributor && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-6 border border-subtle shadow-2xl max-w-sm w-full font-sans">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="text-base font-semibold text-primary">Add as Contributor?</h3>
            </div>
            <p className="text-sm text-secondary mb-5">Add <span className="text-primary font-semibold">@{confirmAddContributor.username}</span> as a contributor to this project? Their activity and PRs will be tracked here.</p>
            <div className="flex gap-3">
              <button onClick={async () => {
                try {
                  await projectMembersAPI.addMember(projectId, confirmAddContributor.userId);
                  queryClient.invalidateQueries({ queryKey: ["project", projectId] });
                  setConfirmAddContributor(null);
                } catch (e) { alert(e.response?.data?.message || "Failed to add contributor"); }
              }} className="flex-1 bg-amber-500 text-black py-2.5 rounded-sm text-sm font-semibold hover:bg-amber-400 transition shadow-sm">Add Contributor</button>
              <button onClick={() => setConfirmAddContributor(null)} className="flex-1 surface-raised border border-subtle text-secondary py-2.5 rounded-sm text-sm font-medium hover:text-primary transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm max-w-md w-full border border-subtle shadow-2xl overflow-hidden font-sans">
            <div className="p-6 border-b border-subtle"><h2 className="text-lg font-semibold text-primary">Request Access</h2><p className="text-sm text-muted mt-1 font-mono">Applying to join <span className="text-primary font-semibold">{project.title}</span></p></div>
            <form onSubmit={e => { e.preventDefault(); requestMut.mutate({ projectId, reason, suggestion }); }} className="p-6 space-y-4">
              {project.openRoles?.length > 0 && (<div className="bg-amber-500/10 border border-amber-500/30 rounded-sm p-3"><p className="text-xs text-amber-500 font-mono font-medium mb-1.5">Open Roles</p><div className="flex flex-wrap gap-1.5">{project.openRoles.map((r, i) => <span key={i} className="text-xs text-secondary font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-sm">{r}</span>)}</div></div>)}
              <div><label className="block text-sm text-secondary font-medium mb-1.5">Why do you want to join? *</label><textarea required value={reason} onChange={e => setReason(e.target.value)} rows={3} className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none resize-none placeholder-muted" /></div>
              <div><label className="block text-sm text-secondary font-medium mb-1.5">How can you contribute? *</label><textarea required value={suggestion} onChange={e => setSuggestion(e.target.value)} rows={3} className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none resize-none placeholder-muted" /></div>
              <div className="flex gap-3 pt-2"><button type="submit" disabled={requestMut.isPending || !reason.trim() || !suggestion.trim()} className="flex-1 bg-amber-500 text-black py-2.5 rounded-sm text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition shadow-sm">{requestMut.isPending ? "…" : "Submit Request"}</button><button type="button" onClick={() => { setShowRequestModal(false); setReason(""); setSuggestion(""); }} className="flex-1 surface-raised border border-subtle text-secondary py-2.5 rounded-sm text-sm font-medium hover:text-primary transition">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {showRepoModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="surface-card rounded-sm max-w-lg w-full border border-subtle my-4 font-sans">
            <div className="p-5 border-b border-subtle"><h2 className="text-sm font-mono font-bold text-primary flex items-center gap-2"><KeyRound className="h-4 w-4 text-amber-500" /> Request Repository Access</h2><p className="text-xs text-muted mt-0.5">For <span className="text-primary font-mono font-medium">{project.title}</span></p></div>
            <form onSubmit={e => { e.preventDefault(); repoRequestMut.mutate(); }} className="p-5 space-y-3">
              <div><label className="block text-xs font-mono text-muted mb-1.5">Requested Role *</label><input type="text" required value={repoForm.requestedRole} onChange={e => setRepoForm(f => ({ ...f, requestedRole: e.target.value }))} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" /></div>
              <div><label className="block text-xs font-mono text-muted mb-1.5">GitHub Profile URL *</label><input type="url" required value={repoForm.githubProfile} onChange={e => setRepoForm(f => ({ ...f, githubProfile: e.target.value }))} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" /></div>
              <div><label className="block text-xs font-mono text-muted mb-1.5">Experience *</label><textarea required value={repoForm.experienceDescription} onChange={e => setRepoForm(f => ({ ...f, experienceDescription: e.target.value }))} rows={3} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none resize-none font-sans" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-mono text-muted mb-1.5">Availability (hrs/wk) *</label><input type="number" required min="1" max="80" value={repoForm.availabilityHours} onChange={e => setRepoForm(f => ({ ...f, availabilityHours: e.target.value }))} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" /></div>
                <div><label className="block text-xs font-mono text-muted mb-1.5">Portfolio URL</label><input type="url" value={repoForm.portfolioUrl} onChange={e => setRepoForm(f => ({ ...f, portfolioUrl: e.target.value }))} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" /></div>
              </div>
              <div className="flex gap-3 pt-2"><button type="submit" disabled={repoRequestMut.isPending} className="flex-1 bg-amber-500 text-gray-950 py-2 rounded-sm text-xs font-mono font-bold hover:bg-amber-400 disabled:opacity-50 transition">{repoRequestMut.isPending ? "…" : "Submit Request"}</button><button type="button" onClick={() => setShowRepoModal(false)} className="flex-1 surface-raised border border-subtle text-muted hover:text-primary py-2 rounded-sm text-xs font-mono transition">Cancel</button></div>
            </form>
          </div>
        </div>
      )}

      {confirmRemove && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-5 border border-subtle max-w-sm w-full font-sans">
            <div className="flex items-center gap-3 mb-3"><div className="w-9 h-9 bg-red-950/40 border border-red-800/50 rounded-sm flex items-center justify-center flex-shrink-0"><UserMinus className="h-4.5 w-4.5 text-red-400" /></div><h3 className="text-sm font-mono font-bold text-primary">Remove Contributor?</h3></div>
            <p className="text-xs text-muted mb-4"><span className="text-primary font-mono font-medium">{confirmRemove.username}</span> will lose access to this project.</p>
            <div className="flex gap-3"><button onClick={() => removeMemberMut.mutate(confirmRemove.userId)} disabled={removeMemberMut.isPending} className="flex-1 bg-red-600 text-white py-1.5 rounded-sm text-xs font-mono font-bold hover:bg-red-500 disabled:opacity-50 transition">{removeMemberMut.isPending ? "…" : "Remove"}</button><button onClick={() => setConfirmRemove(null)} className="flex-1 surface-raised border border-subtle text-muted hover:text-primary py-1.5 rounded-sm text-xs font-mono transition">Cancel</button></div>
          </div>
        </div>
      )}

      {/* ── Confirm Delete Announcement ─────────────────────────────────────── */}
      {confirmDeleteAnn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-5 border border-red-500/30 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-red-500/10 rounded-sm flex items-center justify-center flex-shrink-0 border border-red-500/20">
                <Trash2 className="h-4 w-4 text-red-500" />
              </div>
              <h3 className="text-sm font-semibold text-primary">Delete Announcement?</h3>
            </div>
            <p className="text-xs text-secondary mb-4 font-mono">This announcement will be permanently deleted and all notified members will lose the reference.</p>
            <div className="flex gap-2.5">
              <button
                onClick={() => { annDeleteMut.mutate(confirmDeleteAnn); setConfirmDeleteAnn(null); }}
                disabled={annDeleteMut.isPending}
                className="flex-1 bg-red-600 text-white py-2 rounded-sm text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition"
              >
                {annDeleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setConfirmDeleteAnn(null)} className="flex-1 surface-input border border-subtle text-secondary py-2 rounded-sm text-xs font-medium hover:text-primary transition">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Reopen Project ────────────────────────────────────────────── */}
      {confirmReopen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-6 border border-subtle shadow-2xl max-w-sm w-full font-sans">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-sm flex items-center justify-center flex-shrink-0">
                <RotateCcw className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="text-base font-semibold text-primary">Reopen Project?</h3>
            </div>
            <p className="text-sm text-secondary mb-5">This will mark the project as active again and make it visible in public explore.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { reopenMut.mutate(); setConfirmReopen(false); }}
                disabled={reopenMut.isPending}
                className="flex-1 bg-amber-500 text-black py-2.5 rounded-sm text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition shadow-sm"
              >
                {reopenMut.isPending ? "Reopening…" : "Reopen"}
              </button>
              <button onClick={() => setConfirmReopen(false)} className="flex-1 surface-raised border border-subtle text-secondary py-2.5 rounded-sm text-sm font-medium hover:text-primary transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
