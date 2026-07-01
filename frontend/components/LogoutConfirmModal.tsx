"use client";
import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutConfirmModal({ onConfirm, onCancel }: LogoutConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
      <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-sm w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <LogOut className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-white">Sign Out?</h3>
        </div>
        <p className="text-sm text-gray-400 mb-5">Are you sure you want to sign out of DevMitra?</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition"
          >
            Sign Out
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
