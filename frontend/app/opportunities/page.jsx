"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { opportunitiesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import {
  Briefcase, Plus, Search, Clock, DollarSign, ChevronRight, Wifi,
  X, Check, AlertTriangle, MessageSquare, Send, ChevronDown, ChevronUp, Users,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ── Private chat component for an application ────────────────────────────────
function AppChat({ oppId, appId, ownerId, applicantId }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const bottomRef = useRef(null);
  const canAccess = user?.id === ownerId || user?.id === applicantId;

  const { data: comments = [] } = useQuery({
    queryKey: ["oppChat", oppId, appId],
    queryFn: async () => { const { data } = await opportunitiesAPI.getAppComments(oppId, appId); return data; },
    enabled: canAccess,
    refetchInterval: 8000,
    staleTime: 5000,
  });

  const addMut = useMutation({
    mutationFn: () => opportunitiesAPI.addAppComment(oppId, appId, msg.trim()),
    onSuccess: (res) => {
      qc.setQueryData(["oppChat", oppId, appId], (old) => [...(old ?? []), res.data]);
      setMsg("");
    },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments.length]);

  if (!canAccess) return <p className="text-xs text-gray-600 text-center py-3">Private thread.</p>;

  return (
    <div className="flex flex-col border-t border-subtle mt-3 pt-3">
      <p className="text-[10px] text-muted mb-2 flex items-center gap-1 font-mono">
        <MessageSquare className="h-3 w-3 text-amber-500" />
        Private thread — visible only to applicant and opportunity owner
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto mb-2" style={{ scrollbarWidth: "thin" }}>
        {comments.length === 0
          ? <p className="text-xs text-muted text-center py-2 font-mono">No messages yet.</p>
          : comments.map((c) => {
              const mine = c.author?.id === user?.id;
              return (
                <div key={c.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  {c.author?.avatarUrl
                    ? <img src={c.author.avatarUrl} alt="" className="w-5 h-5 rounded-sm object-cover flex-shrink-0" />
                    : <div className="w-5 h-5 rounded-sm bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center flex-shrink-0 font-bold">
                        <span className="text-[8px]">{c.author?.username?.charAt(0).toUpperCase()}</span>
                      </div>}
                  <div className={`px-3 py-1.5 rounded-sm text-xs max-w-[75%] ${mine ? "bg-amber-500 text-black font-semibold" : "surface-input border border-subtle text-primary"}`}>
                    {c.content}
                    <span className="block text-[9px] opacity-70 mt-0.5 font-mono">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              );
            })}
        <div ref={bottomRef} />
      </div>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (msg.trim()) addMut.mutate(); }}>
        <input type="text" value={msg} onChange={e => setMsg(e.target.value)}
          placeholder="Message about this application…"
          className="flex-1 surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted font-mono" />
        <button type="submit" disabled={!msg.trim() || addMut.isPending}
          className="w-8 h-8 bg-amber-500 text-black rounded-sm hover:bg-amber-400 disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-sm transition">
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

// ── Opportunity detail card (expandable) ──────────────────────────────────────
function OppCard({ opp, isMyOpp }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [applyModal, setApplyModal] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const { data: checkData } = useQuery({
    queryKey: ["oppCheck", opp.id],
    queryFn: async () => { const { data } = await opportunitiesAPI.checkApplied(opp.id); return data; },
    enabled: !!user && !isMyOpp,
    staleTime: 30000,
  });
  const hasApplied = checkData?.applied ?? false;
  const myApp = checkData?.application;

  const { data: detail } = useQuery({
    queryKey: ["oppDetail", opp.id],
    queryFn: async () => { const { data } = await opportunitiesAPI.getById(opp.id); return data; },
    enabled: expanded,
    staleTime: 30000,
  });

  const approveMut = useMutation({
    mutationFn: (appId) => opportunitiesAPI.approveApp(opp.id, appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oppDetail", opp.id] }),
  });
  const rejectMut = useMutation({
    mutationFn: (appId) => opportunitiesAPI.rejectApp(opp.id, appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oppDetail", opp.id] }),
  });
  const closeMut = useMutation({
    mutationFn: () => opportunitiesAPI.update(opp.id, { status: "CLOSED" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["myOpps"] }); setConfirmClose(false); },
  });

  const STATUS_COLOR = {
    PENDING: "bg-yellow-900/40 text-yellow-400",
    APPROVED: "bg-green-900/40 text-green-400",
    REJECTED: "bg-red-900/40 text-red-400",
  };

  return (
    <div className="surface-card border border-subtle rounded-sm overflow-hidden hover:border-amber-500/40 transition">
      {/* Main card — whole card clickable to expand */}
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-xs font-mono font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-sm">{opp.role}</span>
              {opp.isRemote && <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-sm font-mono"><Wifi className="h-3 w-3" />Remote</span>}
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-medium ${opp.status === "OPEN" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30" : "text-muted surface-raised border border-subtle"}`}>{opp.status}</span>
              {hasApplied && <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-sm">✓ Applied</span>}
            </div>
            <h3 className="text-base font-semibold text-primary">{opp.title}</h3>
          </div>
          {/* Arrow indicator — clicking also toggles */}
          <div className="p-1.5 text-muted hover:text-primary transition flex-shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        <p className="text-sm text-secondary line-clamp-2 mb-3 leading-relaxed">{opp.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {opp.requiredSkills?.slice(0, 5).map((s, i) => (
            <span key={i} className="text-[10px] font-mono text-secondary bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-sm">{s}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-subtle">
          <div className="flex items-center gap-3 text-[10px] text-muted font-mono flex-wrap">
            {opp.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{opp.duration}</span>}
            {opp.budget && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{opp.budget}</span>}
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{opp._count?.applications ?? 0} applicants</span>
            <span className="flex items-center gap-1">by {opp.owner?.username}</span>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {isMyOpp && opp.status === "OPEN" && (
              <button onClick={() => setConfirmClose(true)} className="text-xs font-mono text-secondary border border-subtle px-3 py-1.5 rounded-sm hover:text-red-400 hover:border-red-500/40 transition">Close</button>
            )}
            {!isMyOpp && !hasApplied && opp.status === "OPEN" && (
              <button onClick={() => setApplyModal(true)} className="flex items-center gap-1 text-xs font-semibold text-black bg-amber-500 px-3 py-1.5 rounded-sm hover:bg-amber-400 shadow-sm transition">
                Apply <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-subtle px-5 py-4 space-y-4">
          {/* Full description */}
          <p className="text-sm text-secondary leading-relaxed">{opp.description}</p>

          {/* Applicants (owner sees all with approve/reject + chat) */}
          {isMyOpp && detail?.applications && (
            <div>
              <h4 className="text-xs font-semibold text-muted font-mono uppercase tracking-wider mb-3">Applicants ({detail.applications.length})</h4>
              {detail.applications.length === 0
                ? <p className="text-xs text-muted font-mono">No applications yet.</p>
                : detail.applications.map((app) => (
                    <div key={app.id} className="mb-4 surface-input border border-subtle rounded-sm p-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {app.applicant?.avatarUrl
                            ? <img src={app.applicant.avatarUrl} alt="" className="w-8 h-8 rounded-sm object-cover" />
                            : <div className="w-8 h-8 rounded-sm bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center text-xs font-bold">{app.applicant?.username?.charAt(0).toUpperCase()}</div>}
                          <div>
                            <p className="text-sm font-medium text-primary">{app.applicant?.username}</p>
                            <p className="text-[10px] text-muted font-mono">{formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-medium ${STATUS_COLOR[app.status] ?? "surface-raised text-muted border border-subtle"}`}>{app.status}</span>
                          {app.status === "PENDING" && (
                            <>
                              <button onClick={() => approveMut.mutate(app.id)} disabled={approveMut.isPending}
                                className="flex items-center gap-1 text-xs text-emerald-400 border border-emerald-500/40 px-2 py-1 rounded-sm hover:bg-emerald-500/10 transition font-mono">
                                <Check className="h-3 w-3" />Approve
                              </button>
                              <button onClick={() => rejectMut.mutate(app.id)} disabled={rejectMut.isPending}
                                className="flex items-center gap-1 text-xs text-secondary border border-subtle px-2 py-1 rounded-sm hover:text-red-400 hover:border-red-500/40 transition font-mono">
                                <X className="h-3 w-3" />Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-secondary mb-1"><span className="text-muted font-mono">Experience:</span> {app.experience}</p>
                      {app.message && <p className="text-xs text-secondary mb-1"><span className="text-muted font-mono">Message:</span> {app.message}</p>}
                      {app.githubUrl && <a href={app.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 hover:underline block mb-1 font-mono">GitHub →</a>}
                      <AppChat oppId={opp.id} appId={app.id} ownerId={opp.ownerId} applicantId={app.applicantId} />
                    </div>
                  ))
              }
            </div>
          )}

          {/* Applicant sees their own application + chat */}
          {!isMyOpp && hasApplied && myApp && (
            <div className="surface-input border border-subtle rounded-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono font-medium text-primary">Your Application</p>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm font-semibold ${STATUS_COLOR[myApp.status] ?? "surface-raised text-muted border border-subtle"}`}>{myApp.status}</span>
              </div>
              <AppChat oppId={opp.id} appId={myApp.id} ownerId={opp.ownerId} applicantId={myApp.applicantId} />
            </div>
          )}
        </div>
      )}

      {/* Apply modal */}
      {applyModal && <ApplyModal oppId={opp.id} onClose={() => setApplyModal(false)} onSuccess={() => { qc.invalidateQueries({ queryKey: ["oppCheck", opp.id] }); }} />}

      {/* Close confirm */}
      {confirmClose && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-5 border border-red-500/30 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-red-500/10 rounded-sm flex items-center justify-center border border-red-500/20"><AlertTriangle className="h-4 w-4 text-red-500" /></div>
              <h3 className="text-sm font-semibold text-primary">Close Opportunity?</h3>
            </div>
            <p className="text-xs text-secondary mb-4 font-mono">This will stop accepting new applications.</p>
            <div className="flex gap-2.5">
              <button onClick={() => closeMut.mutate()} disabled={closeMut.isPending}
                className="flex-1 bg-red-600 text-white py-2 rounded-sm text-xs font-semibold hover:bg-red-700 disabled:opacity-50 transition">
                {closeMut.isPending ? "Closing…" : "Close"}
              </button>
              <button onClick={() => setConfirmClose(false)} className="flex-1 surface-input border border-subtle text-secondary py-2 rounded-sm text-xs font-medium hover:text-primary transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({ oppId, onClose, onSuccess }) {
  const [form, setForm] = useState({ experience: "", githubUrl: "", portfolioUrl: "", message: "" });
  const mut = useMutation({
    mutationFn: () => opportunitiesAPI.apply(oppId, form),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e) => alert(e.response?.data?.message || "Failed to apply"),
  });
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="surface-card rounded-sm max-w-md w-full border border-subtle shadow-2xl">
        <div className="p-5 border-b border-subtle flex items-center justify-between">
          <h2 className="text-base font-semibold text-primary">Apply for Opportunity</h2>
          <button onClick={onClose} className="text-muted hover:text-primary"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="p-5 space-y-4">
          <div><label className="block text-sm text-secondary font-medium mb-1.5">Your Experience *</label>
            <textarea required value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} rows={3}
              placeholder="Describe your relevant experience…"
              className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none resize-none placeholder-muted" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-secondary font-medium mb-1.5">GitHub URL</label>
              <input type="url" value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))}
                placeholder="https://github.com/…" className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted font-mono" /></div>
            <div><label className="block text-sm text-secondary font-medium mb-1.5">Portfolio URL</label>
              <input type="url" value={form.portfolioUrl} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                placeholder="https://…" className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted font-mono" /></div>
          </div>
          <div><label className="block text-sm text-secondary font-medium mb-1.5">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2}
              className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none resize-none placeholder-muted" /></div>
          <div className="flex gap-3">
            <button type="submit" disabled={mut.isPending}
              className="flex-1 bg-amber-500 text-black py-2.5 rounded-sm text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition shadow-sm">
              {mut.isPending ? "Submitting…" : "Submit Application"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 surface-raised border border-subtle text-secondary py-2.5 rounded-sm text-sm font-medium hover:text-primary transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Post Modal ────────────────────────────────────────────────────────────────
function PostModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", role: "", description: "", requiredSkills: "", duration: "", budget: "", isRemote: true });
  const mut = useMutation({
    mutationFn: () => opportunitiesAPI.create({ ...form, requiredSkills: form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["myOpps"] }); qc.invalidateQueries({ queryKey: ["allOpps"] }); onClose(); },
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="surface-card rounded-sm max-w-lg w-full border border-subtle shadow-2xl my-4 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-subtle flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-semibold text-primary">Post an Opportunity</h2>
          <button onClick={onClose} className="text-muted hover:text-primary"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div><label className="block text-sm text-secondary font-medium mb-1.5">Title *</label>
            <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. React Developer Needed" className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted" /></div>
          <div><label className="block text-sm text-secondary font-medium mb-1.5">Role *</label>
            <input required type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Frontend Developer" className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted" /></div>
          <div><label className="block text-sm text-secondary font-medium mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none resize-none placeholder-muted" /></div>
          <div><label className="block text-sm text-secondary font-medium mb-1.5">Required Skills (comma-separated)</label>
            <input type="text" value={form.requiredSkills} onChange={e => setForm(f => ({ ...f, requiredSkills: e.target.value }))}
              placeholder="React, TypeScript, Node.js" className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted font-mono" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-secondary font-medium mb-1.5">Duration</label>
              <input type="text" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="3 months" className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted font-mono" /></div>
            <div><label className="block text-sm text-secondary font-medium mb-1.5">Compensation</label>
              <input type="text" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="$500 / Volunteer" className="w-full surface-input border border-subtle text-primary text-sm px-4 py-2.5 rounded-sm focus:border-amber-500 focus:outline-none placeholder-muted font-mono" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRemote} onChange={e => setForm(f => ({ ...f, isRemote: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
            <span className="text-sm text-secondary">Remote position</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={mut.isPending} className="flex-1 bg-amber-500 text-black py-2.5 rounded-sm text-sm font-semibold hover:bg-amber-400 disabled:opacity-50 transition shadow-sm">
              {mut.isPending ? "Posting…" : "Post Opportunity"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 surface-raised border border-subtle text-secondary py-2.5 rounded-sm text-sm font-medium hover:text-primary transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function OpportunitiesPage() {
  const { isAuthenticated, user } = useAuth();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [showPost, setShowPost] = useState(false);

  // All opportunities
  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ["allOpps", search],
    queryFn: async () => { const { data } = await opportunitiesAPI.getAll({ search: search || undefined, limit: 50 }); return data; },
  });

  // My posted opportunities
  const { data: myOpps = [], isLoading: loadingMine } = useQuery({
    queryKey: ["myOpps"],
    queryFn: async () => {
      const { data } = await opportunitiesAPI.getMine();
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated,
    staleTime: 10000,
  });

  // All opportunities excluding my own
  const allExclMine = (allData?.opportunities ?? []).filter((o) => o.ownerId !== user?.id);
  const isLoading = tab === "all" ? loadingAll : loadingMine;

  return (
    <div className="space-y-5 font-sans">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-amber-500" />
            <span>Opportunities</span>
          </h1>
          <p className="text-xs text-muted mt-0.5 font-sans">Find open project roles or post opportunities for your repository</p>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowPost(true)}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-2 rounded-sm transition">
            <Plus className="h-3.5 w-3.5" />Post Opportunity
          </button>
        )}
      </div>

      {/* Tabs */}
      {isAuthenticated && (
        <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm w-fit">
          {[
            { key: "all",     label: `Browse (${allExclMine.length})` },
            { key: "mine",    label: `My Posts (${myOpps.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-3.5 py-1.5 rounded-sm text-xs font-mono transition ${tab === key ? "bg-amber-500 text-gray-950 font-bold" : "text-muted hover:text-primary"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Search (only on Browse tab) */}
      {tab === "all" && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input type="text" placeholder="Search opportunities, roles, skills..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full surface-input border border-subtle text-primary text-xs pl-9 pr-3.5 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : tab === "all" ? (
        allExclMine.length > 0 ? (
          <div className="space-y-3">
            {allExclMine.map((opp) => <OppCard key={opp.id} opp={opp} isMyOpp={false} />)}
          </div>
        ) : (
          <div className="text-center py-20 surface-card rounded-sm border border-subtle">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted" />
            <p className="text-primary font-medium mb-1">No opportunities found</p>
            <p className="text-sm text-muted mb-4 font-mono">Be the first to post a collaboration opportunity</p>
            {isAuthenticated && <button onClick={() => setShowPost(true)} className="text-sm text-amber-500 hover:underline font-mono">Post an Opportunity →</button>}
          </div>
        )
      ) : (
        myOpps.length > 0 ? (
          <div className="space-y-3">
            {myOpps.map((opp) => <OppCard key={opp.id} opp={opp} isMyOpp={true} />)}
          </div>
        ) : (
          <div className="text-center py-20 surface-card rounded-sm border border-subtle">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-muted" />
            <p className="text-primary font-medium mb-1">No opportunities posted yet</p>
            <button onClick={() => setShowPost(true)} className="mt-3 text-sm text-amber-500 hover:underline font-mono">Post your first opportunity →</button>
          </div>
        )
      )}

      {showPost && <PostModal onClose={() => setShowPost(false)} />}
    </div>
  );
}
