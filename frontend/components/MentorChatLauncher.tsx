"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import MentorChatPanel from "./MentorChatPanel";

export default function MentorChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);
  const [initialAnalysisId, setInitialAnalysisId] = useState<string | null>(null);

  // Expose a global function for "Ask AI why" buttons to call
  if (typeof window !== "undefined") {
    (window as any).__openMentorChat = (message?: string, analysisId?: string) => {
      setInitialMessage(message || null);
      setInitialAnalysisId(analysisId || null);
      setIsOpen(true);
    };
  }

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setInitialMessage(null);
            setInitialAnalysisId(null);
            setIsOpen(true);
          }}
          className="fixed bottom-20 right-4 z-30 lg:bottom-6 lg:right-6 group"
          aria-label="Open AI Mentor"
        >
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-30 blur-lg group-hover:opacity-50 transition-opacity" />

          {/* Button */}
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all hover:scale-110 active:scale-95 border border-indigo-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
            AI Mentor Chat
          </div>
        </button>
      )}

      {/* Chat Panel */}
      <MentorChatPanel
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setInitialMessage(null);
          setInitialAnalysisId(null);
        }}
        initialMessage={initialMessage}
        initialAnalysisId={initialAnalysisId}
      />
    </>
  );
}
