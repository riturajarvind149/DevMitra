"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, LogOut } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarMoreMenuProps {
  items: MenuItem[];
  onClose: () => void;
  onLogoutClick: () => void;
}

export default function SidebarMoreMenu({ items, onClose, onLogoutClick }: SidebarMoreMenuProps) {
  const pathname = usePathname();

  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="absolute bottom-full left-0 mb-2 w-56 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">More</span>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="text-gray-500 hover:text-white transition"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {items.map(({ name, href, icon: Icon }) => (
        <Link
          key={name}
          href={href}
          onClick={onClose}
          className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
            active(href)
              ? "bg-indigo-600/20 text-indigo-400"
              : "text-gray-300 hover:bg-gray-700 hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {name}
        </Link>
      ))}
      <div className="border-t border-gray-700">
        <button
          onClick={() => { onClose(); onLogoutClick(); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Log Out
        </button>
      </div>
    </div>
  );
}
