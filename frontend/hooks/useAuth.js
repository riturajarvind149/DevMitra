import { useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authAPI } from "@/lib/api";

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getCurrentUser();
      setUser(data);
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("buildr_token");
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get("token");
      if (urlToken) {
        localStorage.setItem("buildr_token", urlToken);
        params.delete("token");
        const newSearch = params.toString();
        const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : "");
        window.history.replaceState({}, document.title, newUrl);
      }
    }
    if (isLoading) fetchUser();
  }, [isLoading, fetchUser]);

  const login = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    window.location.href = `${apiBase.replace(/\/+$/, "")}/auth/github`;
  };

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("buildr_token");
      }
      await authAPI.logout();
      storeLogout();
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Refresh user from server (useful after profile updates)
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authAPI.getCurrentUser();
      setUser(data);
      return data;
    } catch {
      return null;
    }
  }, [setUser]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  };
}
