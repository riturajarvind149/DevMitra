"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  FolderIcon,
  PlusIcon,
  CompassIcon,
  BellIcon,
  ChatIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  UsersIcon,
  BookmarkIcon,
  ShieldIcon,
  ActivityIcon,
  BugIcon,
  GitPrIcon,
  BriefcaseIcon,
  TerminalIcon,
  CpuIcon,
} from "@/components/icons";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import LogoutConfirmModal from "./LogoutConfirmModal";
import SidebarMoreMenu from "./SidebarMoreMenu";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const [moreOpen, setMoreOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const moreRef = useRef(null);
  const hoverTimer = useRef(null);

  // Close More menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setHovered(true);
  };
  const handleMouseLeave = () => {
    hoverTimer.current = setTimeout(() => setHovered(false), 150);
  };

  const notifCount = qc.getQueryData(["notificationCount"]) ?? 0;
  const msgCount = qc.getQueryData(["messageUnreadCount"]) ?? 0;

  const nav = [
    { name: "Terminal Feed",  href: "/",               icon: TerminalIcon },
    { name: "My Projects",    href: "/my-projects",    icon: FolderIcon },
    { name: "New Project",    href: "/projects/new",   icon: PlusIcon },
    { name: "Explore Repos",  href: "/explore",        icon: CompassIcon },
    { name: "Opportunities",  href: "/opportunities",  icon: BriefcaseIcon },
    { name: "Connections",    href: "/connections",    icon: UsersIcon },
    { name: "Notifications",  href: "/notifications",  icon: BellIcon,       badge: notifCount },
    { name: "Messages",       href: "/messages",       icon: ChatIcon,       badge: msgCount },
    { name: "Workstation",    href: "/profile",        icon: UserIcon },
  ];

  const moreItems = [
    { name: "Settings",       href: "/settings",       icon: SettingsIcon },
    { name: "Activity Log",   href: "/activity",       icon: ActivityIcon },
    { name: "Bookmarks",      href: "/saved",          icon: BookmarkIcon },
    { name: "Repo Requests",  href: "/repo-requests",  icon: ShieldIcon },
    { name: "Bug Reports",    href: "/bug-reports",    icon: BugIcon },
    { name: "Pull Requests",  href: "/pull-requests",  icon: GitPrIcon },
    ...(user?.isAdmin ? [{ name: "Engine Metrics", href: "/admin", icon: CpuIcon }] : []),
  ];

  const active = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const expanded = hovered || moreOpen;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: expanded ? 230 : 64,
        transition: "width 180ms cubic-bezier(0.4,0,0.2,1)",
      }}
      className={`h-full surface-base flex flex-col overflow-hidden flex-shrink-0 z-30 ${
        expanded ? "shadow-2xl" : ""
      }`}
    >
      {/* Platform Logo */}
      <div className="h-14 flex items-center flex-shrink-0 px-3.5">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0 text-amber-500">
            <TerminalIcon className="h-5 w-5" />
          </div>
          <span
            className="text-sm font-mono font-bold text-primary tracking-wider whitespace-nowrap overflow-hidden"
            style={{
              opacity: expanded ? 1 : 0,
              maxWidth: expanded ? 150 : 0,
              transition: "opacity 120ms ease, max-width 180ms ease",
            }}
          >
            BUILDR
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden space-y-0.5">
        {nav.map(({ name, href, icon: Icon, badge }) => (
          <Link
            key={name}
            href={href}
            aria-label={name}
            title={!expanded ? name : undefined}
            className={`relative flex items-center h-10 rounded-sm mx-1.5 transition-colors ${
              active(href)
                ? "bg-amber-500/10 text-amber-500 font-bold"
                : "text-muted hover:bg-amber-500/5 hover:text-primary"
            }`}
            style={{
              paddingLeft: expanded ? 10 : 0,
              justifyContent: expanded ? "flex-start" : "center",
            }}
          >
            <span
              className="relative flex-shrink-0"
              style={{ minWidth: 36, display: "flex", justifyContent: "center" }}
            >
              <Icon className="h-4.5 w-4.5" />
              {!expanded && (badge ?? 0) > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </span>

            <span
              className="flex items-center justify-between flex-1 min-w-0 overflow-hidden"
              style={{
                opacity: expanded ? 1 : 0,
                maxWidth: expanded ? 170 : 0,
                transition: "opacity 120ms ease, max-width 180ms ease",
              }}
            >
              <span className="text-xs font-medium whitespace-nowrap font-sans">{name}</span>
              {(badge ?? 0) > 0 && (
                <span className="bg-amber-500 text-gray-950 text-[9px] font-mono font-bold rounded-[2px] min-w-[14px] h-3.5 flex items-center justify-center px-1 mr-1 flex-shrink-0">
                  {(badge ?? 0) > 99 ? "99+" : badge}
                </span>
              )}
            </span>
          </Link>
        ))}
      </nav>

      {/* Footer Strip: More Actions + User Identity */}
      <div className="py-2.5 flex-shrink-0 space-y-1">
        {/* More Actions Dropdown */}
        <div ref={moreRef} className="relative mx-1.5">
          <button
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More options"
            title={!expanded ? "More" : undefined}
            className={`w-full flex items-center h-10 rounded-sm transition-colors ${
              moreOpen
                ? "bg-amber-500/10 text-amber-500 font-bold"
                : "text-muted hover:bg-amber-500/5 hover:text-primary"
            }`}
            style={{
              paddingLeft: expanded ? 10 : 0,
              justifyContent: expanded ? "flex-start" : "center",
            }}
          >
            <span
              style={{ minWidth: 36, display: "flex", justifyContent: "center" }}
              className="flex-shrink-0"
            >
              <SettingsIcon className="h-4.5 w-4.5" />
            </span>
            <span
              className="text-xs font-medium whitespace-nowrap overflow-hidden font-sans"
              style={{
                opacity: expanded ? 1 : 0,
                maxWidth: expanded ? 150 : 0,
                transition: "opacity 120ms ease, max-width 180ms ease",
              }}
            >
              More Tools
            </span>
          </button>

          {moreOpen && (
            <SidebarMoreMenu
              items={moreItems}
              onClose={() => setMoreOpen(false)}
              onLogoutClick={() => setConfirmLogout(true)}
            />
          )}
        </div>

        {/* User Identity Row */}
        <div
          className="flex items-center h-10 mx-1.5 rounded-sm overflow-hidden"
          style={{
            justifyContent: expanded ? "flex-start" : "center",
            paddingLeft: expanded ? 4 : 0,
          }}
        >
          <Link
            href="/profile"
            title={!expanded ? user?.username : undefined}
            className="flex items-center gap-2 min-w-0 flex-1 px-1.5 py-1.5 rounded-sm hover:bg-amber-500/5 transition"
          >
            {user?.avatarUrl && !user.avatarUrl.startsWith("data:") ? (
              <Image
                src={user.avatarUrl}
                alt={`${user.username}'s avatar`}
                width={24}
                height={24}
                className="w-6 h-6 rounded-sm object-cover border border-subtle flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-sm surface-raised border border-subtle flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-mono font-bold text-amber-500">
                  {user?.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span
              className="text-xs font-medium text-secondary whitespace-nowrap overflow-hidden truncate"
              style={{
                opacity: expanded ? 1 : 0,
                maxWidth: expanded ? 110 : 0,
                transition: "opacity 120ms ease, max-width 180ms ease",
              }}
            >
              {user?.username}
            </span>
          </Link>
          {expanded && (
            <button
              onClick={() => setConfirmLogout(true)}
              aria-label="Sign out"
              className="text-muted hover:text-red-400 transition p-1 mr-1"
              title="Sign out"
            >
              <LogOutIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {confirmLogout && (
        <LogoutConfirmModal
          onConfirm={logout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  );
}
