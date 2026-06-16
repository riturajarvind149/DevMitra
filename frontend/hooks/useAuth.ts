import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { authAPI } from "@/lib/api";

export function useAuth() {
  const { user, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await authAPI.getCurrentUser();
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (isLoading) {
      fetchUser();
    }
  }, [isLoading, setUser, setLoading]);

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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
