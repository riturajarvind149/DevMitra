"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pullRequestsAPI, projectsAPI, bugReportsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { GitPullRequest, Plus, CheckCircle, Clock, GitMerge, XCircle, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  OPEN:          "bg-indigo-900/40 text-indigo-400",
  UNDER_REVIEW:  "bg-yellow-900/40 text-yellow-400",
  MERGED:        "bg-green-900/40 text-green-400",
  CLOSED:        "bg-gray-700 text-gray-400",
};
const STATUS_ICONS: Record<string, any> = {
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

  const [tab, setTab] = useState<"mine" | "incoming">("mine");
  const [showModal, setShowModal] = useState(false);
  const [reviewModal, setReviewModal] = useState<any>(null);
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
    onError: (e: any) => alert(e.response?.data?.message || "Failed to submit PR"),
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => pullRequestsAPI.review(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomingPRs"] });
      setReviewModal(null);
    },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to update PR"),
  });

  const list = tab === "mine" ? mine : incoming;
  const filtered = filterStatus ? list.filter((r: any) => r.status === filterStatus) : list;
  const isLoading = tab === "mine" ? mineLoading : incomingLoading;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <GitPullRequest className="h-5 w-5 text-indigo-400" /> Pull Requests
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Submit contributions or review incoming PRs</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" /> New PR
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-900 rounded-xl border border-gray-800 p-1 w-fit">
        {[
          { key: "mine",     label: "My PRs",   count: mine.length },
          { key: "incoming", label: "Incoming", count: incoming.filter((r: any) => r.status === "OPEN").length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as any); setFilterStatus(""); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] font-bold rounded-full px-1.5 py-0.5 ${tab === t.key ? "bg-indigo-500" : "bg-gray-800"}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "OPEN", "UNDER_REVIEW", "MERGED", "CLOSED"].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterStatus === s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-800 rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-10 text-center">
          <GitPullRequest className="h-10 w-10 mx-auto mb-3 text-gray-700" />
          <p className="text-gray-400 font-medium">{tab === "mine" ? "No pull requests submitted" : "No incoming pull requests"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((pr: any) => {
            const SIcon = STATUS_ICONS[pr.status] ?? Clock;
            return (
              <div key={pr.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 hover:border-gray-700 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                        {pr.type.replace("_", " ")}
                      </span>
                      {pr.isPaid && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-900/40 text-green-400">
                          <DollarSign className="h-2.5 w-2.5" /> Paid {pr.agreedPrice ? `$${pr.agreedPrice}` : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-white">{pr.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{pr.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {pr.project && (
                        <Link href={`/projects/${pr.project.id}`} className="text-[11px] text-indigo-400 hover:text-indigo-300 truncate">
                          → {pr.project.title}
                        </Link>
                      )}
                      {pr.author && tab === "incoming" && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          {pr.author.avatarUrl && <img src={pr.author.avatarUrl} className="w-4 h-4 rounded-full" alt="" />}
                          {pr.author.username}
                          {pr.author.contributorTier && pr.author.contributorTier !== "TESTER" && (
                            <span className="ml-1 text-[9px] bg-purple-900/40 text-purple-400 px-1.5 py-0.5 rounded-full">
                              {pr.author.contributorTier.replace("_", " ")}
                            </span>
                          )}
                        </span>
                      )}
                      {pr.bugReport && (
                        <span className="text-[11px] text-red-400 bg-red-900/20 px-1.5 py-0.5 rounded">
                          🐛 {pr.bugReport.title}
                        </span>
                      )}
                      {pr.prUrl && (
                        <a href={pr.prUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] text-gray-500 hover:text-indigo-400 underline">
                          View on GitHub
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[pr.status]}`}>
                      <SIcon className="h-3 w-3" /> {pr.status.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-gray-600">
                      {formatDistanceToNow(new Date(pr.createdAt), { addSuffix: true })}
                    </span>
                    {/* Owner review button */}
                    {tab === "incoming" && pr.status === "OPEN" && (
                      <button
                        onClick={() => { setReviewModal(pr); setReviewForm({ status: "MERGED", reviewNote: "" }); }}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
                {pr.reviewNote && (
                  <div className="mt-2 pt-2 border-t border-gray-800 text-xs text-gray-500 italic">
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
          <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700 my-4">
            <div className="p-5 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <GitPullRequest className="h-4 w-4 text-indigo-400" /> Submit Pull Request
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Project *</label>
                <select
                  required
                  value={form.projectId}
                  onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">Select a project…</option>
                  {/* Show all projects (not just mine — contributor submits to others) */}
                </select>
                <p className="text-[10px] text-gray-600 mt-1">Enter the project ID directly if not listed:</p>
                <input
                  type="text"
                  aria-label="Project ID"
                  placeholder="Or paste project ID"
                  value={form.projectId}
                  onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}
                  className="mt-1 w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
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
                  <label className="block text-xs text-gray-400 mb-1.5">Paid Contribution?</label>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isPaid"
                      checked={form.isPaid}
                      onChange={e => setForm(f => ({ ...f, isPaid: e.target.checked }))}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <label htmlFor="isPaid" className="text-sm text-gray-400">Is paid</label>
                  </div>
                </div>
              </div>
              {form.isPaid && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Agreed Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.agreedPrice}
                    onChange={e => setForm(f => ({ ...f, agreedPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Title *</label>
                <input
                  required
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What does this PR do?"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your changes…"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Branch Name</label>
                  <input
                    type="text"
                    value={form.branchName}
                    onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))}
                    placeholder="feature/my-change"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">GitHub PR URL</label>
                  <input
                    type="url"
                    value={form.prUrl}
                    onChange={e => setForm(f => ({ ...f, prUrl: e.target.value }))}
                    placeholder="https://github.com/…"
                    className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={createMut.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {createMut.isPending ? "Submitting…" : "Submit PR"}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
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
          <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700 p-5">
            <h2 className="text-base font-semibold text-white mb-4">Review PR: {reviewModal.title}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Decision</label>
                <div className="flex gap-2">
                  {REVIEW_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => setReviewForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-medium transition ${
                        reviewForm.status === s
                          ? s === "MERGED" ? "bg-green-600 text-white" : s === "CLOSED" ? "bg-red-600 text-white" : "bg-yellow-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Review Note (optional)</label>
                <textarea
                  rows={3}
                  value={reviewForm.reviewNote}
                  onChange={e => setReviewForm(f => ({ ...f, reviewNote: e.target.value }))}
                  placeholder="Feedback for the contributor…"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => reviewMut.mutate({ id: reviewModal.id, data: reviewForm })}
                  disabled={reviewMut.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {reviewMut.isPending ? "Saving…" : "Confirm"}
                </button>
                <button onClick={() => setReviewModal(null)}
                  className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
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
