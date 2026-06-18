"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import RightSidebar from "./RightSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [rightVisible, setRightVisible] = useState(true);

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
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Left Sidebar — 64px default, expands to 240px on hover inside Sidebar component */}
      <Sidebar />

      {/* Center column — fills remaining space */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {/*
            Content is centered with a max-width so it doesn't stretch across
            the full available width when sidebars collapse.
            max-w-2xl = 672px — feels like a single-column social feed.
          */}
          <div className="px-6 py-6 min-h-full flex flex-col items-center">
            <div className="w-full max-w-2xl">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Right sidebar wrapper — arrow lives OUTSIDE the clipping div */}
      <div className="relative flex-shrink-0 h-screen flex">

        {/* Toggle arrow — outside overflow-hidden so it's always visible */}
        <button
          onClick={() => setRightVisible(v => !v)}
          className="absolute top-1/2 -translate-y-1/2 -left-3 z-50 w-6 h-12 bg-gray-800 border border-gray-700 rounded-l-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition shadow-lg"
          title={rightVisible ? "Hide sidebar" : "Show sidebar"}
        >
          <svg
            className="h-3.5 w-3.5"
            style={{
              transform: rightVisible ? "rotate(0deg)" : "rotate(180deg)",
              transition: "transform 250ms ease",
            }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Collapsing sidebar panel */}
        <div
          style={{
            width: rightVisible ? 288 : 0,
            transition: "width 250ms cubic-bezier(0.4,0,0.2,1)",
          }}
          className="overflow-hidden h-screen"
        >
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
