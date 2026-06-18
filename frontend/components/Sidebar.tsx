"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Home, FolderGit2, Plus, Compass, Bell, MessageSquare, User,
  Settings, LogOut, Network, MoreHorizontal, Bookmark, KeyRound,
  Activity, BarChart2, X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close "More" when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Read badge counts from the shared React Query cache
  // TopBar owns the polling — Sidebar just reads the cached values
  const notifCount: number = qc.getQueryData(["notificationCount"]) as number ?? 0;
  const msgCount: number   = qc.getQueryData(["messageUnreadCount"]) as number ?? 0;

  // Main nav — clean, not overcrowded
  const nav = [
    { name: "Home",          href: "/",              icon: Home },
    { name: "My Projects",   href: "/my-projects",   icon: FolderGit2 },
    { name: "New Project",   href: "/projects/new",  icon: Plus },
    { name: "Explore",       href: "/explore",       icon: Compass },
    { name: "Connections",   href: "/connections",   icon: Network },
    { name: "Notifications", href: "/notifications", icon: Bell,          badge: notifCount ?? 0 },
    { name: "Messages",      href: "/messages",      icon: MessageSquare, badge: msgCount ?? 0 },
    { name: "Profile",       href: "/profile",       icon: User },
  ];

  // "More" menu items
  const moreItems = [
    { name: "Settings",        href: "/settings",      icon: Settings },
    { name: "Your Activity",   href: "/activity",      icon: Activity },
    { name: "Saved Projects",  href: "/saved",         icon: Bookmark },
    { name: "Repo Requests",   href: "/repo-requests", icon: KeyRound },
    // Analytics only visible to admins
    ...(user?.isAdmin ? [{ name: "Analytics", href: "/admin", icon: BarChart2 }] : []),
  ];

  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col relative">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-800 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <FolderGit2 className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">DevMitra</span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {nav.map(({ name, href, icon: Icon, badge }) => (
          <Link
            key={name}
            href={href}
            className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
              active(href) ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-[18px] w-[18px]" />
              <span className="text-sm font-medium">{name}</span>
            </div>
            {(badge ?? 0) > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {(badge ?? 0) > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom: More + User */}
      <div className="px-3 py-3 border-t border-gray-800 flex-shrink-0 space-y-0.5">
        {/* More button */}
        <div ref={moreRef} className="relative">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              moreOpen ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <MoreHorizontal className="h-[18px] w-[18px]" />
            <span className="text-sm font-medium">More</span>
          </button>

          {/* Floating More menu — opens upward */}
          {moreOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">More</span>
                <button onClick={() => setMoreOpen(false)} className="text-gray-500 hover:text-white transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {moreItems.map(({ name, href, icon: Icon }) => (
                <Link
                  key={name}
                  href={href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
                    active(href)
                      ? "bg-indigo-600/20 text-indigo-400"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {name}
                </Link>
              ))}
              <div className="border-t border-gray-700">
                <button
                  onClick={() => { setMoreOpen(false); logout(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User row */}
        <div className="flex items-center justify-between px-3 py-2.5">
          <Link href="/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="text-xs font-medium text-gray-400 truncate">{user?.username}</span>
          </Link>
          <button
            onClick={logout}
            className="text-gray-600 hover:text-red-400 transition flex-shrink-0 ml-2"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
