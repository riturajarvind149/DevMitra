"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { CheckIcon, CloseIcon, BellIcon, ChatIcon } from "@/components/icons";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type = "info", title, message, action, duration = 4000, link }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
      const newToast = { id, type, title, message, action, duration, link, createdAt: Date.now() };

      setToasts((prev) => [newToast, ...prev].slice(0, 5)); // keep max 5 on screen

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = useMemo(
    () => ({
      success: (message, title = "Success") => addToast({ type: "success", title, message }),
      error: (message, title = "Error") => addToast({ type: "error", title, message, duration: 5000 }),
      info: (message, title = "Notice") => addToast({ type: "info", title, message }),
      warning: (message, title = "Warning") => addToast({ type: "warning", title, message }),
      action: (message, { label, onClick, title = "Action Required" }) =>
        addToast({ type: "action", title, message, action: { label, onClick }, duration: 6000 }),
      message: ({ sender, preview, onClick }) =>
        addToast({
          type: "message",
          title: sender ? `Message from @${sender}` : "New Message",
          message: preview,
          action: onClick ? { label: "Open Chat", onClick } : null,
          duration: 6000,
        }),
      dismiss: removeToast,
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast & Snackbar Viewport Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { type, title, message, action } = toast;

  // Engineering status badge colors (never purple or harsh gradients)
  const typeConfig = {
    success: {
      badge: "OK",
      badgeClass: "bg-emerald-950/80 text-emerald-400 border border-emerald-800/60",
      accentBar: "bg-emerald-500",
    },
    error: {
      badge: "ERR",
      badgeClass: "bg-red-950/80 text-red-400 border border-red-800/60",
      accentBar: "bg-red-500",
    },
    warning: {
      badge: "WARN",
      badgeClass: "bg-amber-950/80 text-amber-400 border border-amber-800/60",
      accentBar: "bg-amber-500",
    },
    info: {
      badge: "INFO",
      badgeClass: "bg-sky-950/80 text-sky-400 border border-sky-800/60",
      accentBar: "bg-sky-500",
    },
    action: {
      badge: "ACT",
      badgeClass: "bg-amber-950/80 text-amber-400 border border-amber-800/60",
      accentBar: "bg-amber-500",
    },
    message: {
      badge: "MSG",
      badgeClass: "bg-cyan-950/80 text-cyan-400 border border-cyan-800/60",
      accentBar: "bg-cyan-500",
    },
  }[type] || {
    badge: "SYS",
    badgeClass: "bg-gray-800 text-gray-300 border border-gray-700",
    accentBar: "bg-gray-400",
  };

  return (
    <div
      role="alert"
      className="pointer-events-auto w-full surface-card text-primary border border-subtle rounded-sm p-3.5 shadow-md transition-all flex flex-col gap-2 relative overflow-hidden"
    >
      {/* 2px precision status indicator strip at bottom */}
      <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${typeConfig.accentBar} opacity-80`} />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[2px] tracking-wider uppercase ${typeConfig.badgeClass}`}
          >
            {typeConfig.badge}
          </span>
          <span className="text-xs font-semibold text-primary tracking-tight">{title}</span>
        </div>

        <button
          onClick={onDismiss}
          className="text-muted hover:text-primary transition p-0.5 rounded-[2px]"
          aria-label="Dismiss notification"
        >
          <CloseIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      {message && <p className="text-xs text-secondary leading-relaxed font-sans">{message}</p>}

      {action && (
        <div className="pt-1 flex justify-end">
          <button
            onClick={() => {
              if (action.onClick) action.onClick();
              onDismiss();
            }}
            className="text-[11px] font-mono font-semibold px-2.5 py-1 surface-input hover:bg-amber-500 hover:text-black text-secondary border border-subtle rounded-sm transition flex items-center gap-1.5"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
