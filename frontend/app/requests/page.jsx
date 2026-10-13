"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRequestsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock, Send, Inbox, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { NotificationSkeleton } from "@/components/Skeleton";

function StatusBadge({ status }) {
  if (status === "PENDING") return (
    <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-900/30 px-2.5 py-1 rounded-full">
      <Clock className="h-3 w-3" />Pending
    </span>
  );
  if (status === "APPROVED") return (
    <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full">
      <CheckCircle className="h-3 w-3" />Approved
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-900/30 px-2.5 py-1 rounded-full">
      <XCircle className="h-3 w-3" />Rejected
    </span>
  );
}

export default function RequestsPage() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("sent");

  const { data: sentRequests, isLoading: loadingSent } = useQuery({
    queryKey: ["sentRequests"],
    queryFn: async () => { const { data } = await accessRequestsAPI.getMine(); return data; },
    enabled: isAuthenticated,
  });

  const { data: receivedRequests, isLoading: loadingReceived } = useQuery({
    queryKey: ["receivedRequests"],
    queryFn: async () => { const { data } = await accessRequestsAPI.getIncoming(); return data; },
    enabled: isAuthenticated,
  });

  const approveMut = useMutation({
    mutationFn: (id) => accessRequestsAPI.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receivedRequests"] });
      qc.invalidateQueries({ queryKey: ["notificationCount"] });
    },
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (id) => accessRequestsAPI.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receivedRequests"] }),
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-400">Please login</div>
  );

  const pendingCount = (receivedRequests ?? []).filter(r => r.status === "PENDING").length;

  return (
    <div className="space-y-5 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary">Access Requests</h1>
        <p className="text-xs text-muted mt-0.5 font-sans">Manage collaboration requests for your projects</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm w-fit">
        {[
          { key: "sent",     label: `Sent (${sentRequests?.length ?? 0})`,                     icon: Send },
          { key: "received", label: `Received${pendingCount > 0 ? ` (${pendingCount})` : ""}`, icon: Inbox },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-mono transition ${tab === key ? "bg-amber-500 text-gray-950 font-bold" : "text-muted hover:text-primary"}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Sent */}
      {tab === "sent" && (
        <div className="space-y-3">
          {loadingSent ? (
            [...Array(3)].map((_, i) => <NotificationSkeleton key={i} />)
          ) : sentRequests && sentRequests.length > 0 ? (
            sentRequests.map(req => (
              <div key={req.id} className="surface-card border border-subtle rounded-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <Link href={`/projects/${req.projectId}`} className="text-base font-semibold text-primary hover:text-amber-500 transition">
                      {req.project?.title || "Unknown Project"}
                    </Link>
                    <p className="text-xs text-muted mt-0.5 font-mono">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="space-y-2">
                  <div><span className="text-xs text-muted uppercase tracking-wide block mb-0.5 font-mono">Why you want to join</span><p className="text-sm text-secondary">{req.reason}</p></div>
                  <div><span className="text-xs text-muted uppercase tracking-wide block mb-0.5 font-mono">How you can contribute</span><p className="text-sm text-secondary">{req.suggestion}</p></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 surface-card rounded-sm border border-subtle">
              <Send className="h-10 w-10 mx-auto mb-3 text-muted" />
              <p className="text-primary font-medium mb-1">No sent requests</p>
              <Link href="/explore" className="text-sm text-amber-500 hover:underline font-mono">Browse projects →</Link>
            </div>
          )}
        </div>
      )}

      {/* Received */}
      {tab === "received" && (
        <div className="space-y-3">
          {loadingReceived ? (
            [...Array(3)].map((_, i) => <NotificationSkeleton key={i} />)
          ) : receivedRequests && receivedRequests.length > 0 ? (
            receivedRequests.map(req => (
              <div key={req.id} className="surface-card border border-subtle rounded-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {req.requester?.avatarUrl ? (
                      <img src={req.requester.avatarUrl} alt="" className="w-10 h-10 rounded-sm object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-sm bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center font-bold">
                        <span className="text-sm">{req.requester?.username?.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-primary">{req.requester?.username}</p>
                      <Link href={`/projects/${req.projectId}`} className="text-xs text-amber-500 hover:underline font-mono">{req.project?.title}</Link>
                      <p className="text-xs text-muted mt-0.5 font-mono">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="space-y-2 mb-4">
                  <div><span className="text-xs text-muted uppercase tracking-wide block mb-0.5 font-mono">Reason</span><p className="text-sm text-secondary">{req.reason}</p></div>
                  <div><span className="text-xs text-muted uppercase tracking-wide block mb-0.5 font-mono">Contribution</span><p className="text-sm text-secondary">{req.suggestion}</p></div>
                </div>
                {req.status === "PENDING" && (
                  <div className="flex gap-2 pt-4 border-t border-subtle">
                    <button onClick={() => approveMut.mutate(req.id)} disabled={approveMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-black py-2.5 rounded-sm text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition shadow-sm">
                      <Check className="h-4 w-4" />Approve
                    </button>
                    <button onClick={() => rejectMut.mutate(req.id)} disabled={rejectMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 text-secondary border border-subtle py-2.5 rounded-sm text-sm font-medium hover:text-red-400 hover:border-red-500/40 disabled:opacity-50 transition">
                      <X className="h-4 w-4" />Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16 surface-card rounded-sm border border-subtle">
              <Inbox className="h-10 w-10 mx-auto mb-3 text-muted" />
              <p className="text-primary font-medium mb-1">No received requests</p>
              <p className="text-xs text-muted font-mono">Requests to join your projects appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
