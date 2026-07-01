"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Bell, MessageSquare, User, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { name: "Home",          href: "/",              icon: Home },
  { name: "Explore",       href: "/explore",       icon: Compass },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Messages",      href: "/messages",      icon: MessageSquare },
  { name: "Profile",       href: "/profile",       icon: User },
];

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Bottom tab trigger bar — always visible on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800
                      flex items-center justify-around px-2 py-2 sm:hidden">
        {NAV_ITEMS.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            aria-label={name}
            onClick={() => setOpen(false)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition
              ${pathname === href ? "text-indigo-400" : "text-gray-500 hover:text-white"}`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px]">{name}</span>
          </Link>
        ))}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation menu"
          className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-gray-500 hover:text-white"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
          <span className="text-[10px]">More</span>
        </button>
      </div>

      {/* Slide-up drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl
                          border-t border-gray-700 p-4 pb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-semibold text-white">Navigation</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                className="text-gray-400 hover:text-white transition"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {NAV_ITEMS.map(({ name, href, icon: Icon }) => (
              <Link
                key={name}
                href={href}
                onClick={() => setOpen(false)}
                aria-label={name}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300
                           hover:bg-gray-800 hover:text-white transition text-sm font-medium"
              >
                <Icon className="h-5 w-5" aria-hidden="true" />{name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
