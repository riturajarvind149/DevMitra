"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { connectionsAPI, developersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, UserPlus, Check, X, Search,
  AlertTriangle, MapPin, Clock, FolderGit2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import ConnectButton from "@/components/ConnectButton";

// ── Small avatar helper ────────────────────────────────────────────────────
function Avatar({ src, name, size = 12 }) {
  const cls = `w-${size} h-${size} rounded-sm flex-shrink-0 object-cover border border-subtle`;
  if (src) return <img src={src} alt={name} className={cls} />;
  return (
    <div className={`w-${size} h-${size} rounded-sm surface-raised border border-subtle flex items-center justify-center flex-shrink-0`}>
      <span className="text-xs font-mono font-bold text-amber-500">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

// ── LinkedIn-style "People you may know" card ─────────────────────────────
function SuggestedCard({ dev, onDismiss }) {
  return (
    <div className="surface-card border border-subtle rounded-sm overflow-hidden hover:border-normal transition flex flex-col">
      {/* Mini banner */}
      <div className="h-14 surface-raised border-b border-subtle relative flex-shrink-0">
        <button
          onClick={() => onDismiss(dev.id)}
          className="absolute top-2 right-2 w-6 h-6 surface-card border border-subtle rounded-sm flex items-center justify-center text-muted hover:text-primary transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Avatar overlapping banner */}
      <div className="px-4 pb-4 flex flex-col flex-1">
        <div className="-mt-7 mb-2">
          {dev.avatarUrl
            ? <img src={dev.avatarUrl} alt={dev.username} className="w-14 h-14 rounded-sm border-2 border-subtle object-cover block" />
            : <div className="w-14 h-14 rounded-sm border-2 border-subtle surface-raised flex items-center justify-center">
                <span className="text-base font-mono font-bold text-amber-500">{dev.username.charAt(0).toUpperCase()}</span>
              </div>
          }
        </div>

        <Link href={`/users/${dev.id}`} className="text-sm font-semibold text-primary hover:text-amber-500 transition leading-tight font-mono">
          {dev.username}
        </Link>
        {dev.bio && (
          <p className="text-[11px] text-muted mt-0.5 line-clamp-2 leading-snug flex-1 font-sans">{dev.bio}</p>
        )}

        {/* Mutual connections */}
        {dev.mutualCount > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-[10px] text-muted font-mono">{dev.mutualCount} mutual connection{dev.mutualCount !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Skills */}
        {dev.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {dev.skills.slice(0, 3).map((s, i) => (
              <span key={i} className="text-[9px] font-mono text-amber-500 surface-raised border border-subtle px-1.5 py-0.5 rounded-[2px]">{s}</span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted font-mono">
          {dev.location && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{dev.location}</span>}
          {dev.availabilityHours && <span className="flex items-center gap-0.5 text-emerald-500"><Clock className="h-2.5 w-2.5" />{dev.availabilityHours}h/wk</span>}
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
function ConnectionCard({ conn, onRemove }) {
  return (
    <div className="surface-card border border-subtle rounded-sm p-4 hover:border-normal transition flex items-start gap-4">
      <Link href={`/users/${conn.user.id}`} className="flex-shrink-0">
        <Avatar src={conn.user.avatarUrl} name={conn.user.username} size={12} />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/users/${conn.user.id}`} className="text-sm font-semibold text-primary hover:text-amber-500 transition block truncate font-mono">
          {conn.user.username}
        </Link>
        {conn.user.bio && (
          <p className="text-xs text-muted mt-0.5 line-clamp-2 font-sans">{conn.user.bio}</p>
        )}

        {/* Mutual connections */}
        {conn.mutualCount > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5 font-mono text-[10px] text-muted">
            <span>{conn.mutualCount} mutual connections</span>
          </div>
        )}

        {/* Skills */}
        {conn.user.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {conn.user.skills.slice(0, 4).map((s, i) => (
              <span key={i} className="text-[10px] font-mono text-amber-500 surface-raised border border-subtle px-1.5 py-0.5 rounded-[2px]">{s}</span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-subtle">
          <span className="text-[10px] text-muted font-mono">
            Connected {formatDistanceToNow(new Date(conn.connectedAt), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-2">
            <Link href={`/messages?user=${conn.user.id}`}
              className="text-[11px] font-mono text-amber-500 hover:text-amber-400 border border-subtle surface-raised px-2.5 py-1 rounded-sm transition">
              Message
            </Link>
            <button
              onClick={() => onRemove(conn.user.id, conn.user.username)}
              className="text-[11px] font-mono text-muted hover:text-red-400 border border-subtle hover:border-red-500 px-2.5 py-1 rounded-sm transition"
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
  const [tab, setTab] = useState("connections");
  const [search, setSearch] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());

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
    mutationFn: (id) => connectionsAPI.accept(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["connections"] });
      qc.invalidateQueries({ queryKey: ["connRequests"] });
    },
  });
  const rejectMut = useMutation({
    mutationFn: (id) => connectionsAPI.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["connRequests"] }),
  });
  const removeMut = useMutation({
    mutationFn: (userId) => connectionsAPI.remove(userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["connections"] }); setConfirmRemove(null); },
  });

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center py-20 text-gray-500">Please login to view connections</div>
  );

  const filtered = (connections ?? []).filter((c) =>
    !search.trim() || c.user.username.toLowerCase().includes(search.toLowerCase())
  );
  const pendingCount = requests?.length ?? 0;
  const suggestedFiltered = (suggested ?? []).filter((d) => !dismissed.has(d.id));

  return (
    <div className="space-y-5 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary">My Network</h1>
        <p className="text-xs text-muted mt-0.5 font-sans">Manage your developer connections and peers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm w-fit flex-wrap">
        {[
          { key: "connections", label: `Connections (${connections?.length ?? 0})`, icon: Users },
          { key: "requests",    label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ""}`, icon: UserPlus },
          { key: "discover",    label: "People You May Know", icon: UserPlus },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-mono transition ${tab === key ? "bg-amber-500 text-gray-950 font-bold" : "text-muted hover:text-primary"}`}>
            <Icon className="h-3.5 w-3.5" />{label}
            {key === "requests" && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-mono font-bold rounded-[2px] min-w-[14px] h-3.5 px-1 flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Connections tab ──────────────────────────────────────────────── */}
      {tab === "connections" && (
        <>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input type="text" placeholder="Search connections..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full surface-input border border-subtle text-primary text-xs pl-9 pr-3.5 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" />
          </div>

          {loadConn ? (
            <div className="grid grid-cols-1 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-28 surface-card border border-subtle rounded-sm animate-pulse" />)}
            </div>
          ) : filtered.length > 0 ? (
            <>
              <p className="text-xs text-gray-600 mb-4">{filtered.length} connection{filtered.length !== 1 ? "s" : ""}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.map((conn) => (
                  <ConnectionCard
                    key={conn.id}
                    conn={conn}
                    onRemove={(userId, username) => setConfirmRemove({ userId, username })}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 surface-card rounded-sm border border-subtle">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted" />
              <p className="text-primary font-medium mb-1 font-mono">No connections yet</p>
              <p className="text-xs text-muted mb-4 font-sans">Explore developers and send connection requests</p>
              <button onClick={() => setTab("discover")}
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-gray-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-2 rounded-sm transition">
                Find People
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Requests tab ────────────────────────────────────────────────── */}
      {tab === "requests" && (
        loadReq ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : requests && requests.length > 0 ? (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="surface-card border border-subtle rounded-sm p-4 flex items-center gap-4 hover:border-normal transition">
                <Link href={`/users/${req.sender.id}`} className="flex-shrink-0">
                  <Avatar src={req.sender.avatarUrl} name={req.sender.username} size={12} />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/users/${req.sender.id}`} className="text-sm font-semibold text-primary hover:text-amber-500 transition block truncate font-mono">
                    {req.sender.username}
                  </Link>
                  {req.sender.bio && <p className="text-xs text-muted mt-0.5 line-clamp-1 font-sans">{req.sender.bio}</p>}
                  {req.sender.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {req.sender.skills.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-[10px] font-mono text-amber-500 surface-raised border border-subtle px-1.5 py-0.5 rounded-[2px]">{s}</span>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted font-mono mt-1">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => acceptMut.mutate(req.id)} disabled={acceptMut.isPending}
                    className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-950 bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-sm disabled:opacity-50 transition">
                    <Check className="h-3.5 w-3.5" />Accept
                  </button>
                  <button onClick={() => rejectMut.mutate(req.id)} disabled={rejectMut.isPending}
                    className="flex items-center gap-1.5 text-xs font-mono text-muted border border-subtle surface-raised hover:text-primary px-3 py-1.5 rounded-sm disabled:opacity-50 transition">
                    <X className="h-3.5 w-3.5" />Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 surface-card rounded-sm border border-subtle">
            <UserPlus className="h-10 w-10 mx-auto mb-3 text-muted" />
            <p className="text-primary font-medium mb-1 font-mono">No pending requests</p>
            <p className="text-xs text-muted font-sans">You're all caught up!</p>
          </div>
        )
      )}

      {/* ── Discover / People You May Know tab ──────────────────────────── */}
      {tab === "discover" && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-mono font-bold text-primary">People You May Know</h2>
            <p className="text-xs text-muted font-sans">Based on your activity and network</p>
          </div>

          {loadSuggested ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-52 surface-card border border-subtle rounded-sm animate-pulse" />
              ))}
            </div>
          ) : suggestedFiltered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {suggestedFiltered.map((dev) => (
                <SuggestedCard
                  key={dev.id}
                  dev={dev}
                  onDismiss={id => setDismissed(prev => new Set([...prev, id]))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 surface-card rounded-sm border border-subtle">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted" />
              <p className="text-primary font-medium mb-1 font-mono">No suggestions right now</p>
              <p className="text-xs text-muted font-sans">Check back later as your network grows</p>
            </div>
          )}
        </>
      )}

      {/* ── Confirm Remove Modal ────────────────────────────────────────── */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-6 border border-subtle max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-red-950/40 border border-red-800/50 rounded-sm flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 text-red-400" />
              </div>
              <h3 className="text-sm font-mono font-bold text-primary">Remove Connection?</h3>
            </div>
            <p className="text-xs text-muted mb-5 font-sans">
              Are you sure you want to remove <span className="text-primary font-mono font-medium">{confirmRemove.username}</span> from your connections?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => removeMut.mutate(confirmRemove.userId)}
                disabled={removeMut.isPending}
                className="flex-1 bg-red-600 text-white py-2 rounded-sm text-xs font-mono font-bold hover:bg-red-500 disabled:opacity-50 transition">
                {removeMut.isPending ? "Removing…" : "Remove"}
              </button>
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 surface-raised border border-subtle text-muted hover:text-primary py-2 rounded-sm text-xs font-mono transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
