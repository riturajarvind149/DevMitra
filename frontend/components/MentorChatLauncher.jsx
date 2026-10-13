"use client";

import { useState } from "react";
import { CpuIcon } from "@/components/icons";
import MentorChatPanel from "./MentorChatPanel";

export default function MentorChatLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState(null);
  const [initialAnalysisId, setInitialAnalysisId] = useState(null);

  // Expose a global function for "Ask AI why" buttons to call
  if (typeof window !== "undefined") {
    window.__openMentorChat = (message, analysisId) => {
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
          aria-label="Open BuildR AI Assistant"
        >
          <div className="relative h-11 px-3.5 rounded-sm bg-amber-500 hover:bg-amber-400 text-gray-950 flex items-center gap-2 border border-amber-600 font-mono text-xs font-bold transition-all active:scale-95 shadow-none">
            <CpuIcon className="w-4 h-4 text-gray-950" />
            <span className="hidden sm:inline tracking-wider">AI ASSISTANT</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-950 animate-pulse" />
          </div>

          {/* Tooltip for small screens */}
          <div className="sm:hidden absolute bottom-full right-0 mb-2 px-2.5 py-1 surface-card border border-subtle rounded-sm text-[11px] font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            AI Assistant
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
