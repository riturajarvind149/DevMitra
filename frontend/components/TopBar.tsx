"use client";

import { useAuth } from "@/hooks/useAuth";
import { Search, Bell, MessageSquare } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { notificationsAPI, messagesAPI } from "@/lib/api";
import Link from "next/link";

export default function TopBar() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: notifData } = useQuery({
    queryKey: ["notificationCount"],
    queryFn: async () => {
      const { data } = await notificationsAPI.getAll({ limit: 1 });
      return data.unreadCount;
    },
    refetchInterval: 60000,   // poll every 60s (was 30s)
    staleTime: 30000,         // don't re-fetch on remount if data < 30s old
  });

  const { data: msgData } = useQuery({
    queryKey: ["messageUnreadCount"],
    queryFn: async () => {
      const { data } = await messagesAPI.getUnreadCount();
      return data.unreadCount;
    },
    refetchInterval: 30000,   // poll every 30s (was 30s — keep same)
    staleTime: 15000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    // Fixed height, full width of parent column, does NOT use position:fixed
    <div className="h-16 flex-shrink-0 bg-gray-900 border-b border-gray-800 flex items-center px-6 z-20">
      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, developers, topics…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-white text-sm pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-indigo-500 focus:outline-none placeholder-gray-500"
          />
        </div>
      </form>

      {/* Right icons */}
      <div className="flex items-center gap-1 ml-auto">
        <Link
          href="/notifications"
          className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
        >
          <Bell className="h-5 w-5" />
          {(notifData ?? 0) > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </Link>

        <Link
          href="/messages"
          className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition"
        >
          <MessageSquare className="h-5 w-5" />
          {(msgData ?? 0) > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {(msgData ?? 0) > 99 ? "99+" : msgData}
            </span>
          )}
        </Link>

        {/* User */}
        <Link href="/profile" className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-700">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.username} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{user?.username?.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-white leading-none">{user?.username}</p>
            <p className="text-xs text-green-400 mt-0.5">Online</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
