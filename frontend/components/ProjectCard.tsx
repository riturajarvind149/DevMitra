import Link from "next/link";
import { Project } from "@/types";
import { ExternalLink, Users, Calendar, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-gray-800 rounded-lg p-5 hover:bg-gray-750 transition cursor-pointer border border-gray-700 hover:border-indigo-500 h-full">
        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2 hover:text-indigo-400 transition line-clamp-1">
          {project.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
          {project.description}
        </p>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs rounded-md font-medium"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md font-medium">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{project._count?.members || 0}</span>
            </div>
            {project.owner?.avatarUrl && (
              <img
                src={project.owner.avatarUrl}
                alt={project.owner.username}
                className="h-5 w-5 rounded-full"
                title={project.owner.username}
              />
            )}
          </div>
          <div className="flex items-center space-x-1 text-xs">
            <Calendar className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(project.createdAt), {
                addSuffix: false,
              })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
