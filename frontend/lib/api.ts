import axios from "axios";
import type {
  User, Project, ProjectMember, AccessRequest, Activity,
  ProjectStats, PlatformStats, Story, StoryGroup, Notification,
  Message, Conversation, Connection, ConnectionRequest, Comment,
  RepositoryAccessRequest, Opportunity, OpportunityApplication,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const authAPI = {
  getCurrentUser: () => api.get<User>("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const usersAPI = {
  getAll: (params?: { search?: string }) => api.get<User[]>("/users", { params }),
  getById: (id: string) => api.get<any>(`/users/${id}`),
  getUserProjects: (id: string) => api.get<Project[]>(`/users/${id}/projects`),
  getUserMemberships: (id: string) => api.get<any[]>(`/users/${id}/memberships`),
  getUserContributing: (id: string) => api.get<Project[]>(`/users/${id}/contributing`),
  getUserLikedProjects: (id: string) => api.get<any[]>(`/users/${id}/liked-projects`),
  getUserComments: (id: string) => api.get<any[]>(`/users/${id}/comments`),
  getUserApplications: (id: string) => api.get<any[]>(`/users/${id}/applications`),
  update: (id: string, data: Partial<User> & {
    skills?: string[]; profileVisibility?: string;
    isPaidContributor?: boolean; pricePerBug?: number; pricePerFeature?: number;
    hourlyRate?: number; openForPaidWork?: boolean;
  }) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const projectsAPI = {
  getAll: (params?: { search?: string; owner?: string; limit?: number; offset?: number; sort?: string }) =>
    api.get<{ projects: Project[]; pagination: any }>("/projects", { params }),
  getMyProjects: () => api.get<Project[]>("/projects/my"),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  getStats: (id: string) => api.get<ProjectStats>(`/projects/${id}/stats`),
  create: (data: {
    title: string; description: string; deployedUrl: string;
    githubRepoUrl?: string; tags?: string[]; coverImage?: string;
    images?: string[]; category?: string; isRepoPrivate?: boolean;
    visibility?: string; openRoles?: string[];
    isPaid?: boolean; budget?: string;
  }) => api.post<Project>("/projects", data),
  update: (id: string, data: Partial<Project> & {
    coverImage?: string; category?: string;
    isRepoPrivate?: boolean; visibility?: string; openRoles?: string[];
  }) => api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const projectMembersAPI = {
  getMembers: (projectId: string) => api.get<ProjectMember[]>(`/projects/${projectId}/members`),
  checkMembership: (projectId: string) =>
    api.get<{ isMember: boolean; role: string | null; joinedAt?: string }>(`/projects/${projectId}/membership`),
  removeMember: (projectId: string, userId: string) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
  addMember: (projectId: string, userId: string) =>
    api.post(`/projects/${projectId}/members`, { userId }),
};

export const accessRequestsAPI = {
  getMine: (status?: string) =>
    api.get<AccessRequest[]>("/access-requests/mine", { params: status ? { status } : {} }),
  getIncoming: (status?: string) =>
    api.get<AccessRequest[]>("/access-requests/incoming", { params: status ? { status } : {} }),
  checkMyRequest: (projectId: string) =>
    api.get<{ hasRequest: boolean; request: AccessRequest | null }>(`/access-requests/check/${projectId}`),
  create: (data: { projectId: string; reason: string; suggestion: string }) =>
    api.post<AccessRequest>("/access-requests", data),
  approve: (id: string) => api.put<AccessRequest>(`/access-requests/${id}/approve`),
  reject: (id: string) => api.put<AccessRequest>(`/access-requests/${id}/reject`),
};

export const activitiesAPI = {
  getProjectActivities: (projectId: string, params?: { limit?: number; offset?: number }) =>
    api.get<{ activities: Activity[]; pagination: any }>(`/projects/${projectId}/activities`, { params }),
  getUserActivities: (userId: string, params?: { limit?: number; offset?: number }) =>
    api.get<{ activities: Activity[]; pagination: any }>(`/users/${userId}/activities`, { params }),
};

export const statsAPI = {
  getPlatformStats: () => api.get<PlatformStats>("/stats"),
};

export const storiesAPI = {
  getActive: () => api.get<StoryGroup[]>("/stories"),
  create: (data: { mediaUrl: string; mediaType?: string; caption?: string; label?: string; visibility?: string }) =>
    api.post<Story>("/stories", data),
  delete: (id: string) => api.delete(`/stories/${id}`),
};

export const notificationsAPI = {
  getAll: (params?: { limit?: number; offset?: number }) =>
    api.get<{ notifications: Notification[]; unreadCount: number }>("/notifications", { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
};

export const messagesAPI = {
  getConversations: () => api.get<Conversation[]>("/messages/conversations"),
  getMessages: (conversationId: string, params?: { limit?: number; offset?: number }) =>
    api.get<Message[]>(`/messages/${conversationId}`, { params }),
  send: (data: { receiverId: string; content: string }) => api.post<Message>("/messages/send", data),
  getUnreadCount: () => api.get<{ unreadCount: number }>("/messages/unread-count"),
};

export const connectionsAPI = {
  getAll: () => api.get<Connection[]>("/connections"),
  getRequests: () => api.get<ConnectionRequest[]>("/connections/requests"),
  getStatus: (userId: string) =>
    api.get<{ status: string; connectionId: string | null; isSender: boolean }>(`/connections/status/${userId}`),
  getCounts: (userId: string) =>
    api.get<{ connections: number; following: number; followers: number }>(`/connections/counts/${userId}`),
  send: (userId: string) => api.post(`/connections/request/${userId}`),
  accept: (requestId: string) => api.put(`/connections/accept/${requestId}`),
  reject: (requestId: string) => api.put(`/connections/reject/${requestId}`),
  remove: (userId: string) => api.delete(`/connections/${userId}`),
};

export const likesAPI = {
  getLikes: (projectId: string) => api.get<{ count: number; liked: boolean }>(`/projects/${projectId}/likes`),
  like: (projectId: string) => api.post(`/projects/${projectId}/likes`),
  unlike: (projectId: string) => api.delete(`/projects/${projectId}/likes`),
};

export const savesAPI = {
  getStatus: (projectId: string) => api.get<{ saved: boolean }>(`/projects/${projectId}/save/status`),
  save: (projectId: string) => api.post(`/projects/${projectId}/save`),
  unsave: (projectId: string) => api.delete(`/projects/${projectId}/save`),
  getSaved: () => api.get<Project[]>("/saved-projects"),
};

export const commentsAPI = {
  getComments: (projectId: string) => api.get<Comment[]>(`/projects/${projectId}/comments`),
  addComment: (projectId: string, data: { content: string; parentCommentId?: string }) =>
    api.post<Comment>(`/projects/${projectId}/comments`, data),
  updateComment: (id: string, content: string) => api.put<Comment>(`/comments/${id}`, { content }),
  deleteComment: (id: string) => api.delete(`/comments/${id}`),
};

export const repoRequestsAPI = {
  create: (data: {
    projectId: string; requestedRole: string; githubProfile: string;
    experienceDescription: string; availabilityHours: number; portfolioUrl?: string; additionalMessage?: string;
  }) => api.post<RepositoryAccessRequest>("/repo-requests", data),
  getMine: () => api.get<RepositoryAccessRequest[]>("/repo-requests/mine"),
  getIncoming: (status?: string) => api.get<RepositoryAccessRequest[]>("/repo-requests/incoming", { params: status ? { status } : {} }),
  check: (projectId: string) => api.get<{ hasRequest: boolean; request: RepositoryAccessRequest | null }>(`/repo-requests/check/${projectId}`),
  approve: (id: string) => api.put<RepositoryAccessRequest>(`/repo-requests/${id}/approve`),
  reject: (id: string) => api.put<RepositoryAccessRequest>(`/repo-requests/${id}/reject`),
};

export const opportunitiesAPI = {
  getAll: (params?: { search?: string; skill?: string; remote?: boolean; limit?: number; offset?: number }) =>
    api.get<{ opportunities: Opportunity[]; pagination: any }>("/opportunities", { params }),
  getMine: () => api.get<Opportunity[]>("/opportunities/mine"),
  getById: (id: string) => api.get<Opportunity>(`/opportunities/${id}`),
  checkApplied: (id: string) => api.get<{ applied: boolean; application: OpportunityApplication | null }>(`/opportunities/${id}/check`),
  create: (data: Partial<Opportunity>) => api.post<Opportunity>("/opportunities", data),
  update: (id: string, data: Partial<Opportunity>) => api.put<Opportunity>(`/opportunities/${id}`, data),
  delete: (id: string) => api.delete(`/opportunities/${id}`),
  apply: (id: string, data: { experience: string; githubUrl?: string; portfolioUrl?: string; message?: string }) =>
    api.post<OpportunityApplication>(`/opportunities/${id}/apply`, data),
  approveApp: (id: string, appId: string) => api.put(`/opportunities/${id}/applications/${appId}/approve`),
  rejectApp: (id: string, appId: string) => api.put(`/opportunities/${id}/applications/${appId}/reject`),
};

export const developersAPI = {
  getAll: (params?: { search?: string; skill?: string; location?: string; availability?: number; limit?: number; offset?: number }) =>
    api.get<{ developers: User[]; pagination: any }>("/developers", { params }),
  getSuggested: () => api.get<User[]>("/developers/suggested"),
  getActivityFeed: (params?: { limit?: number; offset?: number }) =>
    api.get<Activity[]>("/developers/feed", { params }),
};

export const aiAPI = {
  getProfile: () => api.get("/ai/profile"),
  updateProfile: (data: { skills?: string[]; interests?: string[]; preferredRoles?: string[]; techStackExp?: any; preferRemote?: boolean }) =>
    api.put("/ai/profile", data),
  getSuggestedDevelopers: () => api.get<User[]>("/ai/suggested-developers"),
  getSuggestedProjects: () => api.get<Project[]>("/ai/suggested-projects"),
};

export const profileDataAPI = {
  getMyProfile: () => api.get<any>("/profile-data/me"),
  getPublicProfile: (userId: string) => api.get<any>(`/profile-data/${userId}`),
};

export const bugReportsAPI = {
  create: (data: { projectId: string; title: string; description: string; type?: string; severity?: string }) =>
    api.post("/bug-reports", data),
  getMine: () => api.get<any[]>("/bug-reports/mine"),
  getForProject: (projectId: string, params?: { status?: string; type?: string }) =>
    api.get<any>(`/bug-reports/project/${projectId}`, { params }),
  getById: (id: string) => api.get<any>(`/bug-reports/${id}`),
  update: (id: string, data: { status?: string; resolution?: string; severity?: string }) =>
    api.put(`/bug-reports/${id}`, data),
  delete: (id: string) => api.delete(`/bug-reports/${id}`),
};

export const pullRequestsAPI = {
  create: (data: { projectId: string; title: string; description: string; branchName?: string; prUrl?: string; type?: string; isPaid?: boolean; agreedPrice?: number; bugReportId?: string }) =>
    api.post("/pull-requests", data),
  getMine: () => api.get<any[]>("/pull-requests/mine"),
  getIncoming: (params?: { status?: string }) => api.get<any[]>("/pull-requests/incoming", { params }),
  getForProject: (projectId: string, params?: { status?: string }) =>
    api.get<any>(`/pull-requests/project/${projectId}`, { params }),
  getById: (id: string) => api.get<any>(`/pull-requests/${id}`),
  review: (id: string, data: { status: string; reviewNote?: string }) =>
    api.put(`/pull-requests/${id}/review`, data),
};

export const ratingsAPI = {
  rateContributor: (data: { receiverId: string; projectId: string; pullRequestId?: string; codeQuality: number; communication: number; timeliness: number; overall: number; comment?: string }) =>
    api.post("/ratings/contributor", data),
  getUserRatings: (userId: string) => api.get<any>(`/ratings/contributor/${userId}`),
  rateProject: (data: { projectId: string; ui: number; performance: number; codeQuality: number; overall: number; comment?: string }) =>
    api.post("/ratings/project", data),
  getProjectRatings: (projectId: string) => api.get<any>(`/ratings/project/${projectId}`),
};

export const resourcesAPI = {
  getForProject: (projectId: string, params?: { fileType?: string }) =>
    api.get<any[]>(`/projects/${projectId}/resources`, { params }),
  add: (projectId: string, data: { title: string; description?: string; fileUrl: string; fileType?: string }) =>
    api.post(`/projects/${projectId}/resources`, data),
  delete: (projectId: string, resourceId: string) =>
    api.delete(`/projects/${projectId}/resources/${resourceId}`),
};

export const announcementsAPI = {
  get: (projectId: string) => api.get<any[]>(`/projects/${projectId}/announcements`),
  create: (projectId: string, data: { title: string; content: string; audience?: string }) =>
    api.post(`/projects/${projectId}/announcements`, data),
  delete: (projectId: string, id: string) =>
    api.delete(`/projects/${projectId}/announcements/${id}`),
  markComplete: (projectId: string) =>
    api.post(`/projects/${projectId}/announcements/complete`),
  reopen: (projectId: string) =>
    api.post(`/projects/${projectId}/announcements/reopen`),
};

export default api;
