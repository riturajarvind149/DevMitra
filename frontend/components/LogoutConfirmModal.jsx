"use client";

import { LogOutIcon } from "@/components/icons";

export default function LogoutConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
      <div className="bg-[#111722] rounded-sm p-5 border border-[#27354c] max-w-sm w-full font-sans">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-8 h-8 bg-red-950/60 border border-red-800/60 rounded-sm flex items-center justify-center flex-shrink-0 text-red-400">
            <LogOutIcon className="h-4 w-4" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-semibold text-gray-100 font-mono">Sign Out Session?</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed font-sans">
          Are you sure you want to sign out of BuildR? Your session token will be cleared.
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-sm text-xs font-mono font-bold transition"
          >
            Sign Out
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-[#182130] hover:bg-[#222d40] text-gray-300 border border-[#2b394f] py-2 rounded-sm text-xs font-mono transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
