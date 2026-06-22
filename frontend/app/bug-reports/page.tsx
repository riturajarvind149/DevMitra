"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bugReportsAPI, projectsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Bug, Plus, ChevronDown, CheckCircle, Clock, AlertTriangle, XCircle, Flame, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const TYPE_OPTIONS = ["BUG", "UI_ISSUE", "PERFORMANCE", "SECURITY", "FEATURE_REQUEST"];
const SEVERITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "WONT_FIX"];

const severityColor: Record<string, string> = {
  LOW:      "bg-blue-900/40 text-blue-400",
  MEDIUM:   "bg-yellow-900/40 text-yellow-400",
  HIGH:     "bg-orange-900/40 text-orange-400",
  CRITICAL: "bg-red-900/40 text-red-400",
};
const statusColor: Record<string, string> = {
  OPEN:        "bg-indigo-900/40 text-indigo-400",
  IN_PROGRESS: "bg-yellow-900/40 text-yellow-400",
  RESOLVED:    "bg-green-900/40 text-green-400",
  WONT_FIX:    "bg-gray-700 text-gray-400",
};
const statusIcon: Record<string, any> = {
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
    mutationFn: () => bugReportsAPI.create(form as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myBugReports"] });
      setShowModal(false);
      setForm({ projectId: "", title: "", description: "", type: "BUG", severity: "MEDIUM" });
    },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to create bug report"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => bugReportsAPI.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myBugReports"] }),
  });

  const filtered = filterStatus ? myReports.filter((r: any) => r.status === filterStatus) : myReports;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-400" /> Bug Reports
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Track bugs and feature requests you've reported</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition"
        >
          <Plus className="h-4 w-4" /> Report Issue
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["", ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterStatus === s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {s || "All"} {s && `(${myReports.filter((r: any) => r.status === s).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-10 text-center">
          <Bug className="h-10 w-10 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 font-medium">No bug reports yet</p>
          <p className="text-sm text-gray-600 mt-1">Report a bug or request a feature to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report: any) => {
            const SIcon = statusIcon[report.status] ?? Clock;
            return (
              <div key={report.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 hover:border-gray-700 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityColor[report.severity] ?? "bg-gray-800 text-gray-400"}`}>
                        {report.severity}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                        {report.type.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white truncate">{report.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{report.description}</p>
                    {report.project && (
                      <Link href={`/projects/${report.project.id}`} className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1 block truncate">
                        → {report.project.title}
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full ${statusColor[report.status]}`}>
                      <SIcon className="h-3 w-3" /> {report.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-gray-600">
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
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-400" /> Report an Issue
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="p-5 space-y-4">
              {/* Project select */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Project *</label>
                <select
                  required
                  value={form.projectId}
                  onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select a project…</option>
                  {(myProjectsData ?? []).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Type + Severity row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                  >
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(f => ({ ...f, severity: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                  >
                    {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Brief summary of the issue"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Steps to reproduce, expected vs actual behaviour…"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {createMut.isPending ? "Submitting…" : "Submit Report"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition"
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
