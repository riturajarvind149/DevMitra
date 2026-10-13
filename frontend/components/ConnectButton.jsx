"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectionsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/context/ToastContext";
import { UserIcon, CheckIcon, ClockIcon, PlusIcon } from "@/components/icons";
import { useState } from "react";

export default function ConnectButton({ userId }) {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const { data: status } = useQuery({
    queryKey: ["connStatus", userId],
    queryFn: async () => {
      const { data } = await connectionsAPI.getStatus(userId);
      return data;
    },
    enabled: isAuthenticated && !!userId && user?.id !== userId,
  });

  const sendMutation = useMutation({
    mutationFn: () => connectionsAPI.send(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connStatus", userId] });
      toast.success("Connection request sent", "Network");
    },
    onError: () => toast.error("Could not send connection request", "Network"),
  });

  const acceptMutation = useMutation({
    mutationFn: (id) => connectionsAPI.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connStatus", userId] });
      qc.invalidateQueries({ queryKey: ["connections"] });
      toast.success("Connection accepted. You can now direct message each other.", "Network");
    },
    onError: () => toast.error("Could not accept connection", "Network"),
  });

  const removeMutation = useMutation({
    mutationFn: () => connectionsAPI.remove(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connStatus", userId] });
      qc.invalidateQueries({ queryKey: ["connections"] });
      setConfirmDisconnect(false);
      toast.info("Connection removed", "Network");
    },
    onError: () => toast.error("Could not remove connection", "Network"),
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
          className="flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-sm hover:bg-red-950/30 hover:text-red-400 hover:border-red-800/60 transition"
        >
          <CheckIcon className="h-3.5 w-3.5" />
          <span>Connected</span>
        </button>

        {confirmDisconnect && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
            <div className="bg-[#111722] rounded-sm p-5 border border-[#27354c] max-w-sm w-full">
              <h3 className="text-sm font-semibold text-gray-100 mb-2">Remove Connection?</h3>
              <p className="text-xs text-gray-400 mb-4 leading-relaxed font-sans">
                Are you sure you want to disconnect? You will need to send a new request to reconnect.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => removeMutation.mutate()}
                  disabled={removeMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-sm text-xs font-mono font-medium transition disabled:opacity-50"
                >
                  {removeMutation.isPending ? "Removing..." : "Disconnect"}
                </button>
                <button
                  onClick={() => setConfirmDisconnect(false)}
                  className="flex-1 bg-[#1a2333] hover:bg-[#253247] text-gray-300 py-1.5 rounded-sm text-xs font-mono font-medium transition border border-[#2b3952]"
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
      <button
        disabled
        className="flex items-center gap-1.5 text-xs font-mono font-medium text-amber-400 bg-amber-950/40 border border-amber-800/60 px-3 py-1.5 rounded-sm opacity-90 cursor-not-allowed"
      >
        <ClockIcon className="h-3.5 w-3.5" />
        <span>Pending</span>
      </button>
    );
  }

  if (s === "PENDING" && !isSender && connId) {
    return (
      <button
        onClick={() => acceptMutation.mutate(connId)}
        disabled={acceptMutation.isPending}
        className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-950 bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-sm transition disabled:opacity-50"
      >
        <CheckIcon className="h-3.5 w-3.5" />
        <span>Accept</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => sendMutation.mutate()}
      disabled={sendMutation.isPending}
      className="flex items-center gap-1.5 text-xs font-mono font-semibold text-gray-100 bg-[#1e283b] hover:bg-[#28364f] border border-[#334463] px-3 py-1.5 rounded-sm transition disabled:opacity-50"
    >
      <PlusIcon className="h-3.5 w-3.5 text-amber-400" />
      <span>{sendMutation.isPending ? "Connecting..." : "Connect"}</span>
    </button>
  );
}
