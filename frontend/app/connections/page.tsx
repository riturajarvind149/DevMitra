"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { connectionsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Users, UserPlus, Check, X, UserCheck, Search, Compass } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ConnectionsPage() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"connections" | "requests" | "discover">("connections");
  const [search, setSearch] = useState("");

  const { data: connections, isLoading: loadConn } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => { const { data } = await connectionsAPI.getAll(); return data; },
    enabled: isAuthenticated,
  });

  const { data: requests, isLoading: loadReq } = useQuery({
    queryKey: ["connRequests"],
    queryFn: async () => { const { data } = await connectionsAPI.getRequests(); return data; },
    enabled: isAuthenticated,
  });

  const acceptMut = useMutation({
    mutationFn: (id: string) => connectionsAPI.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connRequests"] });
    },
  });
  const rejectMut = useMutation({
    mutationFn: (id: string) => connectionsAPI.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connRequests"] }),
  });
  const removeMut = useMutation({
    mutationFn: (userId: string) => connectionsAPI.remove(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connections"] }),
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-500">Please login to view connections</div>
  );

  const filtered = (connections ?? []).filter(c =>
    c.user.username.toLowerCase().includes(search.toLowerCase())
  );
  const pendingCount = requests?.length ?? 0;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Connections</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your developer network</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 w-fit">
        {[
          { key: "connections", label: `Connections (${connections?.length ?? 0})`, icon: UserCheck },
          { key: "requests",    label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}`, icon: UserPlus },
          { key: "discover",    label: "Discover", icon: Compass },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Connections tab */}
      {tab === "connections" && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Search connections…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>

          {loadConn ? (
            <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map(conn => (
                <div key={conn.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-start gap-3">
                  <Link href={`/users/${conn.user.id}`}>
                    {conn.user.avatarUrl ? (
                      <img src={conn.user.avatarUrl} alt="" className="w-12 h-12 rounded-2xl flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-white">{conn.user.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/users/${conn.user.id}`} className="text-sm font-semibold text-white hover:text-indigo-400 transition">
                      {conn.user.username}
                    </Link>
                    {conn.user.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{conn.user.bio}</p>}
                    {conn.user.skills && conn.user.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {conn.user.skills.slice(0, 3).map((s, i) => (
                          <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-1.5 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-gray-600">Connected {formatDistanceToNow(new Date(conn.connectedAt), { addSuffix: true })}</span>
                      <button onClick={() => removeMut.mutate(conn.user.id)} disabled={removeMut.isPending}
                        className="text-[10px] text-gray-600 hover:text-red-400 transition">Remove</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-600">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-800" />
              <p className="text-white font-medium mb-1">No connections yet</p>
              <p className="text-sm">Explore developers and send connection requests</p>
              <Link href="/explore" className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300">Browse Developers →</Link>
            </div>
          )}
        </>
      )}

      {/* Requests tab */}
      {tab === "requests" && (
        loadReq ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map(req => (
              <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
                <Link href={`/users/${req.sender.id}`}>
                  {req.sender.avatarUrl ? (
                    <img src={req.sender.avatarUrl} alt="" className="w-12 h-12 rounded-2xl" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-indigo-700 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">{req.sender.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/users/${req.sender.id}`} className="text-sm font-semibold text-white hover:text-indigo-400 transition">
                    {req.sender.username}
                  </Link>
                  {req.sender.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.sender.bio}</p>}
                  <p className="text-[10px] text-gray-600 mt-1">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => acceptMut.mutate(req.id)} disabled={acceptMut.isPending}
                    className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 px-3 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition">
                    <Check className="h-4 w-4" />Accept
                  </button>
                  <button onClick={() => rejectMut.mutate(req.id)} disabled={rejectMut.isPending}
                    className="flex items-center gap-1.5 text-sm text-gray-400 border border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-800 disabled:opacity-50 transition">
                    <X className="h-4 w-4" />Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-600">
            <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-800" />
            <p className="text-white font-medium mb-1">No pending requests</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        )
      )}

      {/* Discover tab — links to Explore developers to avoid duplication */}
      {tab === "discover" && (
        <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
          <Compass className="h-12 w-12 mx-auto mb-3 text-indigo-400" />
          <p className="text-white font-semibold mb-1">Discover Developers</p>
          <p className="text-sm text-gray-500 mb-5">Find developers to connect with across the platform</p>
          <Link href="/explore?tab=developers"
            className="inline-flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition">
            <Compass className="h-4 w-4" />Browse Developers
          </Link>
        </div>
      )}
    </div>
  );
}
