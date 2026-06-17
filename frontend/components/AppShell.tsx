"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import RightSidebar from "./RightSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

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
      {/* Left Sidebar: fixed 256px */}
      <aside className="w-64 flex-shrink-0 h-screen overflow-hidden">
        <Sidebar />
      </aside>

      {/* Center column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          {/* Consistent padding wrapper for all pages */}
          <div className="px-6 py-6 min-h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Right Sidebar: fixed 288px */}
      <aside className="w-72 flex-shrink-0 h-screen overflow-hidden">
        <RightSidebar />
      </aside>
    </div>
  );
}
