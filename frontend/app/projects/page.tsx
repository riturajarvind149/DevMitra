"use client";
// /projects redirects to /explore which has full search+filter+categories
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProjectsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/explore"); }, [router]);
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
