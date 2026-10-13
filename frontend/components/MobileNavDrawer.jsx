"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TerminalIcon, CompassIcon, ChatIcon, UserIcon } from "@/components/icons";

const NAV_ITEMS = [
  { name: "Terminal", href: "/",         icon: TerminalIcon },
  { name: "Explore",  href: "/explore",  icon: CompassIcon },
  { name: "Messages", href: "/messages", icon: ChatIcon },
  { name: "Profile",  href: "/profile",  icon: UserIcon },
];

export default function MobileNavDrawer() {
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 surface-sidebar border-t border-subtle flex items-center justify-around px-2 py-1.5 md:hidden font-mono">
      {NAV_ITEMS.map(({ name, href, icon: Icon }) => (
        <Link
          key={name}
          href={href}
          aria-label={name}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-sm transition ${
            pathname === href
              ? "text-amber-500 surface-raised font-bold"
              : "text-muted hover:text-primary"
          }`}
        >
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          <span className="text-[10px] tracking-tight">{name}</span>
        </Link>
      ))}
    </div>
  );
}
