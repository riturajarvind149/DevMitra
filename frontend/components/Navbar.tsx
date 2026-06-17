"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, FolderGit2 } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <FolderGit2 className="h-8 w-8 text-indigo-600" />
              <span className="text-2xl font-bold text-gray-900">DevMitra</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              href="/projects"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
            >
              Projects
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/my-projects"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  My Projects
                </Link>
                <Link
                  href="/requests"
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition"
                >
                  Requests
                </Link>
                <div className="flex items-center space-x-4 border-l border-gray-300 pl-6">
                  <Link href="/profile" className="flex items-center space-x-2">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.username}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-indigo-600" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {user?.username}
                    </span>
                  </Link>
                  <button
                    onClick={logout}
                    className="text-gray-700 hover:text-red-600 transition"
                    title="Logout"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={login}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition"
              >
                <span>🔗</span>
                <span>Login with GitHub</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
