"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pullRequestsAPI, projectsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GitPullRequest, Plus, Clock, GitMerge, XCircle, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const STATUS_COLORS = {
  OPEN:          "surface-raised border border-amber-500/30 text-amber-500",
  UNDER_REVIEW:  "surface-raised border border-amber-500/30 text-amber-400",
  MERGED:        "surface-raised border border-emerald-500/30 text-emerald-500",
  CLOSED:        "surface-raised border border-subtle text-muted",
};
const STATUS_ICONS = {
  OPEN:         Clock,
  UNDER_REVIEW: Clock,
  MERGED:       GitMerge,
  CLOSED:       XCircle,
};
const TYPE_OPTIONS = ["FEATURE", "BUG_FIX", "REFACTOR", "DOCS", "TEST"];
const REVIEW_STATUSES = ["UNDER_REVIEW", "MERGED", "CLOSED"];

export default function PullRequestsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [tab, setTab] = useState("mine");
  const [showModal, setShowModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [form, setForm] = useState({
    projectId: "", title: "", description: "", branchName: "",
    prUrl: "", type: "FEATURE", isPaid: false, agreedPrice: "", bugReportId: "",
  });
  const [reviewForm, setReviewForm] = useState({ status: "MERGED", reviewNote: "" });

  const { data: mine = [], isLoading: mineLoading } = useQuery({
    queryKey: ["myPRs"],
    queryFn: async () => { const { data } = await pullRequestsAPI.getMine(); return data; },
    enabled: !!user,
  });

  const { data: incoming = [], isLoading: incomingLoading } = useQuery({
    queryKey: ["incomingPRs"],
    queryFn: async () => { const { data } = await pullRequestsAPI.getIncoming(); return data; },
    enabled: !!user,
  });

  const { data: myProjectsData } = useQuery({
    queryKey: ["myProjects"],
    queryFn: async () => { const { data } = await projectsAPI.getMyProjects(); return data; },
    enabled: !!user,
  });

  const createMut = useMutation({
    mutationFn: () => pullRequestsAPI.create({
      ...form,
      isPaid: form.isPaid,
      agreedPrice: form.agreedPrice ? parseFloat(form.agreedPrice) : undefined,
      bugReportId: form.bugReportId || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myPRs"] });
      setShowModal(false);
      setForm({ projectId: "", title: "", description: "", branchName: "", prUrl: "", type: "FEATURE", isPaid: false, agreedPrice: "", bugReportId: "" });
    },
    onError: (e) => alert(e.response?.data?.message || "Failed to submit PR"),
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, data }) => pullRequestsAPI.review(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomingPRs"] });
      setReviewModal(null);
    },
    onError: (e) => alert(e.response?.data?.message || "Failed to update PR"),
  });

  const list = tab === "mine" ? mine : incoming;
  const filtered = filterStatus ? list.filter((r) => r.status === filterStatus) : list;
  const isLoading = tab === "mine" ? mineLoading : incomingLoading;

  return (
    <div className="space-y-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-amber-500" /> Pull Requests
          </h1>
          <p className="text-xs text-muted mt-0.5 font-sans">Submit contributions or review incoming PRs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-amber-500 text-gray-950 px-3.5 py-1.5 rounded-sm text-xs font-mono font-bold hover:bg-amber-400 transition"
        >
          <Plus className="h-3.5 w-3.5" /> New PR
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 surface-raised rounded-sm border border-subtle p-1 w-fit">
        {[
          { key: "mine",     label: "My PRs",   count: mine.length },
          { key: "incoming", label: "Incoming", count: incoming.filter((r) => r.status === "OPEN").length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setFilterStatus(""); }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-mono transition ${
              tab === t.key ? "bg-amber-500 text-gray-950 font-bold" : "text-muted hover:text-primary"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[9px] font-mono font-bold rounded-[2px] px-1 py-0.2 ${tab === t.key ? "bg-gray-950 text-amber-400" : "surface-card border border-subtle text-muted"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap">
        {["", "OPEN", "UNDER_REVIEW", "MERGED", "CLOSED"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-2.5 py-1 rounded-sm text-xs font-mono transition ${
              filterStatus === s ? "bg-amber-500 text-gray-950 font-bold" : "surface-raised border border-subtle text-muted hover:text-primary"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 surface-card border border-subtle rounded-sm animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="surface-card rounded-sm border border-subtle p-10 text-center">
          <GitPullRequest className="h-10 w-10 mx-auto mb-3 text-muted" />
          <p className="text-muted font-medium font-mono text-xs">{tab === "mine" ? "No pull requests submitted" : "No incoming pull requests"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pr) => {
            const SIcon = STATUS_ICONS[pr.status] ?? Clock;
            return (
              <div key={pr.id} className="surface-card rounded-sm border border-subtle p-4 hover:border-normal transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-[2px] surface-raised border border-subtle text-muted">
                        {pr.type.replace("_", " ")}
                      </span>
                      {pr.isPaid && (
                        <span className="flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-[2px] surface-raised border border-emerald-500/30 text-emerald-500">
                          <DollarSign className="h-2.5 w-2.5" /> Paid {pr.agreedPrice ? `$${pr.agreedPrice}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold font-mono text-primary">{pr.title}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2 font-sans">{pr.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap font-mono text-[11px]">
                      {pr.project && (
                        <Link href={`/projects/${pr.project.id}`} className="text-amber-500 hover:text-amber-400 truncate">
                          → {pr.project.title}
                        </Link>
                      )}
                      {pr.author && tab === "incoming" && (
                        <span className="flex items-center gap-1 text-muted">
                          {pr.author.avatarUrl && <img src={pr.author.avatarUrl} className="w-4 h-4 rounded-sm border border-subtle object-cover" alt="" />}
                          {pr.author.username}
                          {pr.author.contributorTier && pr.author.contributorTier !== "TESTER" && (
                            <span className="ml-1 text-[9px] surface-raised border border-subtle text-amber-500 px-1 py-0.2 rounded-[2px]">
                              {pr.author.contributorTier.replace("_", " ")}
                            </span>
                          )}
                        </span>
                      )}
                      {pr.bugReport && (
                        <span className="text-red-400 surface-raised border border-red-500/30 px-1.5 py-0.5 rounded-[2px]">
                          🐛 {pr.bugReport.title}
                        </span>
                      )}
                      {pr.prUrl && (
                        <a href={pr.prUrl} target="_blank" rel="noopener noreferrer"
                          className="text-muted hover:text-amber-500 underline">
                          View on GitHub
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-[2px] ${STATUS_COLORS[pr.status]}`}>
                      <SIcon className="h-3 w-3" /> {pr.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-muted font-mono">
                      {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
                    </span>
                    {/* Owner review button */}
                    {tab === "incoming" && pr.status === "OPEN" && (
                      <button
                        onClick={() => { setReviewModal(pr); setReviewForm({ status: "MERGED", reviewNote: "" }); }}
                        className="text-xs font-mono font-bold bg-amber-500 text-gray-950 px-3 py-1 rounded-sm hover:bg-amber-400 transition"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
                {pr.reviewNote && (
                  <div className="mt-2 pt-2 border-t border-subtle text-xs text-muted font-sans italic">
                    "{pr.reviewNote}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create PR modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="surface-card rounded-sm max-w-lg w-full border border-subtle my-4">
            <div className="p-4 border-b border-subtle flex items-center justify-between">
              <h2 className="text-sm font-mono font-bold text-primary flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-amber-500" /> Submit Pull Request
              </h2>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-primary">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="p-4 space-y-3 font-sans">
              <div>
                <label className="block text-xs font-mono text-muted mb-1.5">Project *</label>
                <input
                  type="text"
                  required
                  aria-label="Project ID"
                  placeholder="Paste project ID"
                  value={form.projectId}
                  onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-muted mb-1.5">Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                  >
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted mb-1.5">Paid Contribution?</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={form.isPaid}
                      onChange={e => setForm(f => ({ ...f, isPaid: e.target.checked }))}
                      className="w-4 h-4 rounded-sm accent-amber-500"
                    />
                    <label htmlFor="isPaid" className="text-xs font-mono text-muted">Is paid</label>
                  </div>
                </div>
              </div>
              {form.isPaid && (
                <div>
                  <label className="block text-xs font-mono text-muted mb-1.5">Agreed Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.agreedPrice}
                    onChange={e => setForm(f => ({ ...f, agreedPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-mono text-muted mb-1.5">Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What does this PR do?"
                  className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-muted mb-1.5">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your changes…"
                  className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none resize-none font-sans"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-muted mb-1.5">Branch Name</label>
                  <input
                    type="text"
                    value={form.branchName}
                    onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
                    placeholder="feature/my-change"
                    className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted mb-1.5">GitHub PR URL</label>
                  <input
                    type="url"
                    value={form.prUrl}
                    onChange={e => setForm(f => ({ ...f, prUrl: e.target.value }))}
                    placeholder="https://github.com/…"
                    className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 bg-amber-500 text-gray-950 py-2 rounded-sm text-xs font-mono font-bold hover:bg-amber-400 disabled:opacity-50 transition"
                >
                  {createMut.isPending ? "Submitting…" : "Submit PR"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 surface-raised border border-subtle text-muted hover:text-primary py-2 rounded-sm text-xs font-mono transition">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review modal */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm max-w-md w-full border border-subtle p-5">
            <h2 className="text-sm font-mono font-bold text-primary mb-4">Review PR: {reviewModal.title}</h2>
            <div className="space-y-4 font-sans">
              <div>
                <label className="block text-xs font-mono text-muted mb-1.5">Decision</label>
                <div className="flex gap-2">
                  {REVIEW_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setReviewForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-1.5 rounded-sm text-xs font-mono font-bold transition ${
                        reviewForm.status === s
                          ? s === "MERGED" ? "bg-emerald-600 text-white" : s === "CLOSED" ? "bg-red-600 text-white" : "bg-amber-500 text-gray-950"
                          : "surface-raised border border-subtle text-muted hover:text-primary"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-muted mb-1.5">Review Note (optional)</label>
                <textarea
                  rows={3}
                  value={reviewForm.reviewNote}
                  onChange={e => setReviewForm(f => ({ ...f, reviewNote: e.target.value }))}
                  placeholder="Feedback for the contributor…"
                  className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none resize-none font-sans"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => reviewMut.mutate({ id: reviewModal.id, data: reviewForm })}
                  disabled={reviewMut.isPending}
                  className="flex-1 bg-amber-500 text-gray-950 py-2 rounded-sm text-xs font-mono font-bold hover:bg-amber-400 disabled:opacity-50 transition"
                >
                  {reviewMut.isPending ? "Saving…" : "Confirm"}
                </button>
                <button onClick={() => setReviewModal(null)}
                  className="flex-1 surface-raised border border-subtle text-muted hover:text-primary py-2 rounded-sm text-xs font-mono transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
