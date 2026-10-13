"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bugReportsAPI, projectsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Bug, Plus, CheckCircle, Clock, XCircle, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const TYPE_OPTIONS = ["BUG", "UI_ISSUE", "PERFORMANCE", "SECURITY", "FEATURE_REQUEST"];
const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"];

const severityColor = {
  LOW:      "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  MEDIUM:   "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  HIGH:     "bg-orange-500/10 text-orange-500 border border-orange-500/20",
  CRITICAL: "bg-red-500/10 text-red-500 border border-red-500/20",
};
const statusColor = {
  OPEN:        "bg-amber-500/10 text-amber-500 border border-amber-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  RESOLVED:    "bg-green-500/10 text-green-500 border border-green-500/20",
  WONT_FIX:    "surface-input text-muted border border-subtle",
};
const statusIcon = {
  OPEN:        Clock,
  IN_PROGRESS: Flame,
  RESOLVED:    CheckCircle,
  WONT_FIX:    XCircle,
};

export default function BugReportsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({ projectId: "", title: "", description: "", type: "BUG", severity: "MEDIUM" });

  const { data: myReports = [], isLoading } = useQuery({
    queryKey: ["myBugReports"],
    queryFn: async () => { const { data } = await bugReportsAPI.getMine(); return data; },
    enabled: !!user,
  });

  const { data: myProjectsData } = useQuery({
    queryKey: ["myProjects"],
    queryFn: async () => { const { data } = await projectsAPI.getMyProjects(); return data; },
    enabled: !!user,
  });

  const createMut = useMutation({
    mutationFn: () => bugReportsAPI.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myBugReports"] });
      setShowModal(false);
      setForm({ projectId: "", title: "", description: "", type: "BUG", severity: "MEDIUM" });
    },
    onError: (e) => alert(e.response?.data?.message || "Failed to create bug report"),
  });

  const filtered = filterStatus ? myReports.filter((r) => r.status === filterStatus) : myReports;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <Bug className="h-5 w-5 text-amber-500" /> Bug Reports
          </h1>
          <p className="text-xs text-secondary mt-0.5 font-mono">Track bugs and feature requests you've reported</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-amber-500 text-black px-3.5 py-1.5 rounded-sm text-xs font-semibold hover:bg-amber-400 transition"
        >
          <Plus className="h-4 w-4" /> Report Issue
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {["", ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-sm text-xs font-mono font-medium transition ${
              filterStatus === s
                ? "bg-amber-500 text-black font-semibold"
                : "surface-input border border-subtle text-secondary hover:text-primary hover:border-amber-500/40"
            }`}
          >
            {s || "All"} {s && `(${myReports.filter((r) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 surface-card border border-subtle rounded-sm animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface-card rounded-sm border border-subtle p-10 text-center">
          <Bug className="h-8 w-8 mx-auto mb-3 text-muted" />
          <p className="text-primary font-medium text-sm">No bug reports yet</p>
          <p className="text-xs text-muted mt-1 font-mono">Report a bug or request a feature to get started</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((report) => {
            const SIcon = statusIcon[report.status] ?? Clock;
            return (
              <div key={report.id} className="surface-card rounded-sm border border-subtle p-4 hover:border-amber-500/30 transition shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm ${severityColor[report.severity] ?? "surface-input text-muted border border-subtle"}`}>
                        {report.severity}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm surface-input border border-subtle text-secondary">
                        {report.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-primary truncate">{report.title}</p>
                    <p className="text-xs text-secondary mt-0.5 line-clamp-2">{report.description}</p>
                    {report.project && (
                      <Link href={`/projects/${report.project.id}`} className="text-xs font-mono text-amber-500 hover:text-amber-400 mt-1 block truncate">
                        → {report.project.title}
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-sm ${statusColor[report.status]}`}>
                      <SIcon className="h-3 w-3" /> {report.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm max-w-lg w-full border border-subtle shadow-xl">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Bug className="h-4 w-4 text-amber-500" /> Report an Issue
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-primary font-mono text-sm">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="p-4 space-y-3.5">
              {/* Project select */}
              <div>
                <label className="block text-xs font-mono text-secondary mb-1">Project *</label>
                <select
                  required
                  value={form.projectId}
                  onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select a project…</option>
                  {(myProjectsData ?? []).map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Type + Severity row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-secondary mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none"
                  >
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-secondary mb-1">Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none"
                  >
                    {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-mono text-secondary mb-1">Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Brief summary of the issue"
                  className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono text-secondary mb-1">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Steps to reproduce, expected vs actual behaviour…"
                  className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 bg-amber-500 text-black py-2 rounded-sm text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 transition"
                >
                  {createMut.isPending ? "Submitting…" : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 surface-input border border-subtle text-secondary py-2 rounded-sm text-xs font-medium hover:text-primary transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
