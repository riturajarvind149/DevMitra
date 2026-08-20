"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import RightSidebar from "./RightSidebar";
import MobileNavDrawer from "./MobileNavDrawer";
import MentorChatLauncher from "./MentorChatLauncher";

// Pages that should use full-height, no padding, no centering
const FULLSCREEN_PATHS = ["/messages"];

// Pages that need full available width but keep padding (wider than max-w-2xl)
const WIDE_PATHS = ["/profile", "/users/", "/settings", "/projects/", "/mentor"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [rightVisible, setRightVisible] = useState(true);
  const rawPathname = usePathname();
  const pathname = rawPathname || "";

  const isFullscreen = FULLSCREEN_PATHS.some(p => pathname.startsWith(p));
  const isWide = WIDE_PATHS.some(p => pathname.startsWith(p));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="bg-gray-950 min-h-screen">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden relative">
      {/* Left Sidebar — absolute overlay on desktop/laptop (>=768px), expands on hover without pushing center */}
      <div className="hidden md:block absolute top-0 left-0 h-full z-30">
        <Sidebar />
      </div>

      {/* Center column — 64px left padding for collapsed sidebar, fills remaining space up to right sidebar */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden md:pl-16">
        {/* Hide TopBar on fullscreen pages, and hide on mobile for /profile */}
        {!isFullscreen && (
          <div className={pathname === "/profile" ? "hidden md:block" : ""}>
            <TopBar />
          </div>
        )}

        <main className={`flex-1 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden ${isFullscreen ? "overflow-hidden" : ""}`}>
          {isFullscreen ? (
            // Fullscreen pages: no padding, no centering, full height
            <div className="h-full w-full">
              {children}
            </div>
          ) : (
            // Normal pages: centered, max-w-2xl, padded
            // Wide pages (profile, settings, mentor): max-w-5xl, centered with padding
            <div className="px-3 sm:px-6 py-4 sm:py-6 pb-24 md:pb-6 min-h-full w-full min-w-0 max-w-full flex flex-col items-center">
              <div className={`w-full ${isWide ? "max-w-5xl" : "max-w-2xl"}`}>
                {children}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile bottom nav bar — visible only on mobile (<768px) */}
      <div className="md:hidden">
        <MobileNavDrawer />
      </div>

      {/* Right sidebar — desktop & laptop (>=768px) */}
      <div className="hidden md:flex relative flex-shrink-0 h-screen">
        {/* Toggle arrow — outside overflow-hidden, always visible */}
        <button
          onClick={() => setRightVisible(v => !v)}
          className="absolute top-1/2 -translate-y-1/2 -left-3 z-50 w-6 h-12 bg-gray-800 border border-gray-700 rounded-l-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition shadow-lg"
          title={rightVisible ? "Hide sidebar" : "Show sidebar"}
        >
          <svg
            className="h-3.5 w-3.5"
            style={{ transform: rightVisible ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 250ms ease" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Collapsing panel */}
        <div
          style={{ width: rightVisible ? 288 : 0, transition: "width 250ms cubic-bezier(0.4,0,0.2,1)" }}
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

