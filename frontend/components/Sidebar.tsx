"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Home, FolderGit2, Plus, Compass, Bell, MessageSquare, User,
  Settings, LogOut, Network, MoreHorizontal, Bookmark, KeyRound,
  Activity, BarChart2, X, AlertTriangle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [moreOpen, setMoreOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close More menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced hover — small delay prevents flicker when moving mouse between items
  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => setHovered(false), 150);
  };

  // Read badge counts from shared cache (TopBar owns polling)
  const notifCount: number = (qc.getQueryData(["notificationCount"]) as number) ?? 0;
  const msgCount: number   = (qc.getQueryData(["messageUnreadCount"]) as number) ?? 0;

  const nav = [
    { name: "Home",          href: "/",              icon: Home },
    { name: "My Projects",   href: "/my-projects",   icon: FolderGit2 },
    { name: "New Project",   href: "/projects/new",  icon: Plus },
    { name: "Explore",       href: "/explore",       icon: Compass },
    { name: "Connections",   href: "/connections",   icon: Network },
    { name: "Notifications", href: "/notifications", icon: Bell,          badge: notifCount },
    { name: "Messages",      href: "/messages",      icon: MessageSquare, badge: msgCount },
    { name: "Profile",       href: "/profile",       icon: User },
  ];

  const moreItems = [
    { name: "Settings",       href: "/settings",      icon: Settings },
    { name: "Your Activity",  href: "/activity",      icon: Activity },
    { name: "Saved Projects", href: "/saved",         icon: Bookmark },
    { name: "Repo Requests",  href: "/repo-requests", icon: KeyRound },
    ...(user?.isAdmin ? [{ name: "Analytics", href: "/admin", icon: BarChart2 }] : []),
  ];

  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  // Width: 64px (icons only) → 240px (expanded) on hover
  const expanded = hovered || moreOpen;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: expanded ? 240 : 64, transition: "width 220ms cubic-bezier(0.4,0,0.2,1)" }}
      className="h-full bg-gray-900 border-r border-gray-800 flex flex-col overflow-hidden flex-shrink-0 z-30"
    >
      {/* Logo */}
      <div className="h-16 flex items-center flex-shrink-0 border-b border-gray-800 px-3.5">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <FolderGit2 className="h-5 w-5 text-white" />
          </div>
          <span
            className="text-base font-bold text-white whitespace-nowrap overflow-hidden"
            style={{
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 160 : 0,
              transition: "opacity 180ms ease, max-width 220ms ease",
            }}
          >
            DevMitra
          </span>
        </Link>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden">
        {nav.map(({ name, href, icon: Icon, badge }) => (
          <Link
            key={name}
            href={href}
            title={!expanded ? name : undefined}
            className={`relative flex items-center h-11 rounded-xl mx-1.5 my-0.5 transition-colors ${
              active(href)
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            style={{ paddingLeft: expanded ? 12 : 0, justifyContent: expanded ? "flex-start" : "center" }}
          >
            <span className="relative flex-shrink-0" style={{ minWidth: 40, display: "flex", justifyContent: "center" }}>
              <Icon className="h-[18px] w-[18px]" />
              {/* Badge dot — shown in icon-only mode */}
              {!expanded && (badge ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </span>

            {/* Label + badge number — shown when expanded */}
            <span
              className="flex items-center justify-between flex-1 min-w-0 overflow-hidden"
              style={{
                opacity: expanded ? 1 : 0,
                maxWidth: expanded ? 180 : 0,
                transition: "opacity 150ms ease 50ms, max-width 220ms ease",
              }}
            >
              <span className="text-sm font-medium whitespace-nowrap">{name}</span>
              {(badge ?? 0) > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 mr-2 flex-shrink-0">
                  {(badge ?? 0) > 99 ? "99+" : badge}
                </span>
              )}
            </span>
          </Link>
        ))}
      </nav>

      {/* Bottom: More + user */}
      <div className="py-2 border-t border-gray-800 flex-shrink-0">
        {/* More button */}
        <div ref={moreRef} className="relative mx-1.5">
          <button
            onClick={() => setMoreOpen(v => !v)}
            title={!expanded ? "More" : undefined}
            className={`w-full flex items-center h-11 rounded-xl transition-colors ${
              moreOpen ? "bg-gray-800 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            style={{ paddingLeft: expanded ? 12 : 0, justifyContent: expanded ? "flex-start" : "center" }}
          >
            <span style={{ minWidth: 40, display: "flex", justifyContent: "center" }} className="flex-shrink-0">
              <MoreHorizontal className="h-[18px] w-[18px]" />
            </span>
            <span
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
              style={{
                opacity: expanded ? 1 : 0,
                maxWidth: expanded ? 160 : 0,
                transition: "opacity 150ms ease 50ms, max-width 220ms ease",
              }}
            >
              More
            </span>
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
                <Link key={name} href={href} onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
                    active(href) ? "bg-indigo-600/20 text-indigo-400" : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}>
                  <Icon className="h-4 w-4" />{name}
                </Link>
              ))}
              <div className="border-t border-gray-700">
                <button onClick={() => { setMoreOpen(false); setConfirmLogout(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition">
                  <LogOut className="h-4 w-4" />Log Out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User row */}
        <div
          className="flex items-center h-11 mx-1.5 rounded-xl overflow-hidden"
          style={{ justifyContent: expanded ? "flex-start" : "center", paddingLeft: expanded ? 4 : 0 }}
        >
          <Link href="/profile" title={!expanded ? user?.username : undefined}
            className="flex items-center gap-2.5 min-w-0 flex-1 px-2 py-1 rounded-xl hover:bg-gray-800 transition">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span
              className="text-xs font-medium text-gray-400 whitespace-nowrap overflow-hidden"
              style={{
                opacity: expanded ? 1 : 0,
                maxWidth: expanded ? 120 : 0,
                transition: "opacity 150ms ease 50ms, max-width 220ms ease",
              }}
            >
              {user?.username}
            </span>
          </Link>
          {expanded && (
            <button onClick={() => setConfirmLogout(true)} className="text-gray-600 hover:text-red-400 transition flex-shrink-0 p-1.5 mr-1" title="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Logout Confirmation Modal ────────────────────────────────────── */}
      {confirmLogout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <LogOut className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Sign Out?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">Are you sure you want to sign out of DevMitra?</p>
            <div className="flex gap-3">
              <button onClick={logout}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition">
                Sign Out
              </button>
              <button onClick={() => setConfirmLogout(false)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
