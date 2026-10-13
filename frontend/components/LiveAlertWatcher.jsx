"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { notificationsAPI, messagesAPI } from "@/lib/api";

export default function LiveAlertWatcher() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const initialLoadRef = useRef(true);
  const seenNotifIdsRef = useRef(new Set());
  const seenMsgIdsRef = useRef(new Set());

  const toastRef = useRef(toast);
  toastRef.current = toast;
  const routerRef = useRef(router);
  routerRef.current = router;

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;

    async function checkNewAlerts() {
      try {
        // 1. Check Notifications
        const notifRes = await notificationsAPI.getAll();
        const notifs = notifRes?.data ?? [];

        if (initialLoadRef.current) {
          notifs.forEach((n) => seenNotifIdsRef.current.add(n.id));
        } else {
          for (const n of notifs) {
            if (!n.read && !seenNotifIdsRef.current.has(n.id)) {
              seenNotifIdsRef.current.add(n.id);
              if (isMounted) {
                toastRef.current?.info(n.message, "Community Alert");
              }
            }
          }
        }

        // 2. Check Messages
        const convRes = await messagesAPI.getConversations();
        const convs = convRes?.data ?? [];

        if (initialLoadRef.current) {
          convs.forEach((c) => {
            const last = c.messages?.[c.messages.length - 1];
            if (last) seenMsgIdsRef.current.add(last.id);
          });
          initialLoadRef.current = false;
        } else {
          for (const c of convs) {
            const last = c.messages?.[c.messages.length - 1];
            if (last && !last.read && !seenMsgIdsRef.current.has(last.id)) {
              seenMsgIdsRef.current.add(last.id);
              if (isMounted) {
                toastRef.current?.message({
                  sender: last.sender?.username || "Developer",
                  preview: last.content,
                  onClick: () => routerRef.current?.push("/messages"),
                });
              }
            }
          }
        }
      } catch {
        // Silently catch background poll failures
      }
    }

    // Run initial check
    checkNewAlerts();

    // Poll every 45 seconds for new live events while on the site
    const interval = setInterval(checkNewAlerts, 45000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return null;
}
