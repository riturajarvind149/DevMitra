"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRequestsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock, Send, Inbox, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { NotificationSkeleton } from "@/components/Skeleton";

function StatusBadge({ status }: { status: string }) {
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
  const [tab, setTab] = useState<"sent" | "received">("sent");

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
    mutationFn: (id: string) => accessRequestsAPI.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["receivedRequests"] });
      qc.invalidateQueries({ queryKey: ["notificationCount"] });
    },
    onError: (e: any) => alert(e.response?.data?.message || "Failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => accessRequestsAPI.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["receivedRequests"] }),
    onError: (e: any) => alert(e.response?.data?.message || "Failed"),
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-400">Please login</div>
  );

  const pendingCount = (receivedRequests ?? []).filter(r => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Access Requests</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage collaboration requests for your projects</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 w-fit">
        {[
          { key: "sent",     label: `Sent (${sentRequests?.length ?? 0})`,                              icon: Send },
          { key: "received", label: `Received${pendingCount > 0 ? ` (${pendingCount})` : ""}`,          icon: Inbox },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{label}
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
              <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <Link href={`/projects/${req.projectId}`} className="text-base font-semibold text-indigo-400 hover:text-indigo-300">
                      {req.project?.title || "Unknown Project"}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="space-y-2">
                  <div><span className="text-xs text-gray-500 uppercase tracking-wide block mb-0.5">Why you want to join</span><p className="text-sm text-gray-300">{req.reason}</p></div>
                  <div><span className="text-xs text-gray-500 uppercase tracking-wide block mb-0.5">How you can contribute</span><p className="text-sm text-gray-300">{req.suggestion}</p></div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
              <Send className="h-10 w-10 mx-auto mb-3 text-gray-700" />
              <p className="text-white font-medium mb-1">No sent requests</p>
              <Link href="/explore" className="text-sm text-indigo-400 hover:text-indigo-300">Browse projects →</Link>
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
              <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {req.requester?.avatarUrl ? (
                      <img src={req.requester.avatarUrl} alt="" className="w-10 h-10 rounded-xl" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{req.requester?.username?.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{req.requester?.username}</p>
                      <Link href={`/projects/${req.projectId}`} className="text-xs text-indigo-400 hover:text-indigo-300">{req.project?.title}</Link>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="space-y-2 mb-4">
                  <div><span className="text-xs text-gray-500 uppercase tracking-wide block mb-0.5">Reason</span><p className="text-sm text-gray-300">{req.reason}</p></div>
                  <div><span className="text-xs text-gray-500 uppercase tracking-wide block mb-0.5">Contribution</span><p className="text-sm text-gray-300">{req.suggestion}</p></div>
                </div>
                {req.status === "PENDING" && (
                  <div className="flex gap-2 pt-4 border-t border-gray-800">
                    <button onClick={() => approveMut.mutate(req.id)} disabled={approveMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition">
                      <Check className="h-4 w-4" />Approve
                    </button>
                    <button onClick={() => rejectMut.mutate(req.id)} disabled={rejectMut.isPending}
                      className="flex-1 flex items-center justify-center gap-2 text-red-400 border border-red-800 py-2.5 rounded-xl text-sm font-medium hover:bg-red-900/20 disabled:opacity-50 transition">
                      <X className="h-4 w-4" />Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
              <Inbox className="h-10 w-10 mx-auto mb-3 text-gray-700" />
              <p className="text-white font-medium mb-1">No received requests</p>
              <p className="text-sm text-gray-500">Requests to join your projects appear here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
