"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon, LogOutIcon } from "@/components/icons";

export default function SidebarMoreMenu({ items, onClose, onLogoutClick }) {
  const pathname = usePathname();

  const active = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <div className="absolute bottom-full left-0 mb-2 w-56 surface-card border border-subtle rounded-sm overflow-hidden z-50">
      <div className="flex items-center justify-between px-3 py-2 border-b border-subtle surface-sidebar">
        <span className="text-[10px] font-mono font-semibold text-muted uppercase tracking-wider">
          Developer Tools
        </span>
        <button
          onClick={onClose}
          aria-label="Close menu"
          className="text-muted hover:text-primary transition p-0.5"
        >
          <CloseIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="py-1">
        {items.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-2 text-xs transition ${
              active(href)
                ? "surface-raised text-amber-500 border-l-2 border-amber-500 font-bold"
                : "text-secondary hover:surface-raised hover:text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
            <span className="font-sans">{name}</span>
          </Link>
        ))}
      </div>

      <div className="border-t border-subtle p-1">
        <button
          onClick={() => {
            onClose();
            onLogoutClick();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-950/20 transition rounded-[2px]"
        >
          <LogOutIcon className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="font-sans font-medium">Log Out</span>
        </button>
      </div>
    </div>
  );
}
