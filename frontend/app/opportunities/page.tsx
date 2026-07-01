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
function AppChat({ oppId, appId, ownerId, applicantId }: { oppId: string; appId: string; ownerId: string; applicantId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [msg, setMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const canAccess = user?.id === ownerId || user?.id === applicantId;

  const { data: comments = [] } = useQuery<any[]>({
    queryKey: ["oppChat", oppId, appId],
    queryFn: async () => { const { data } = await opportunitiesAPI.getAppComments(oppId, appId); return data; },
    enabled: canAccess,
    refetchInterval: 8000,
    staleTime: 5000,
  });

  const addMut = useMutation({
    mutationFn: () => opportunitiesAPI.addAppComment(oppId, appId, msg.trim()),
    onSuccess: (res) => {
      qc.setQueryData(["oppChat", oppId, appId], (old: any[]) => [...(old ?? []), res.data]);
      setMsg("");
    },
  });

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments.length]);

  if (!canAccess) return <p className="text-xs text-gray-600 text-center py-3">Private thread.</p>;

  return (
    <div className="flex flex-col border-t border-gray-800 mt-3 pt-3">
      <p className="text-[10px] text-gray-500 mb-2 flex items-center gap-1">
        <MessageSquare className="h-3 w-3 text-indigo-400" />
        Private thread — visible only to applicant and opportunity owner
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto mb-2" style={{ scrollbarWidth: "thin" }}>
        {comments.length === 0
          ? <p className="text-xs text-gray-600 text-center py-2">No messages yet.</p>
          : comments.map((c: any) => {
              const mine = c.author?.id === user?.id;
              return (
                <div key={c.id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  {c.author?.avatarUrl
                    ? <img src={c.author.avatarUrl} alt="" className="w-5 h-5 rounded-full flex-shrink-0" />
                    : <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold text-white">{c.author?.username?.charAt(0).toUpperCase()}</span>
                      </div>}
                  <div className={`px-3 py-1.5 rounded-2xl text-xs max-w-[75%] ${mine ? "bg-indigo-600 text-white rounded-br-sm" : "bg-gray-800 text-gray-200 rounded-bl-sm"}`}>
                    {c.content}
                    <span className="block text-[9px] opacity-60 mt-0.5">{formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              );
            })}
        <div ref={bottomRef} />
      </div>
      <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (msg.trim()) addMut.mutate(); }}>
        <input type="text" value={msg} onChange={e => setMsg(e.target.value)}
          placeholder="Message about this application…"
          className="flex-1 bg-gray-800 border border-gray-700 text-white text-xs px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none" />
        <button type="submit" disabled={!msg.trim() || addMut.isPending}
          className="w-8 h-8 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center flex-shrink-0">
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}

// ── Opportunity detail card (expandable) ──────────────────────────────────────
function OppCard({ opp, isMyOpp }: { opp: any; isMyOpp: boolean }) {
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
    mutationFn: (appId: string) => opportunitiesAPI.approveApp(opp.id, appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oppDetail", opp.id] }),
  });
  const rejectMut = useMutation({
    mutationFn: (appId: string) => opportunitiesAPI.rejectApp(opp.id, appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["oppDetail", opp.id] }),
  });
  const closeMut = useMutation({
    mutationFn: () => opportunitiesAPI.update(opp.id, { status: "CLOSED" } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["myOpps"] }); setConfirmClose(false); },
  });

  const STATUS_COLOR: Record<string, string> = {
    PENDING: "bg-yellow-900/40 text-yellow-400",
    APPROVED: "bg-green-900/40 text-green-400",
    REJECTED: "bg-red-900/40 text-red-400",
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition">
      {/* Main card — whole card clickable to expand */}
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded-full">{opp.role}</span>
              {opp.isRemote && <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full"><Wifi className="h-3 w-3" />Remote</span>}
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${opp.status === "OPEN" ? "text-green-400 bg-green-900/30" : "text-gray-500 bg-gray-800"}`}>{opp.status}</span>
              {hasApplied && <span className="text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">✓ Applied</span>}
            </div>
            <h3 className="text-base font-semibold text-white">{opp.title}</h3>
          </div>
          {/* Arrow indicator — clicking also toggles */}
          <div className="p-1.5 text-gray-500 hover:text-white transition flex-shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{opp.description}</p>
        <div className="flex flex-wrap gap-1 mb-3">
          {opp.requiredSkills?.slice(0, 5).map((s: string, i: number) => (
            <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap">
            {opp.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{opp.duration}</span>}
            {opp.budget && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{opp.budget}</span>}
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{opp._count?.applications ?? 0} applicants</span>
            <span className="flex items-center gap-1">by {opp.owner?.username}</span>
          </div>
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {isMyOpp && opp.status === "OPEN" && (
              <button onClick={() => setConfirmClose(true)} className="text-xs text-red-400 border border-red-800 px-3 py-1.5 rounded-xl hover:bg-red-900/20 transition">Close</button>
            )}
            {!isMyOpp && !hasApplied && opp.status === "OPEN" && (
              <button onClick={() => setApplyModal(true)} className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition">
                Apply <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="border-t border-gray-800 px-5 py-4 space-y-4">
          {/* Full description */}
          <p className="text-sm text-gray-300 leading-relaxed">{opp.description}</p>

          {/* Applicants (owner sees all with approve/reject + chat) */}
          {isMyOpp && detail?.applications && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Applicants ({detail.applications.length})</h4>
              {detail.applications.length === 0
                ? <p className="text-xs text-gray-600">No applications yet.</p>
                : detail.applications.map((app: any) => (
                    <div key={app.id} className="mb-4 bg-gray-800/60 rounded-xl p-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {app.applicant?.avatarUrl
                            ? <img src={app.applicant.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                            : <div className="w-8 h-8 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">{app.applicant?.username?.charAt(0).toUpperCase()}</div>}
                          <div>
                            <p className="text-sm font-medium text-white">{app.applicant?.username}</p>
                            <p className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[app.status] ?? "bg-gray-700 text-gray-400"}`}>{app.status}</span>
                          {app.status === "PENDING" && (
                            <>
                              <button onClick={() => approveMut.mutate(app.id)} disabled={approveMut.isPending}
                                className="flex items-center gap-1 text-xs text-green-400 border border-green-800 px-2 py-1 rounded-lg hover:bg-green-900/20 transition">
                                <Check className="h-3 w-3" />Approve
                              </button>
                              <button onClick={() => rejectMut.mutate(app.id)} disabled={rejectMut.isPending}
                                className="flex items-center gap-1 text-xs text-red-400 border border-red-800 px-2 py-1 rounded-lg hover:bg-red-900/20 transition">
                                <X className="h-3 w-3" />Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-1"><span className="text-gray-500">Experience:</span> {app.experience}</p>
                      {app.message && <p className="text-xs text-gray-400 mb-1"><span className="text-gray-500">Message:</span> {app.message}</p>}
                      {app.githubUrl && <a href={app.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 block mb-1">GitHub →</a>}
                      <AppChat oppId={opp.id} appId={app.id} ownerId={opp.ownerId} applicantId={app.applicantId} />
                    </div>
                  ))
              }
            </div>
          )}

          {/* Applicant sees their own application + chat */}
          {!isMyOpp && hasApplied && myApp && (
            <div className="bg-gray-800/60 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-white">Your Application</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[myApp.status] ?? "bg-gray-700 text-gray-400"}`}>{myApp.status}</span>
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
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-red-900/50 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
              <h3 className="text-base font-semibold text-white">Close Opportunity?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">This will stop accepting new applications.</p>
            <div className="flex gap-3">
              <button onClick={() => closeMut.mutate()} disabled={closeMut.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition">
                {closeMut.isPending ? "Closing…" : "Close"}
              </button>
              <button onClick={() => setConfirmClose(false)} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({ oppId, onClose, onSuccess }: { oppId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ experience: "", githubUrl: "", portfolioUrl: "", message: "" });
  const mut = useMutation({
    mutationFn: () => opportunitiesAPI.apply(oppId, form),
    onSuccess: () => { onSuccess(); onClose(); },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to apply"),
  });
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Apply for Opportunity</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="p-5 space-y-4">
          <div><label className="block text-sm text-gray-400 mb-1.5">Your Experience *</label>
            <textarea required value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} rows={3}
              placeholder="Describe your relevant experience…"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-400 mb-1.5">GitHub URL</label>
              <input type="url" value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))}
                placeholder="https://github.com/…" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" /></div>
            <div><label className="block text-sm text-gray-400 mb-1.5">Portfolio URL</label>
              <input type="url" value={form.portfolioUrl} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                placeholder="https://…" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" /></div>
          </div>
          <div><label className="block text-sm text-gray-400 mb-1.5">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" /></div>
          <div className="flex gap-3">
            <button type="submit" disabled={mut.isPending}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
              {mut.isPending ? "Submitting…" : "Submit Application"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Post Modal ────────────────────────────────────────────────────────────────
function PostModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", role: "", description: "", requiredSkills: "", duration: "", budget: "", isRemote: true });
  const mut = useMutation({
    mutationFn: () => opportunitiesAPI.create({ ...form, requiredSkills: form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean) } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["myOpps"] }); qc.invalidateQueries({ queryKey: ["allOpps"] }); onClose(); },
    onError: (e: any) => alert(e.response?.data?.message || "Failed"),
  });
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700 my-4 flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base font-semibold text-white">Post an Opportunity</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div><label className="block text-sm text-gray-400 mb-1.5">Title *</label>
            <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. React Developer Needed" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" /></div>
          <div><label className="block text-sm text-gray-400 mb-1.5">Role *</label>
            <input required type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Frontend Developer" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" /></div>
          <div><label className="block text-sm text-gray-400 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" /></div>
          <div><label className="block text-sm text-gray-400 mb-1.5">Required Skills (comma-separated)</label>
            <input type="text" value={form.requiredSkills} onChange={e => setForm(f => ({ ...f, requiredSkills: e.target.value }))}
              placeholder="React, TypeScript, Node.js" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-400 mb-1.5">Duration</label>
              <input type="text" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="3 months" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" /></div>
            <div><label className="block text-sm text-gray-400 mb-1.5">Compensation</label>
              <input type="text" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="$500 / Volunteer" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRemote} onChange={e => setForm(f => ({ ...f, isRemote: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm text-gray-400">Remote position</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={mut.isPending} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
              {mut.isPending ? "Posting…" : "Post Opportunity"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
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
  const [tab, setTab] = useState<"all" | "mine" | "applied">("all");
  const [showPost, setShowPost] = useState(false);

  // All opportunities
  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ["allOpps", search],
    queryFn: async () => { const { data } = await opportunitiesAPI.getAll({ search: search || undefined, limit: 50 }); return data; },
  });

  // My posted opportunities
  const { data: myOpps = [], isLoading: loadingMine } = useQuery<any[]>({
    queryKey: ["myOpps"],
    queryFn: async () => {
      const { data } = await opportunitiesAPI.getMine();
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated,
    staleTime: 10000,
  });

  // All opportunities excluding my own
  const allExclMine = (allData?.opportunities ?? []).filter((o: any) => o.ownerId !== user?.id);
  const isLoading = tab === "all" ? loadingAll : loadingMine;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Briefcase className="h-6 w-6 text-yellow-400" />Opportunities</h1>
          <p className="text-sm text-gray-500 mt-0.5">Find collaboration opportunities or post your own</p>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowPost(true)}
            className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition">
            <Plus className="h-4 w-4" />Post Opportunity
          </button>
        )}
      </div>

      {/* Tabs */}
      {isAuthenticated && (
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-5 w-fit">
          {[
            { key: "all",     label: `Browse (${allExclMine.length})` },
            { key: "mine",    label: `My Posts (${myOpps.length})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Search (only on Browse tab) */}
      {tab === "all" && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input type="text" placeholder="Search opportunities, roles, skills…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 text-white text-sm pl-11 pr-4 py-3 rounded-2xl focus:border-indigo-500 focus:outline-none" />
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : tab === "all" ? (
        allExclMine.length > 0 ? (
          <div className="space-y-3">
            {allExclMine.map((opp: any) => <OppCard key={opp.id} opp={opp} isMyOpp={false} />)}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-700" />
            <p className="text-white font-medium mb-1">No opportunities found</p>
            <p className="text-sm text-gray-500 mb-4">Be the first to post a collaboration opportunity</p>
            {isAuthenticated && <button onClick={() => setShowPost(true)} className="text-sm text-indigo-400 hover:text-indigo-300">Post an Opportunity →</button>}
          </div>
        )
      ) : (
        myOpps.length > 0 ? (
          <div className="space-y-3">
            {myOpps.map((opp: any) => <OppCard key={opp.id} opp={opp} isMyOpp={true} />)}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
            <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-700" />
            <p className="text-white font-medium mb-1">No opportunities posted yet</p>
            <button onClick={() => setShowPost(true)} className="mt-3 text-sm text-indigo-400 hover:text-indigo-300">Post your first opportunity →</button>
          </div>
        )
      )}

      {showPost && <PostModal onClose={() => setShowPost(false)} />}
    </div>
  );
}
