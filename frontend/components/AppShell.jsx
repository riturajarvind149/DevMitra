"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import RightSidebar from "./RightSidebar";
import MobileNavDrawer from "./MobileNavDrawer";
import MentorChatLauncher from "./MentorChatLauncher";
import LiveAlertWatcher from "./LiveAlertWatcher";
import Link from "next/link";

const FULLSCREEN_PATHS = ["/messages"];
const WIDE_PATHS = ["/profile", "/users/", "/settings", "/projects/", "/mentor"];

export default function AppShell({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [rightVisible, setRightVisible] = useState(true);
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  const isFullscreen = FULLSCREEN_PATHS.some((p) => pathname.startsWith(p));
  const isWide = WIDE_PATHS.some((p) => pathname.startsWith(p));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen surface-base">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="surface-base min-h-screen">{children}</div>;
  }

  return (
    <div className="flex h-screen surface-base overflow-hidden relative">
      {/* Background live alerts & notifications watcher */}
      <LiveAlertWatcher />

      {/* Left Sidebar overlay on desktop/laptop */}
      <div className="hidden md:block absolute top-0 left-0 h-full z-30">
        <Sidebar />
      </div>

      {/* Center column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden md:pl-16">
        {!isFullscreen && (
          <div className={pathname === "/profile" ? "hidden md:block" : ""}>
            <TopBar />
          </div>
        )}

        <main
          className={`flex-1 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden ${
            isFullscreen ? "overflow-hidden" : ""
          }`}
        >
          {isFullscreen ? (
            <div className="h-full w-full">{children}</div>
          ) : (
            <div className="px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6 min-h-full w-full min-w-0 max-w-full flex flex-col items-center justify-between">
              <div className={`w-full ${isWide ? "max-w-5xl" : "max-w-2xl"}`}>
                {children}
              </div>

              {/* Legal & Compliance Footer strip */}
              <footer className="w-full max-w-5xl mt-12 pt-6 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-muted font-mono">
                <div>BuildR Engine : Built for developers</div>
                <div className="flex items-center gap-4">
                  <Link href="/terms" className="hover:text-amber-500 transition">
                    Terms of Service
                  </Link>
                  <span>/</span>
                  <Link href="/privacy" className="hover:text-amber-500 transition">
                    Privacy Policy
                  </Link>
                </div>
              </footer>
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav bar */}
      <div className="md:hidden">
        <MobileNavDrawer />
      </div>

      {/* Right sidebar */}
      <div className="hidden md:flex relative flex-shrink-0 h-screen">
        <button
          onClick={() => setRightVisible((v) => !v)}
          className="absolute top-1/2 -translate-y-1/2 -left-3 z-50 w-5 h-10 surface-raised border border-subtle rounded-l-sm flex items-center justify-center text-muted hover:text-primary transition"
          title={rightVisible ? "Collapse panel" : "Expand panel"}
          aria-label="Toggle right sidebar"
        >
          <svg
            className="h-3 w-3"
            style={{
              transform: rightVisible ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 150ms ease",
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          style={{
            width: rightVisible ? 288 : 0,
            transition: "width 200ms cubic-bezier(0.4,0,0.2,1)",
          }}
          className="overflow-hidden h-screen"
        >
          <RightSidebar />
        </div>
      </div>

      {/* Floating AI Mentor Chat Launcher */}
      <MentorChatLauncher />
    </div>
  );
}
