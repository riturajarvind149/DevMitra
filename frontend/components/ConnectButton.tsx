"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectionsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Clock, UserCheck, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function ConnectButton({ userId }: { userId: string }) {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const { data: status } = useQuery({
    queryKey: ["connStatus", userId],
    queryFn: async () => { const { data } = await connectionsAPI.getStatus(userId); return data; },
    enabled: isAuthenticated && !!userId && user?.id !== userId,
  });

  const sendMutation = useMutation({
    mutationFn: () => connectionsAPI.send(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connStatus", userId] }),
  });
  const acceptMutation = useMutation({
    mutationFn: (id: string) => connectionsAPI.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connStatus", userId] });
      qc.invalidateQueries({ queryKey: ["connections"] });
    },
  });
  const removeMutation = useMutation({
    mutationFn: () => connectionsAPI.remove(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connStatus", userId] });
      qc.invalidateQueries({ queryKey: ["connections"] });
      setConfirmDisconnect(false);
    },
  });

  if (!isAuthenticated || user?.id === userId) return null;

  const s = status?.status ?? "NONE";
  const isSender = status?.isSender ?? false;
  const connId = status?.connectionId;

  if (s === "ACCEPTED") {
    return (
      <>
        <button
          onClick={() => setConfirmDisconnect(true)}
          className="flex items-center gap-2 text-sm font-medium text-green-400 border border-green-800 px-4 py-2 rounded-xl hover:bg-red-900/20 hover:text-red-400 hover:border-red-800 transition"
        >
          <UserCheck className="h-4 w-4" />
          <span>Connected</span>
        </button>

        {/* Confirm disconnect modal */}
        {confirmDisconnect && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
            <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-sm w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Remove Connection?</h3>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                Are you sure you want to disconnect? You&apos;ll need to send a new request to reconnect.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {removeMutation.isPending ? "Removing…" : "Disconnect"}
                </button>
                <button
                  onClick={() => setConfirmDisconnect(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  if (s === "PENDING" && isSender) {
    return (
      <button disabled className="flex items-center gap-2 text-sm font-medium text-yellow-400 border border-yellow-800 px-4 py-2 rounded-xl opacity-80 cursor-not-allowed">
        <Clock className="h-4 w-4" />
        <span>Pending</span>
      </button>
    );
  }

  if (s === "PENDING" && !isSender && connId) {
    return (
      <button
        onClick={() => acceptMutation.mutate(connId)}
        disabled={acceptMutation.isPending}
        className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
      >
        <UserCheck className="h-4 w-4" />
        <span>Accept Request</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => sendMutation.mutate()}
      disabled={sendMutation.isPending}
      className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
    >
      <UserPlus className="h-4 w-4" />
      <span>{sendMutation.isPending ? "Sending…" : "Connect"}</span>
    </button>
  );
}
