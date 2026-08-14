"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, MessageSquare, User } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home",     href: "/",         icon: Home },
  { name: "Explore",  href: "/explore",  icon: Compass },
  { name: "Messages", href: "/messages", icon: MessageSquare },
  { name: "Profile",  href: "/profile",  icon: User },
];

export default function MobileNavDrawer() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800
                    flex items-center justify-around px-2 py-2 lg:hidden">
      {NAV_ITEMS.map(({ name, href, icon: Icon }) => (
        <Link
          key={name}
          href={href}
          aria-label={name}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition
            ${pathname === href ? "text-indigo-400" : "text-gray-500 hover:text-white"}`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px]">{name}</span>
        </Link>
      ))}
    </div>
  );
}

