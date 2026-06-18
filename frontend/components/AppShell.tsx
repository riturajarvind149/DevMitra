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
      {/* Left Sidebar — starts at 64px, expands to 240px on hover (managed inside Sidebar) */}
      <Sidebar />

      {/* Center column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Right Sidebar — collapsible */}
      <div
        style={{
          width: rightVisible ? 288 : 0,
          transition: "width 250ms cubic-bezier(0.4,0,0.2,1)",
        }}
        className="relative flex-shrink-0 h-screen overflow-hidden"
      >
        {/* Toggle arrow tab — always visible on the left edge */}
        <button
          onClick={() => setRightVisible(v => !v)}
          className="absolute top-1/2 -translate-y-1/2 -left-3 z-40 w-6 h-12 bg-gray-800 border border-gray-700 rounded-l-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition group shadow-lg"
          title={rightVisible ? "Hide sidebar" : "Show sidebar"}
        >
          <svg
            className="h-3.5 w-3.5 transition-transform duration-250"
            style={{ transform: rightVisible ? "rotate(0deg)" : "rotate(180deg)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <RightSidebar />
      </div>
    </div>
  );
}
