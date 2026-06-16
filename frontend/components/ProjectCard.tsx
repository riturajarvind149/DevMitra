import Link from "next/link";
import { Project } from "@/types";
import { ExternalLink, Github, Users, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Link href={`/projects/${project.id}`}>
            <h3 className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition cursor-pointer">
              {project.title}
            </h3>
          </Link>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {project.description}
          </p>
        </div>
      </div>

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
          {project.tags.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              +{project.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Owner and Stats */}
      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
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
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{project._count?.members || 0}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>
              {formatDistanceToNow(new Date(project.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200">
        <a
          href={project.deployedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-sm text-indigo-600 hover:text-indigo-700"
        >
          <ExternalLink className="h-4 w-4" />
          <span>Live Site</span>
        </a>
        {project.githubRepoUrl && !project.isRepoPrivate && (
          <a
            href={project.githubRepoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-sm text-gray-700 hover:text-gray-900"
          >
            <Github className="h-4 w-4" />
            <span>Repository</span>
          </a>
        )}
      </div>
    </div>
  );
}
