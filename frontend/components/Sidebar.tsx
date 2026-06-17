"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Home, FolderGit2, Plus, Compass, Bell, MessageSquare, User, Settings, LogOut, Users, UserSearch, Network, Bookmark, Briefcase, KeyRound, Activity, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { notificationsAPI, messagesAPI } from "@/lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const { data: notifCount } = useQuery({
    queryKey: ["notificationCount"],
    queryFn: async () => { const { data } = await notificationsAPI.getAll({ limit: 1 }); return data.unreadCount; },
    refetchInterval: 30000,
  });
  const { data: msgCount } = useQuery({
    queryKey: ["messageUnreadCount"],
    queryFn: async () => { const { data } = await messagesAPI.getUnreadCount(); return data.unreadCount; },
    refetchInterval: 30000,
  });

  const nav = [
    { name: "Home",          href: "/",              icon: Home },
    { name: "My Projects",   href: "/my-projects",   icon: FolderGit2 },
    { name: "New Project",   href: "/projects/new",  icon: Plus },
    { name: "Explore",       href: "/explore",       icon: Compass },
    { name: "Developers",    href: "/developers",    icon: UserSearch },
    { name: "Opportunities", href: "/opportunities", icon: Briefcase },
    { name: "Connections",   href: "/connections",   icon: Network },
    { name: "Saved",         href: "/saved",         icon: Bookmark },
    { name: "Repo Requests", href: "/repo-requests", icon: KeyRound },
    { name: "Activity",      href: "/activity",      icon: Activity },
    { name: "Notifications", href: "/notifications", icon: Bell,          badge: notifCount ?? 0 },
    { name: "Messages",      href: "/messages",      icon: MessageSquare, badge: msgCount ?? 0 },
  ];
  const bottom = [
    { name: "Profile",    href: "/profile",  icon: User },
    { name: "Analytics",  href: "/admin",    icon: BarChart2 },
    { name: "Settings",   href: "/settings", icon: Settings },
  ];

  const active = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="h-full bg-gray-900 border-r border-gray-800 flex flex-col">
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
              <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
              <span className="text-sm font-medium">{name}</span>
            </div>
            {badge != null && badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                {badge > 99 ? "99+" : badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-3 border-t border-gray-800 space-y-0.5 flex-shrink-0">
        {bottom.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
              active(href) ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
          >
            <Icon className="h-[18px] w-[18px]" />
            <span className="text-sm font-medium">{name}</span>
          </Link>
        ))}
        {/* User row */}
        <div className="flex items-center justify-between px-3 py-2.5 mt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">{user?.username?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <span className="text-xs font-medium text-gray-400 truncate">{user?.username}</span>
          </div>
          <button onClick={logout} className="text-gray-600 hover:text-red-400 transition flex-shrink-0" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
