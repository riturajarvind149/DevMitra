import axios from "axios";
import type {
  User,
  Project,
  ProjectMember,
  AccessRequest,
  Activity,
  ProjectStats,
  PlatformStats,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth API
export const authAPI = {
  getCurrentUser: () => api.get<User>("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

// Users API
export const usersAPI = {
  getAll: () => api.get<User[]>("/users"),
  getById: (id: string) => api.get<User>(`/users/${id}`),
  getUserProjects: (id: string) => api.get<Project[]>(`/users/${id}/projects`),
  getUserMemberships: (id: string) => api.get<any[]>(`/users/${id}/memberships`),
  update: (id: string, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Projects API
export const projectsAPI = {
  getAll: (params?: {
    search?: string;
    owner?: string;
    limit?: number;
    offset?: number;
  }) => api.get<{ projects: Project[]; pagination: any }>("/projects", { params }),
  getMyProjects: () => api.get<Project[]>("/projects/my"),
  getById: (id: string) => api.get<Project>(`/projects/${id}`),
  getStats: (id: string) => api.get<ProjectStats>(`/projects/${id}/stats`),
  create: (data: {
    title: string;
    description: string;
    deployedUrl: string;
    githubRepoUrl?: string;
    tags?: string[];
  }) => api.post<Project>("/projects", data),
  update: (id: string, data: Partial<Project>) =>
    api.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Project Members API
export const projectMembersAPI = {
  getMembers: (projectId: string) =>
    api.get<ProjectMember[]>(`/projects/${projectId}/members`),
  checkMembership: (projectId: string) =>
    api.get<{ isMember: boolean; role: string | null; joinedAt?: string }>(
      `/projects/${projectId}/membership`
    ),
  removeMember: (projectId: string, userId: string) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
};

// Access Requests API
export const accessRequestsAPI = {
  getMine: (status?: string) =>
    api.get<AccessRequest[]>("/access-requests/mine", {
      params: status ? { status } : {},
    }),
  getIncoming: (status?: string) =>
    api.get<AccessRequest[]>("/access-requests/incoming", {
      params: status ? { status } : {},
    }),
  create: (data: { projectId: string; reason: string; suggestion: string }) =>
    api.post<AccessRequest>("/access-requests", data),
  approve: (id: string) =>
    api.put<AccessRequest>(`/access-requests/${id}/approve`),
  reject: (id: string) =>
    api.put<AccessRequest>(`/access-requests/${id}/reject`),
};

// Activities API
export const activitiesAPI = {
  getProjectActivities: (
    projectId: string,
    params?: { limit?: number; offset?: number }
  ) =>
    api.get<{ activities: Activity[]; pagination: any }>(
      `/projects/${projectId}/activities`,
      { params }
    ),
  getUserActivities: (
    userId: string,
    params?: { limit?: number; offset?: number }
  ) =>
    api.get<{ activities: Activity[]; pagination: any }>(
      `/users/${userId}/activities`,
      { params }
    ),
};

// Stats API
export const statsAPI = {
  getPlatformStats: () => api.get<PlatformStats>("/stats"),
};

export default api;
