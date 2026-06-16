export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  githubUsername?: string;
  githubProfileUrl?: string;
  createdAt: string;
  _count?: {
    projects: number;
    projectMemberships: number;
  };
}

export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  deployedUrl: string;
  githubRepoUrl?: string;
  isRepoPrivate: boolean;
  ownerId: string;
  owner?: {
    id: string;
    username: string;
    avatarUrl?: string;
    githubUsername?: string;
  };
  createdAt: string;
  _count?: {
    members: number;
    accessRequests?: number;
  };
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "OWNER" | "CONTRIBUTOR";
  joinedAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
    githubUsername?: string;
    githubProfileUrl?: string;
  };
}

export interface AccessRequest {
  id: string;
  reason: string;
  suggestion: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  projectId: string;
  requesterId: string;
  createdAt: string;
  project?: {
    id: string;
    title: string;
    ownerId?: string;
  };
  requester?: {
    id: string;
    username: string;
    avatarUrl?: string;
    githubUsername?: string;
    githubProfileUrl?: string;
  };
}

export interface Activity {
  id: string;
  action: string;
  description: string;
  projectId?: string;
  userId?: string;
  metadata?: any;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
    githubUsername?: string;
  };
  project?: {
    id: string;
    title: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ProjectStats {
  projectId: string;
  members: number;
  accessRequests: {
    pending: number;
    approved: number;
    rejected: number;
    total: number;
  };
  activities: number;
}

export interface PlatformStats {
  users: number;
  projects: number;
  memberships: number;
  accessRequests: {
    total: number;
    pending: number;
    processed: number;
  };
  activities: number;
}
