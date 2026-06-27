"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { connectionsAPI, developersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, UserPlus, Check, X, Search,
  AlertTriangle, MapPin, Clock, FolderGit2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";

// ── Small avatar helper ────────────────────────────────────────────────────
function Avatar({ src, name, size = 12 }: { src?: string; name: string; size?: number }) {
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0 object-cover`;
  if (src) return <img src={src} alt={name} className={cls} />;
  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0`}>
      <span className="text-sm font-bold text-white">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

// ── LinkedIn-style "People you may know" card ─────────────────────────────
function SuggestedCard({ dev, onDismiss }: { dev: any; onDismiss: (id: string) => void }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition flex flex-col">
      {/* Mini banner */}
      <div className="h-14 bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-pink-900/30 relative flex-shrink-0">
        <button
          onClick={() => onDismiss(dev.id)}
          className="absolute top-2 right-2 w-6 h-6 bg-gray-900/80 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Avatar overlapping banner */}
      <div className="px-4 pb-4 flex flex-col flex-1">
        <div className="-mt-7 mb-2">
          {dev.avatarUrl
            ? <img src={dev.avatarUrl} alt={dev.username} className="w-14 h-14 rounded-full border-4 border-gray-900 block" />
            : <div className="w-14 h-14 rounded-full border-4 border-gray-900 bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{dev.username.charAt(0).toUpperCase()}</span>
              </div>
          }
        </div>

        <Link href={`/users/${dev.id}`} className="text-sm font-semibold text-white hover:text-indigo-400 transition leading-tight">
          {dev.username}
        </Link>
        {dev.bio && (
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-snug flex-1">{dev.bio}</p>
        )}

        {/* Mutual connections */}
        {dev.mutualCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex -space-x-1">
              <div className="w-4 h-4 rounded-full bg-indigo-700 border border-gray-900" />
              <div className="w-4 h-4 rounded-full bg-purple-700 border border-gray-900" />
            </div>
            <span className="text-[10px] text-gray-500">{dev.mutualCount} mutual connection{dev.mutualCount !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Skills */}
        {dev.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {dev.skills.slice(0, 3).map((s: string, i: number) => (
              <span key={i} className="text-[9px] text-indigo-300 bg-indigo-900/40 px-1.5 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600">
          {dev.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{dev.location}</span>}
          {dev.availabilityHours && <span className="flex items-center gap-0.5 text-green-600"><Clock className="h-2.5 w-2.5" />{dev.availabilityHours}h/wk</span>}
          <span className="flex items-center gap-0.5"><FolderGit2 className="h-2.5 w-2.5" />{dev._count?.projects ?? 0}</span>
        </div>

        {/* Connect button */}
        <div className="mt-3">
          <ConnectButton userId={dev.id} />
        </div>
      </div>
    </div>
  );
}

// ── My connection card (bigger, LinkedIn network style) ────────────────────
function ConnectionCard({ conn, onRemove }: { conn: any; onRemove: (userId: string, username: string) => void }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition flex items-start gap-4">
      <Link href={`/users/${conn.user.id}`} className="flex-shrink-0">
        <Avatar src={conn.user.avatarUrl} name={conn.user.username} size={14} />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/users/${conn.user.id}`} className="text-sm font-semibold text-white hover:text-indigo-400 transition block truncate">
          {conn.user.username}
        </Link>
        {conn.user.bio && (
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{conn.user.bio}</p>
        )}

        {/* Mutual connections */}
        {conn.mutualCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="flex -space-x-1">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-700 border border-gray-900" />
              <div className="w-3.5 h-3.5 rounded-full bg-purple-700 border border-gray-900" />
            </div>
            <span className="text-[10px] text-gray-500">{conn.mutualCount} mutual</span>
          </div>
        )}

        {/* Skills */}
        {conn.user.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {conn.user.skills.slice(0, 4).map((s: string, i: number) => (
              <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <span className="text-[10px] text-gray-600">
            Connected {formatDistanceToNow(new Date(conn.connectedAt), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-2">
            <Link href={`/messages?user=${conn.user.id}`}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 border border-indigo-800/50 px-2.5 py-1 rounded-lg transition">
              Message
            </Link>
            <button
              onClick={() => onRemove(conn.user.id, conn.user.username)}
              className="text-[11px] text-gray-500 hover:text-red-400 border border-gray-700 hover:border-red-800 px-2.5 py-1 rounded-lg transition"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectionsPage() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"connections" | "requests" | "discover">("connections");
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState<{ userId: string; username: string } | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const { data: connections, isLoading: loadConn } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => { const { data } = await connectionsAPI.getAll(); return data; },
    enabled: isAuthenticated,
    refetchInterval: 15000,
  });

  const { data: requests, isLoading: loadReq } = useQuery({
    queryKey: ["connRequests"],
    queryFn: async () => { const { data } = await connectionsAPI.getRequests(); return data; },
    enabled: isAuthenticated,
    refetchInterval: 10000,
  });

  const { data: suggested, isLoading: loadSuggested } = useQuery({
    queryKey: ["suggestedForDiscover"],
    queryFn: async () => { const { data } = await developersAPI.getSuggested(); return data; },
    enabled: isAuthenticated && tab === "discover",
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["connections"] }); setConfirmRemove(null); },
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-500">Please login to view connections</div>
  );

  const filtered = (connections ?? []).filter((c: any) =>
    !search.trim() || c.user.username.toLowerCase().includes(search.toLowerCase())
  );
  const pendingCount = requests?.length ?? 0;
  const suggestedFiltered = (suggested ?? []).filter((d: any) => !dismissed.has(d.id));

  return (
    <div className="min-h-screen bg-gray-950">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">My Network</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your developer connections</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 w-fit">
        {[
          { key: "connections", label: `Connections (${connections?.length ?? 0})`, icon: Users },
          { key: "requests",    label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}`, icon: UserPlus },
          { key: "discover",    label: "People You May Know", icon: UserPlus },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{label}
            {key === "requests" && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Connections tab ──────────────────────────────────────────────── */}
      {tab === "connections" && (
        <>
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Search connections…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-900 border border-gray-800 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>

          {loadConn ? (
            <div className="grid grid-cols-1 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-xs text-gray-600 mb-4">{filtered.length} connection{filtered.length !== 1 ? "s" : ""}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map((conn: any) => (
                  <ConnectionCard
                    key={conn.id}
                    conn={conn}
                    onRemove={(userId, username) => setConfirmRemove({ userId, username })}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-800" />
              <p className="text-white font-medium mb-1">No connections yet</p>
              <p className="text-sm text-gray-500 mb-4">Explore developers and send connection requests</p>
              <button onClick={() => setTab("discover")}
                className="inline-flex items-center gap-2 text-sm text-white bg-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-700 transition">
                Find People
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Requests tab ────────────────────────────────────────────────── */}
      {tab === "requests" && (
        loadReq ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req: any) => (
              <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-700 transition">
                <Link href={`/users/${req.sender.id}`} className="flex-shrink-0">
                  <Avatar src={req.sender.avatarUrl} name={req.sender.username} size={12} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/users/${req.sender.id}`} className="text-sm font-semibold text-white hover:text-indigo-400 transition block truncate">
                    {req.sender.username}
                  </Link>
                  {req.sender.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{req.sender.bio}</p>}
                  {req.sender.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {req.sender.skills.slice(0, 3).map((s: string, i: number) => (
                        <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-1.5 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
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
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
            <UserPlus className="h-12 w-12 mx-auto mb-3 text-gray-800" />
            <p className="text-white font-medium mb-1">No pending requests</p>
            <p className="text-sm text-gray-500">You're all caught up!</p>
          </div>
        )
      )}

      {/* ── Discover / People You May Know tab ──────────────────────────── */}
      {tab === "discover" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">People You May Know</h2>
            <p className="text-xs text-gray-500">Based on your activity and network</p>
          </div>

          {loadSuggested ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-52 bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : suggestedFiltered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {suggestedFiltered.map((dev: any) => (
                <SuggestedCard
                  key={dev.id}
                  dev={dev}
                  onDismiss={id => setDismissed(prev => new Set([...prev, id]))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-800" />
              <p className="text-white font-medium mb-1">No suggestions right now</p>
              <p className="text-sm text-gray-500">Check back later as your network grows</p>
            </div>
          )}
        </>
      )}

      {/* ── Confirm Remove Modal ────────────────────────────────────────── */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Remove Connection?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Are you sure you want to remove <span className="text-white font-medium">{confirmRemove.username}</span> from your connections?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => removeMut.mutate(confirmRemove.userId)}
                disabled={removeMut.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition">
                {removeMut.isPending ? "Removing…" : "Remove"}
              </button>
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
