"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderIcon,
  ExternalLinkIcon,
  UsersIcon,
  GitPrIcon,
  BriefcaseIcon,
  SendIcon,
  CloseIcon,
  CopyIcon,
  ShieldIcon,
  ChatIcon,
} from "@/components/icons";
import { formatDistanceToNow } from "date-fns";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { connectionsAPI, messagesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";

export default function ProjectFeedCard({ project }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [showShare, setShowShare] = useState(false);
  const [sentTo, setSentTo] = useState(null);
  const [shareTab, setShareTab] = useState("share");

  const projectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/projects/${project.id}`
      : `/projects/${project.id}`;

  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const { data } = await connectionsAPI.getAll();
      return data;
    },
    enabled: showShare && isAuthenticated && shareTab === "send",
    staleTime: 60000,
  });

  const shareMut = useMutation({
    mutationFn: (receiverId) =>
      messagesAPI.send({
        receiverId,
        content: `Check out this project: "${project.title}" : ${projectUrl}`,
      }),
    onSuccess: (_, receiverId) => {
      setSentTo(receiverId);
      toast.success("Project link sent to your connection", "Share");
      setTimeout(() => {
        setShowShare(false);
        setSentTo(null);
      }, 1500);
    },
  });

  const copyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(projectUrl)
        .then(() => toast.success("Project link copied to clipboard", "Share"))
        .catch(() => {});
    } else {
      const inp = document.createElement("input");
      inp.value = projectUrl;
      document.body.appendChild(inp);
      inp.select();
      document.execCommand("copy");
      document.body.removeChild(inp);
      toast.success("Project link copied to clipboard", "Share");
    }
  };

  const shareVia = (platform) => {
    const url = encodeURIComponent(projectUrl);
    const text = encodeURIComponent(`Check out "${project.title}" on BuildR`);
    if (platform === "native" && navigator.share) {
      navigator
        .share({
          title: project.title,
          text: `Check out "${project.title}" on BuildR`,
          url: projectUrl,
        })
        .catch(() => {});
      return;
    }
    const urls = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    };
    if (urls[platform]) window.open(urls[platform], "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div
        onClick={() => router.push(`/projects/${project.id}`)}
        className="bg-[#111621] border border-[#20293a] rounded-sm overflow-hidden hover:border-[#384964] transition-colors group cursor-pointer"
      >
        {/* Cover Media */}
        <div className="relative h-44 bg-[#0d121a] overflow-hidden border-b border-[#1b2332]">
          {project.coverImage ? (
            project.coverImage.startsWith("data:video") ||
            /\.(mp4|webm|ogg|mov)(\?|$)/i.test(project.coverImage) ? (
              <video
                src={project.coverImage}
                className="w-full h-full object-cover"
                muted
                autoPlay
                loop
                playsInline
              />
            ) : (
              <img
                src={project.coverImage}
                alt={`${project.title} cover`}
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-1.5">
              <FolderIcon className="h-10 w-10 text-gray-700" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-600">
                Repository
              </span>
            </div>
          )}

          {/* Precision Badges */}
          {project.category && (
            <span className="absolute top-2.5 left-2.5 bg-[#171f2c]/90 text-amber-400 border border-[#2b394f] text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[2px]">
              {project.category}
            </span>
          )}

          {project.visibility === "PRIVATE" && (
            <span className="absolute top-2.5 right-2.5 bg-red-950/80 text-red-400 border border-red-800/60 text-[10px] font-mono px-2 py-0.5 rounded-[2px] flex items-center gap-1">
              <ShieldIcon className="h-3 w-3" /> PRIVATE
            </span>
          )}

          {project.visibility === "UNLISTED" && (
            <span className="absolute top-2.5 right-2.5 bg-amber-950/80 text-amber-400 border border-amber-800/60 text-[10px] font-mono px-2 py-0.5 rounded-[2px]">
              UNLISTED
            </span>
          )}

          {project.isPaid && (
            <span className="absolute bottom-2.5 left-2.5 bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 text-[10px] font-mono font-bold px-2 py-0.5 rounded-[2px]">
              COMPENSATED
            </span>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${project.owner?.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1.5 hover:text-amber-400 transition"
              >
                {project.owner?.avatarUrl ? (
                  <img
                    src={project.owner.avatarUrl}
                    alt={project.owner?.username}
                    className="w-5 h-5 rounded-sm object-cover border border-[#29354a]"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-sm bg-[#1c2536] border border-[#29354a] flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-amber-400">
                      {project.owner?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-xs text-gray-300 font-medium">
                  {project.owner?.username}
                </span>
              </Link>
              <span className="text-[10px] text-gray-600">:</span>
              <span className="text-[10px] font-mono text-gray-500">
                {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
              </span>
            </div>

            {project.githubRepoUrl && (
              <span className="text-[10px] font-mono text-gray-400 bg-[#161c28] border border-[#263246] px-1.5 py-0.5 rounded-sm flex items-center gap-1">
                <FolderIcon className="h-3 w-3 text-gray-400" /> Git
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-gray-100 mb-1 line-clamp-1 group-hover:text-amber-400 transition-colors font-sans">
            {project.title}
          </h3>
          <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed font-sans">
            {project.description}
          </p>

          {/* Tags */}
          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {project.tags.slice(0, 4).map((tag, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono text-sky-400 bg-sky-950/30 border border-sky-800/40 px-1.5 py-0.5 rounded-[2px]"
                >
                  #{tag}
                </span>
              ))}
              {project.tags.length > 4 && (
                <span className="text-[10px] font-mono text-gray-500 self-center">
                  +{project.tags.length - 4}
                </span>
              )}
            </div>
          )}

          {/* Hiring / Open Roles */}
          {project.openRoles && project.openRoles.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3 items-center">
              <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 mr-1">
                <BriefcaseIcon className="h-3 w-3" /> Roles:
              </span>
              {project.openRoles.slice(0, 2).map((r, i) => (
                <span
                  key={i}
                  className="text-[10px] font-mono text-amber-300 bg-amber-950/30 border border-amber-800/40 px-1.5 py-0.5 rounded-[2px]"
                >
                  {r}
                </span>
              ))}
              {project.openRoles.length > 2 && (
                <span className="text-[10px] font-mono text-gray-500">
                  +{project.openRoles.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Footer Controls Strip */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1e2738]">
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <LikeButton projectId={project.id} />
              <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                <UsersIcon className="h-3.5 w-3.5 text-gray-500" />
                {project._count?.members ?? 0}
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono text-gray-400">
                <GitPrIcon className="h-3.5 w-3.5 text-gray-500" />
                {project._count?.accessRequests ?? 0}
              </span>
            </div>

            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <SaveButton projectId={project.id} />

              {isAuthenticated && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShareTab("share");
                    setShowShare(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-mono text-gray-300 bg-[#161d2a] border border-[#27354b] px-2 py-1 rounded-sm hover:border-amber-500 transition"
                  title="Share repository"
                >
                  <SendIcon className="h-3 w-3" />
                  <span>Share</span>
                </button>
              )}

              <a
                href={project.deployedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-[11px] font-mono text-gray-300 bg-[#161d2a] border border-[#27354b] px-2 py-1 rounded-sm hover:border-amber-500 transition"
                title="Launch deployment"
              >
                <ExternalLinkIcon className="h-3 w-3" />
                <span>Visit</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {showShare && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShare(false)}
        >
          <div
            className="bg-[#111722] rounded-sm w-full max-w-md border border-[#28354c] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#212c3f]">
              <div>
                <h2 className="text-xs font-semibold text-gray-100 truncate">{project.title}</h2>
                <p className="text-[10px] font-mono text-gray-500 truncate">{projectUrl}</p>
              </div>
              <button
                onClick={() => setShowShare(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 p-2 bg-[#0e131d] border-b border-[#212c3f]">
              <button
                onClick={() => setShareTab("share")}
                className={`flex-1 py-1 text-xs font-mono font-medium rounded-sm transition ${
                  shareTab === "share"
                    ? "bg-[#1c2637] text-amber-400 border border-[#2f3f5a]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                External Broadcast
              </button>
              <button
                onClick={() => setShareTab("send")}
                className={`flex-1 py-1 text-xs font-mono font-medium rounded-sm transition ${
                  shareTab === "send"
                    ? "bg-[#1c2637] text-amber-400 border border-[#2f3f5a]"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                Direct Message
              </button>
            </div>

            {shareTab === "share" && (
              <div className="p-4 space-y-4">
                {/* Copy Link Strip */}
                <div className="flex items-center justify-between p-2.5 bg-[#17202e] border border-[#263449] rounded-sm">
                  <span className="text-xs font-mono text-gray-300 truncate max-w-[260px]">
                    {projectUrl}
                  </span>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-gray-950 font-mono text-xs font-bold rounded-sm transition"
                  >
                    <CopyIcon className="h-3 w-3" /> Copy
                  </button>
                </div>

                <div>
                  <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-2">
                    Broadcast Platform
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "twitter", label: "X / Twitter" },
                      { id: "linkedin", label: "LinkedIn" },
                      { id: "telegram", label: "Telegram" },
                      { id: "whatsapp", label: "WhatsApp" },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => shareVia(id)}
                        className="py-2 px-1 text-center bg-[#17202e] hover:bg-[#202b3d] border border-[#263449] text-gray-300 hover:text-amber-400 text-[11px] font-mono rounded-sm transition"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {shareTab === "send" && (
              <div className="p-4">
                <div className="space-y-1.5 max-h-56 overflow-y-auto">
                  {!connections ? (
                    <div className="flex justify-center py-4">
                      <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : connections.length === 0 ? (
                    <p className="text-xs font-mono text-gray-500 text-center py-4">
                      No connected developers yet
                    </p>
                  ) : (
                    connections.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between p-2 bg-[#17202e] border border-[#263449] rounded-sm"
                      >
                        <span className="text-xs text-gray-200 font-mono">
                          @{conn.user.username}
                        </span>
                        <button
                          onClick={() => shareMut.mutate(conn.user.id)}
                          disabled={shareMut.isPending || sentTo === conn.user.id}
                          className={`text-xs font-mono px-2.5 py-1 rounded-sm transition ${
                            sentTo === conn.user.id
                              ? "bg-emerald-600 text-white"
                              : "bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold"
                          }`}
                        >
                          {sentTo === conn.user.id ? "Sent" : "Send"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
