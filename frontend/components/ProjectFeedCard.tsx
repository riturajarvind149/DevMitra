"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Project } from "@/types";
import { ExternalLink, Users, GitPullRequest, FolderGit2, EyeOff, Lock, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import LikeButton from "./LikeButton";
import SaveButton from "./SaveButton";

interface Props { project: Project }

export default function ProjectFeedCard({ project }: Props) {
  const router = useRouter();

  // Navigate to project detail when clicking anywhere on the card
  // except interactive elements (like/save buttons, visit link)
  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-indigo-700 transition-all group cursor-pointer"
    >
      {/* Cover image */}
      <div className="relative h-44 bg-gray-800 overflow-hidden">
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderGit2 className="h-12 w-12 text-gray-700 group-hover:text-gray-600 transition" />
          </div>
        )}
        {project.category && (
          <span className="absolute top-2.5 left-2.5 bg-indigo-600/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            {project.category}
          </span>
        )}
        {project.visibility === "PRIVATE" && (
          <span className="absolute top-2.5 right-2.5 bg-gray-900/80 backdrop-blur-sm text-red-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <Lock className="h-2.5 w-2.5" />Private
          </span>
        )}
        {project.visibility === "UNLISTED" && (
          <span className="absolute top-2.5 right-2.5 bg-gray-900/80 backdrop-blur-sm text-yellow-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <EyeOff className="h-2.5 w-2.5" />Unlisted
          </span>
        )}
        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-colors duration-300" />
      </div>

      <div className="p-4">
        {/* Owner + timestamp */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {project.owner?.avatarUrl ? (
              <img src={project.owner.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">{project.owner?.username?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="text-xs text-gray-400">{project.owner?.username}</span>
            <span className="text-[10px] text-gray-600">·</span>
            <span className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
          </div>
          {project.githubRepoUrl && (
            <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <FolderGit2 className="h-2.5 w-2.5" />Linked
            </span>
          )}
        </div>

        {/* Title & description */}
        <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1 group-hover:text-indigo-300 transition-colors">
          {project.title}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2 mb-3 leading-relaxed">{project.description}</p>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {project.tags.slice(0, 4).map((tag, i) => (
              <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
            {project.tags.length > 4 && <span className="text-[10px] text-gray-600">+{project.tags.length - 4}</span>}
          </div>
        )}

        {/* Open roles */}
        {project.openRoles && project.openRoles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5 items-center">
            <span className="text-[10px] text-yellow-500 flex items-center gap-0.5">
              <Briefcase className="h-3 w-3" />Hiring:
            </span>
            {project.openRoles.slice(0, 2).map((r, i) => (
              <span key={i} className="text-[10px] text-yellow-300 bg-yellow-900/30 border border-yellow-800/40 px-1.5 py-0.5 rounded-full">{r}</span>
            ))}
            {project.openRoles.length > 2 && <span className="text-[10px] text-gray-600">+{project.openRoles.length - 2}</span>}
          </div>
        )}

        {/* Stats row — stop propagation on interactive elements */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
            <LikeButton projectId={project.id} />
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />{project._count?.members ?? 0}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <GitPullRequest className="h-3.5 w-3.5" />{project._count?.accessRequests ?? 0}
            </span>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <SaveButton projectId={project.id} />
            <a
              href={project.deployedUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] text-gray-400 border border-gray-700 px-2 py-1 rounded-lg hover:bg-gray-800 transition"
            >
              <ExternalLink className="h-3 w-3" />Visit
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
