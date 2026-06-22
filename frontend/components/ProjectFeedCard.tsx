"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import { ExternalLink, Users, GitPullRequest, FolderGit2, EyeOff, Lock, Briefcase, Send, X } from "lucide-react";
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

  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => { const { data } = await connectionsAPI.getAll(); return data; },
    enabled: showShare && isAuthenticated,
    staleTime: 60000,
  });

  const shareMut = useMutation({
    mutationFn: (receiverId: string) => messagesAPI.send({
      receiverId,
      content: `Check out this project: "${project.title}" — ${window.location.origin}/projects/${project.id}`,
    }),
    onSuccess: (_, receiverId) => { setSentTo(receiverId); setTimeout(() => { setShowShare(false); setSentTo(null); }, 1500); },
  });

  const handleCardClick = () => { router.push(`/projects/${project.id}`); };

  return (
    <>
    <div onClick={handleCardClick} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-indigo-700 transition-all group cursor-pointer">
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
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors duration-300" />
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {project.owner?.avatarUrl ? <img src={project.owner.avatarUrl} alt="" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center"><span className="text-[9px] font-bold text-white">{project.owner?.username?.charAt(0).toUpperCase()}</span></div>}
            <span className="text-xs text-gray-400">{project.owner?.username}</span>
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
            {/* Share button */}
            {isAuthenticated && (
              <button onClick={e => { e.stopPropagation(); setShowShare(true); }}
                className="flex items-center gap-1 text-[10px] text-gray-400 border border-gray-700 px-2 py-1 rounded-lg hover:bg-gray-800 hover:text-indigo-400 transition" title="Share with connection">
                <Send className="h-3 w-3" />Share
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

    {/* Share Modal */}
    {showShare && (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setShowShare(false)}>
        <div className="bg-gray-900 rounded-2xl max-w-sm w-full border border-gray-700 overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2"><Send className="h-4 w-4 text-indigo-400" /> Share Project</h2>
            <button onClick={() => setShowShare(false)} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="p-4">
            <p className="text-xs text-gray-500 mb-3">Send "{project.title}" to a connection</p>
            <div className="space-y-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
              {!connections ? (
                <div className="text-center py-4"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>
              ) : connections.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No connections yet</p>
              ) : (connections as any[]).map((conn: any) => (
                <div key={conn.id} className="flex items-center justify-between p-2.5 bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-2">
                    {conn.user.avatarUrl ? <img src={conn.user.avatarUrl} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">{conn.user.username.charAt(0).toUpperCase()}</div>}
                    <span className="text-sm text-white">{conn.user.username}</span>
                  </div>
                  <button
                    onClick={() => shareMut.mutate(conn.user.id)}
                    disabled={shareMut.isPending || sentTo === conn.user.id}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${sentTo === conn.user.id ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"}`}
                  >
                    {sentTo === conn.user.id ? "Sent ✓" : "Send"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

