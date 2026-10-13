"use client";

import { useAuth } from "@/hooks/useAuth";
import { SearchIcon, BellIcon, ChatIcon, SunIcon, MoonIcon } from "@/components/icons";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsAPI, messagesAPI } from "@/lib/api";
import { useTheme } from "next-themes";
import { useToast } from "@/context/ToastContext";
import Link from "next/link";
import Image from "next/image";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ["notificationCount"],
    queryFn: async () => {
      const { data } = await notificationsAPI.getAll({ limit: 1 });
      return data.unreadCount;
    },
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    staleTime: 45000,
  });

  const { data: msgData } = useQuery({
    queryKey: ["messageUnreadCount"],
    queryFn: async () => {
      const { data } = await messagesAPI.getUnreadCount();
      return data.unreadCount;
    },
    refetchInterval: 45000,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const isExplore = typeof window !== "undefined" && window.location.pathname.startsWith("/explore");
      const tabParam = isExplore ? "" : "&tab=projects";
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}${tabParam}`);
    }
  };

  const handleNotifClick = () => {
    qc.setQueryData(["notificationCount"], 0);
    notificationsAPI.markAllAsRead().then(() => {
      qc.invalidateQueries({ queryKey: ["notificationCount"] });
    });
  };

  const currentTheme = mounted ? (resolvedTheme || theme || "dark") : "dark";

  const toggleTheme = () => {
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    toast.info(`Switched to ${nextTheme === "dark" ? "Dark Slate" : "Technical Light"} theme`, "Appearance");
  };

  return (
    <div className="h-14 flex-shrink-0 surface-base flex items-center px-4 sm:px-6 gap-3 z-20">
      {/* Search Input */}
      <div className="flex-1 max-w-md">
        <form onSubmit={handleSearch} className="relative w-full">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            aria-label="Search repositories, bugs, and engineers"
            placeholder="Search projects, tags, engineers... [Enter]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full surface-input text-primary text-xs pl-8 pr-3 py-1.5 rounded-sm border border-subtle focus:border-amber-500 focus:outline-none transition-colors placeholder:text-muted font-mono"
          />
        </form>
      </div>

      <div className="flex-1" />

      {/* Action Strip: Notifications, Messages, Theme Toggle, Profile */}
      <div className="flex items-center gap-1.5">
        {/* Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme mode"
          className="p-1.5 text-muted hover:text-amber-500 hover:surface-raised rounded-sm border border-transparent hover:border-subtle transition cursor-pointer"
          title={currentTheme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme"}
        >
          {currentTheme === "dark" ? (
            <SunIcon className="h-4 w-4" />
          ) : (
            <MoonIcon className="h-4 w-4" />
          )}
        </button>

        {/* Notifications Icon */}
        <Link
          href="/notifications"
          aria-label="Notifications"
          onClick={handleNotifClick}
          className="relative p-1.5 text-muted hover:text-primary hover:surface-raised rounded-sm border border-transparent hover:border-subtle transition"
        >
          <BellIcon className="h-4 w-4" />
          {(notifData ?? 0) > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
          )}
        </Link>

        {/* Messages Icon */}
        <Link
          href="/messages"
          aria-label="Messages"
          className="relative p-1.5 text-muted hover:text-primary hover:surface-raised rounded-sm border border-transparent hover:border-subtle transition"
        >
          <ChatIcon className="h-4 w-4" />
          {(msgData ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-amber-500 text-gray-950 text-[9px] font-mono font-bold rounded-[2px] min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
              {(msgData ?? 0) > 99 ? "99+" : msgData}
            </span>
          )}
        </Link>

        {/* User Status Chip */}
        <Link
          href="/profile"
          className="flex items-center gap-2 ml-2 pl-2 border-l border-subtle hover:opacity-85 transition"
        >
          {user?.avatarUrl && !user.avatarUrl.startsWith("data:") ? (
            <Image
              src={user.avatarUrl}
              alt={`${user.username}'s avatar`}
              width={26}
              height={26}
              className="w-6.5 h-6.5 rounded-sm object-cover border border-subtle"
            />
          ) : (
            <div className="w-6.5 h-6.5 rounded-sm surface-raised border border-subtle flex items-center justify-center">
              <span className="text-[11px] font-mono font-bold text-amber-500">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-primary leading-none truncate max-w-[100px]">
              {user?.username}
            </p>
            <span className="text-[10px] font-mono text-emerald-500 tracking-tight">Active</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
