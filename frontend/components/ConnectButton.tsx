"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connectionsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { UserPlus, Clock, UserCheck, UserMinus } from "lucide-react";

export default function ConnectButton({ userId }: { userId: string }) {
  const { user, isAuthenticated } = useAuth();
  const qc = useQueryClient();

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
    },
  });

  if (!isAuthenticated || user?.id === userId) return null;

  const s = status?.status ?? "NONE";
  const isSender = status?.isSender ?? false;
  const connId = status?.connectionId;

  if (s === "ACCEPTED") {
    return (
      <button
        onClick={() => removeMutation.mutate()}
        disabled={removeMutation.isPending}
        className="flex items-center gap-2 text-sm font-medium text-green-400 border border-green-800 px-4 py-2 rounded-xl hover:bg-red-900/20 hover:text-red-400 hover:border-red-800 transition disabled:opacity-50"
      >
        <UserCheck className="h-4 w-4" />
        <span>Connected</span>
      </button>
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
