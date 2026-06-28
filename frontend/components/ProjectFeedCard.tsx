"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import { ExternalLink, Users, GitPullRequest, FolderGit2, EyeOff, Lock, Briefcase, Send, X, Link2, Share } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { connectionsAPI, messagesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Props { project: Project }

export default function ProjectFeedCard({ project }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [showShare, setShowShare] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareTab, setShareTab] = useState<"share" | "send">("share");

  const projectUrl = typeof window !== "undefined"
    ? `${window.location.origin}/projects/${project.id}`
    : `/projects/${project.id}`;

  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => { const { data } = await connectionsAPI.getAll(); return data; },
    enabled: showShare && isAuthenticated && shareTab === "send",
    staleTime: 60000,
  });

  const shareMut = useMutation({
    mutationFn: (receiverId: string) => messagesAPI.send({
      receiverId,
      content: `Check out this project: "${project.title}" — ${projectUrl}`,
    }),
    onSuccess: (_, receiverId) => {
      setSentTo(receiverId);
      setTimeout(() => { setShowShare(false); setSentTo(null); }, 1500);
    },
  });

  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(projectUrl).then(() => {
        setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
      }).catch(() => {});
    } else {
      const inp = document.createElement("input");
      inp.value = projectUrl; document.body.appendChild(inp); inp.select();
      document.execCommand("copy"); document.body.removeChild(inp);
      setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const shareVia = (platform: string) => {
    const url = encodeURIComponent(projectUrl);
    const text = encodeURIComponent(`Check out "${project.title}" on DevMitra`);
    if (platform === "native" && navigator.share) {
      navigator.share({ title: project.title, text: `Check out "${project.title}" on DevMitra`, url: projectUrl }).catch(() => {});
      return;
    }
    const urls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      twitter:  `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    if (urls[platform]) window.open(urls[platform], "_blank", "noopener,noreferrer");
  };

  return (
    <>
    <div onClick={() => router.push(`/projects/${project.id}`)}
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-indigo-700 transition-all group cursor-pointer">
      {/* Cover */}
      <div className="relative h-44 bg-gray-800 overflow-hidden">
        {project.coverImage ? (
          project.coverImage.startsWith("data:video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(project.coverImage)
            ? <video src={project.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted autoPlay loop playsInline />
            : <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><FolderGit2 className="h-12 w-12 text-gray-700 group-hover:text-gray-600 transition" /></div>
        )}
        {project.category && <span className="absolute top-2.5 left-2.5 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{project.category}</span>}
        {project.visibility === "PRIVATE" && <span className="absolute top-2.5 right-2.5 bg-gray-900/80 text-red-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><Lock className="h-2.5 w-2.5" />Private</span>}
        {project.visibility === "UNLISTED" && <span className="absolute top-2.5 right-2.5 bg-gray-900/80 text-yellow-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"><EyeOff className="h-2.5 w-2.5" />Unlisted</span>}
        {(project as any).isPaid && <span className="absolute bottom-2.5 left-2.5 bg-green-900/80 text-green-400 text-[10px] px-2 py-0.5 rounded-full">💰 Paid</span>}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Link href={`/users/${project.owner?.id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 hover:opacity-80 transition">
              {project.owner?.avatarUrl ? <img src={project.owner.avatarUrl} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center"><span className="text-[9px] font-bold text-white">{project.owner?.username?.charAt(0).toUpperCase()}</span></div>}
              <span className="text-xs text-gray-400 hover:text-indigo-400 transition">{project.owner?.username}</span>
            </Link>
            <span className="text-[10px] text-gray-600">·</span>
            <span className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
          </div>
          {project.githubRepoUrl && <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full flex items-center gap-1"><FolderGit2 className="h-2.5 w-2.5" />Linked</span>}
        </div>
        <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors">{project.title}</h3>
        <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{project.description}</p>
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {project.tags.slice(0, 4).map((tag, i) => <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full">{tag}</span>)}
            {project.tags.length > 4 && <span className="text-[10px] text-gray-600">+{project.tags.length - 4}</span>}
          </div>
        )}
        {project.openRoles && project.openRoles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5 items-center">
            <span className="text-[10px] text-yellow-500 flex items-center gap-0.5"><Briefcase className="h-3 w-3" />Hiring:</span>
            {project.openRoles.slice(0, 2).map((r, i) => <span key={i} className="text-[10px] text-yellow-300 bg-yellow-900/30 border border-yellow-800/40 px-1.5 py-0.5 rounded-full">{r}</span>)}
            {project.openRoles.length > 2 && <span className="text-[10px] text-gray-600">+{project.openRoles.length - 2}</span>}
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
            <LikeButton projectId={project.id} />
            <span className="flex items-center gap-1 text-xs text-gray-500"><Users className="h-3.5 w-3.5" />{project._count?.members ?? 0}</span>
            <span className="flex items-center gap-1 text-xs text-gray-500"><GitPullRequest className="h-3.5 w-3.5" />{project._count?.accessRequests ?? 0}</span>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <SaveButton projectId={project.id} />
            {isAuthenticated && (
              <button onClick={e => { e.stopPropagation(); setShareTab("share"); setShowShare(true); }}
                className="flex items-center gap-1 text-[10px] text-gray-400 border border-gray-700 px-2 py-1 rounded-lg hover:bg-gray-800 hover:text-indigo-400 transition">
                <Share className="h-3 w-3" />Share
              </button>
            )}
            <a href={project.deployedUrl} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-gray-400 border border-gray-700 px-2 py-1 rounded-lg hover:bg-gray-800 transition">
              <ExternalLink className="h-3 w-3" />Visit
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* ── Full Share Sheet ──────────────────────────────────────────────────────── */}
    {showShare && (
      <div className="fixed inset-0 bg-black/75 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
        onClick={() => setShowShare(false)}>
        <div className="bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md border-t sm:border border-gray-700 overflow-hidden"
          onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{project.title}</h2>
              <p className="text-[10px] text-gray-500 mt-0.5 truncate">{projectUrl}</p>
            </div>
            <button onClick={() => setShowShare(false)} className="text-gray-500 hover:text-white ml-3 flex-shrink-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mx-5 mb-4 bg-gray-800 rounded-xl p-1">
            <button onClick={() => setShareTab("share")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${shareTab === "share" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}>
              Share
            </button>
            <button onClick={() => setShareTab("send")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${shareTab === "send" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}>
              Send to Friend
            </button>
          </div>

          {/* Share tab */}
          {shareTab === "share" && (
            <div className="px-5 pb-6 space-y-4">
              {/* Copy link */}
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <Link2 className="h-5 w-5 text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white">Copy link</p>
                  <p className="text-[10px] text-gray-500 truncate">{projectUrl}</p>
                </div>
                <button onClick={copyLink}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex-shrink-0 ${copiedLink ? "bg-green-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"}`}>
                  {copiedLink ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Share platforms */}
              <div>
                <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-3">Share via</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: "whatsapp", emoji: "💬", label: "WhatsApp", bg: "bg-green-600" },
                    { id: "twitter",  emoji: "𝕏",  label: "Twitter",  bg: "bg-gray-700 border border-gray-600" },
                    { id: "telegram", emoji: "✈️", label: "Telegram", bg: "bg-blue-500" },
                    { id: "linkedin", emoji: "in", label: "LinkedIn", bg: "bg-blue-700" },
                  ].map(({ id, emoji, label, bg }) => (
                    <button key={id} onClick={() => shareVia(id)} className="flex flex-col items-center gap-1.5 group">
                      <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center text-white font-bold text-base group-hover:opacity-80 transition`}>
                        {emoji}
                      </div>
                      <span className="text-[10px] text-gray-500">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {typeof navigator !== "undefined" && (navigator as any).share && (
                <button onClick={() => shareVia("native")}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition border border-gray-700">
                  <Share className="h-4 w-4" />More options
                </button>
              )}
            </div>
          )}

          {/* Send to friend tab */}
          {shareTab === "send" && (
            <div className="px-5 pb-6">
              <div className="space-y-2 max-h-56 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
                {!connections ? (
                  <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : (connections as any[]).length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No connections yet</p>
                ) : (connections as any[]).map((conn: any) => (
                  <div key={conn.id} className="flex items-center justify-between p-2.5 bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-2">
                      {conn.user.avatarUrl ? <img src={conn.user.avatarUrl} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">{conn.user.username.charAt(0).toUpperCase()}</div>}
                      <span className="text-sm text-white">{conn.user.username}</span>
                    </div>
                    <button onClick={() => shareMut.mutate(conn.user.id)}
                      disabled={shareMut.isPending || sentTo === conn.user.id}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${sentTo === conn.user.id ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"}`}>
                      {sentTo === conn.user.id ? "Sent ✓" : "Send"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}
