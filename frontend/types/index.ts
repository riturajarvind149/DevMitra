export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  githubUsername?: string;
  githubProfileUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  linkedinUrl?: string;
  twitterUrl?: string;
  portfolioUrl?: string;
  availabilityHours?: number;
  profileVisibility?: "PUBLIC" | "CONNECTIONS_ONLY" | "PRIVATE";
  isAdmin?: boolean;
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
  coverImage?: string;
  images?: string[];
  category?: string;
  visibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  openRoles: string[];
  deployedUrl: string;
  githubRepoUrl?: string;
  isRepoPrivate: boolean;
  _repoHidden?: boolean;
  ownerId: string;
  owner?: {
    id: string;
    username: string;
    avatarUrl?: string;
    githubUsername?: string;
    githubProfileUrl?: string;
  };
  createdAt: string;
  updatedAt?: string;
  _count?: {
    members: number;
    accessRequests?: number;
    likes?: number;
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
  project?: { id: string; title: string; ownerId?: string };
  requester?: { id: string; username: string; avatarUrl?: string; githubUsername?: string; githubProfileUrl?: string };
}

export interface Activity {
  id: string;
  action: string;
  description: string;
  projectId?: string;
  userId?: string;
  metadata?: any;
  createdAt: string;
  user?: { id: string; username: string; avatarUrl?: string; githubUsername?: string };
  project?: { id: string; title: string };
}

export interface Story {
  id: string;
  userId: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption?: string;
  label?: string;
  visibility: "PUBLIC" | "CONNECTIONS_ONLY" | "PRIVATE";
  expiresAt: string;
  createdAt: string;
  user: { id: string; username: string; avatarUrl?: string };
}

export interface StoryGroup {
  user: { id: string; username: string; avatarUrl?: string };
  stories: Story[];
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link?: string;
  receiverId: string;
  senderId?: string;
  projectId?: string;
  createdAt: string;
  sender?: { id: string; username: string; avatarUrl?: string };
  project?: { id: string; title: string };
}

export interface Message {
  id: string;
  content: string;
  read: boolean;
  conversationId: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  sender?: { id: string; username: string; avatarUrl?: string };
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  otherUser: { id: string; username: string; avatarUrl?: string } | null;
  unreadCount: number;
  lastMessage: Message | null;
}

export interface Connection {
  id: string;
  user: { id: string; username: string; avatarUrl?: string; bio?: string; skills?: string[]; githubUsername?: string };
  connectedAt: string;
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  sender: { id: string; username: string; avatarUrl?: string; bio?: string; skills?: string[] };
}

export interface Comment {
  id: string;
  content: string;
  projectId: string;
  userId: string;
  parentCommentId?: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; username: string; avatarUrl?: string };
  replies?: Comment[];
  _count?: { replies: number };
}

export interface PlatformStats {
  users: number;
  projects: number;
  memberships: number;
  contributors: number;
  likes: number;
  connections: number;
  comments: number;
  repoRequests: number;
  openOpportunities: number;
  accessRequests: { total: number; pending: number; processed: number };
  activities: number;
}

export interface ProjectStats {
  projectId: string;
  members: number;
  accessRequests: { pending: number; approved: number; rejected: number; total: number };
  activities: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}

export interface RepositoryAccessRequest {
  id: string;
  projectId: string;
  requesterId: string;
  requestedRole: string;
  githubProfile: string;
  experienceDescription: string;
  availabilityHours: number;
  portfolioUrl?: string;
  additionalMessage?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
  project?: { id: string; title: string; ownerId?: string };
  requester?: { id: string; username: string; avatarUrl?: string; githubUsername?: string; skills?: string[] };
  reviewedBy?: { id: string; username: string; avatarUrl?: string };
}

export interface Opportunity {
  id: string;
  title: string;
  role: string;
  description: string;
  requiredSkills: string[];
  duration?: string;
  budget?: string;
  isRemote: boolean;
  projectId?: string;
  ownerId: string;
  status: "OPEN" | "CLOSED" | "FILLED";
  createdAt: string;
  owner?: { id: string; username: string; avatarUrl?: string; skills?: string[] };
  project?: { id: string; title: string };
  _count?: { applications: number };
  applications?: OpportunityApplication[];
}

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  applicantId: string;
  experience: string;
  githubUrl?: string;
  portfolioUrl?: string;
  message?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  applicant?: { id: string; username: string; avatarUrl?: string; skills?: string[] };
}
