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
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading]);

  useEffect(() => {
    if (isLoading) fetchUser();
  }, [isLoading, fetchUser]);

  const login = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/github`;
  };

  const logout = async () => {
    try {
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
