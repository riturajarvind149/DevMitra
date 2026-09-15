import axios from "axios";
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export const authAPI = {
  getCurrentUser: () => api.get("/auth/me"),
  logout: () => api.post("/auth/logout"),
};

export const usersAPI = {
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  getUserProjects: (id) => api.get(`/users/${id}/projects`),
  getUserMemberships: (id) => api.get(`/users/${id}/memberships`),
  getUserContributing: (id) => api.get(`/users/${id}/contributing`),
  getUserLikedProjects: (id) => api.get(`/users/${id}/liked-projects`),
  getUserComments: (id) => api.get(`/users/${id}/comments`),
  getUserApplications: (id) => api.get(`/users/${id}/applications`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const projectsAPI = {
  getAll: (params) =>
    api.get("/projects", { params }),
  getMyProjects: () => api.get("/projects/my"),
  getById: (id) => api.get(`/projects/${id}`),
  getStats: (id) => api.get(`/projects/${id}/stats`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const projectMembersAPI = {
  getMembers: (projectId) => api.get(`/projects/${projectId}/members`),
  checkMembership: (projectId) =>
    api.get(`/projects/${projectId}/membership`),
  removeMember: (projectId, userId) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
  addMember: (projectId, userId) =>
    api.post(`/projects/${projectId}/members`, { userId }),
};

export const accessRequestsAPI = {
  getMine: (status) =>
    api.get("/access-requests/mine", { params: status ? { status } : {} }),
  getIncoming: (status) =>
    api.get("/access-requests/incoming", { params: status ? { status } : {} }),
  checkMyRequest: (projectId) =>
    api.get(`/access-requests/check/${projectId}`),
  create: (data) =>
    api.post("/access-requests", data),
  approve: (id) => api.put(`/access-requests/${id}/approve`),
  reject: (id) => api.put(`/access-requests/${id}/reject`),
};

export const activitiesAPI = {
  getProjectActivities: (projectId, params) =>
    api.get(`/projects/${projectId}/activities`, { params }),
  getUserActivities: (userId, params) =>
    api.get(`/users/${userId}/activities`, { params }),
};

export const statsAPI = {
  getPlatformStats: () => api.get("/stats"),
};

export const storiesAPI = {
  getActive: () => api.get("/stories"),
  create: (data) =>
    api.post("/stories", data),
  delete: (id) => api.delete(`/stories/${id}`),
  recordView: (id) => api.post(`/stories/${id}/view`),
  getViewers: (id) => api.get(`/stories/${id}/viewers`),
  toggleLike: (id) => api.post(`/stories/${id}/like`),
  getLikeStatus: (id) => api.get(`/stories/${id}/like`),
};

export const notificationsAPI = {
  getAll: (params) =>
    api.get("/notifications", { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put("/notifications/read-all"),
};

export const messagesAPI = {
  getConversations: () => api.get("/messages/conversations"),
  getMessages: (conversationId, params) =>
    api.get(`/messages/${conversationId}`, { params }),
  send: (data) => api.post("/messages/send", data),
  getUnreadCount: () => api.get("/messages/unread-count"),
};

export const connectionsAPI = {
  getAll: () => api.get("/connections"),
  getRequests: () => api.get("/connections/requests"),
  getStatus: (userId) =>
    api.get(`/connections/status/${userId}`),
  getCounts: (userId) =>
    api.get(`/connections/counts/${userId}`),
  send: (userId) => api.post(`/connections/request/${userId}`),
  accept: (requestId) => api.put(`/connections/accept/${requestId}`),
  reject: (requestId) => api.put(`/connections/reject/${requestId}`),
  remove: (userId) => api.delete(`/connections/${userId}`),
};

export const likesAPI = {
  getLikes: (projectId) => api.get(`/projects/${projectId}/likes`),
  like: (projectId) => api.post(`/projects/${projectId}/likes`),
  unlike: (projectId) => api.delete(`/projects/${projectId}/likes`),
};

export const savesAPI = {
  getStatus: (projectId) => api.get(`/projects/${projectId}/save/status`),
  save: (projectId) => api.post(`/projects/${projectId}/save`),
  unsave: (projectId) => api.delete(`/projects/${projectId}/save`),
  getSaved: () => api.get("/saved-projects"),
};

export const commentsAPI = {
  getComments: (projectId) => api.get(`/projects/${projectId}/comments`),
  addComment: (projectId, data) =>
    api.post(`/projects/${projectId}/comments`, data),
  updateComment: (id, content) => api.put(`/comments/${id}`, { content }),
  deleteComment: (id) => api.delete(`/comments/${id}`),
};

export const repoRequestsAPI = {
  create: (data) => api.post("/repo-requests", data),
  getMine: () => api.get("/repo-requests/mine"),
  getIncoming: (status) => api.get("/repo-requests/incoming", { params: status ? { status } : {} }),
  check: (projectId) => api.get(`/repo-requests/check/${projectId}`),
  approve: (id) => api.put(`/repo-requests/${id}/approve`),
  reject: (id) => api.put(`/repo-requests/${id}/reject`),
};

export const opportunitiesAPI = {
  getAll: (params) =>
    api.get("/opportunities", { params }),
  getMine: () => api.get("/opportunities/mine"),
  getById: (id) => api.get(`/opportunities/${id}`),
  checkApplied: (id) => api.get(`/opportunities/${id}/check`),
  create: (data) => api.post("/opportunities", data),
  update: (id, data) => api.put(`/opportunities/${id}`, data),
  delete: (id) => api.delete(`/opportunities/${id}`),
  apply: (id, data) =>
    api.post(`/opportunities/${id}/apply`, data),
  approveApp: (id, appId) => api.put(`/opportunities/${id}/applications/${appId}/approve`),
  rejectApp: (id, appId) => api.put(`/opportunities/${id}/applications/${appId}/reject`),
  getAppComments: (id, appId) => api.get(`/opportunities/${id}/applications/${appId}/comments`),
  addAppComment: (id, appId, content) =>
    api.post(`/opportunities/${id}/applications/${appId}/comments`, { content }),
};

export const developersAPI = {
  getAll: (params) =>
    api.get("/developers", { params }),
  getSuggested: () => api.get("/developers/suggested"),
  getActivityFeed: (params) =>
    api.get("/developers/feed", { params }),
};

export const aiAPI = {
  getProfile: () => api.get("/ai/profile"),
  updateProfile: (data) =>
    api.put("/ai/profile", data),
  getSuggestedDevelopers: () => api.get("/ai/suggested-developers"),
  getSuggestedProjects: () => api.get("/ai/suggested-projects"),
};

export const profileDataAPI = {
  getMyProfile: () => api.get("/profile-data/me"),
  getPublicProfile: (userId) => api.get(`/profile-data/${userId}`),
};

export const bugReportsAPI = {
  create: (data) =>
    api.post("/bug-reports", data),
  getMine: () => api.get("/bug-reports/mine"),
  getForProject: (projectId, params) =>
    api.get(`/bug-reports/project/${projectId}`, { params }),
  getById: (id) => api.get(`/bug-reports/${id}`),
  update: (id, data) =>
    api.put(`/bug-reports/${id}`, data),
  delete: (id) => api.delete(`/bug-reports/${id}`),
  getComments: (id) => api.get(`/bug-reports/${id}/comments`),
  addComment: (id, content) => api.post(`/bug-reports/${id}/comments`, { content }),
};

export const pullRequestsAPI = {
  create: (data) =>
    api.post("/pull-requests", data),
  getMine: () => api.get("/pull-requests/mine"),
  getIncoming: (params) => api.get("/pull-requests/incoming", { params }),
  getForProject: (projectId, params) =>
    api.get(`/pull-requests/project/${projectId}`, { params }),
  getById: (id) => api.get(`/pull-requests/${id}`),
  review: (id, data) =>
    api.put(`/pull-requests/${id}/review`, data),
};

export const ratingsAPI = {
  rateContributor: (data) =>
    api.post("/ratings/contributor", data),
  getUserRatings: (userId) => api.get(`/ratings/contributor/${userId}`),
  rateProject: (data) =>
    api.post("/ratings/project", data),
  getProjectRatings: (projectId) => api.get(`/ratings/project/${projectId}`),
};

export const resourcesAPI = {
  getForProject: (projectId, params) =>
    api.get(`/projects/${projectId}/resources`, { params }),
  add: (projectId, data) =>
    api.post(`/projects/${projectId}/resources`, data),
  delete: (projectId, resourceId) =>
    api.delete(`/projects/${projectId}/resources/${resourceId}`),
};

export const announcementsAPI = {
  get: (projectId) => api.get(`/projects/${projectId}/announcements`),
  create: (projectId, data) =>
    api.post(`/projects/${projectId}/announcements`, data),
  delete: (projectId, id) =>
    api.delete(`/projects/${projectId}/announcements/${id}`),
  markComplete: (projectId) =>
    api.post(`/projects/${projectId}/announcements/complete`),
  reopen: (projectId) =>
    api.post(`/projects/${projectId}/announcements/reopen`),
};

export const mentorAPI = {
  analyze: (githubUsername) => api.post("/ai-mentor/analyze", { githubUsername }),
  getAnalysis: (id) => api.get(`/ai-mentor/analysis/${id}`),
  getMine: () => api.get("/ai-mentor/mine"),
  getHistory: (userId) => api.get(`/ai-mentor/history/${userId}`),
  completeTask: (taskId) => api.post(`/ai-mentor/mentor-task/${taskId}/complete`),
  deleteAnalysis: (id) => api.delete(`/ai-mentor/analysis/${id}`),
};

export const mentorChatAPI = {
  createSession: (analysisId) =>
    api.post("/ai-mentor/chat/session", { analysisId }),
  listSessions: () =>
    api.get("/ai-mentor/chat/sessions"),
  getSession: (id) =>
    api.get(`/ai-mentor/chat/session/${id}`),
  deleteSession: (id) =>
    api.delete(`/ai-mentor/chat/session/${id}`),
  sendFeedback: (payload) =>
    api.post("/ai-mentor/chat/feedback", payload),
  /**
   * Send a message and receive streamed SSE response.
   * Uses native fetch (axios doesn't support SSE streaming).
   * Returns an async generator that yields text chunks.
   */
  sendMessage: async function* (sessionId, content) {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
    const response = await fetch(`${API_BASE}/ai-mentor/chat/session/${sessionId}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: "Chat request failed" }));
      throw new Error(err.message || "Chat request failed");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response stream");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "chunk") {
            yield { type: "chunk", text: parsed.text };
          } else if (parsed.type === "done") {
            yield { type: "done", fullText: parsed.fullText };
          } else if (parsed.type === "error") {
            yield { type: "error", message: parsed.message };
          }
        } catch {
          // Ignore malformed SSE lines
        }
      }
    }
  },
};

export default api;
