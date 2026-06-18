"use client";

import { useState, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { opportunitiesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Plus, Search, MapPin, Clock, DollarSign, Check, X, ChevronRight, Globe, Wifi } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

function OpportunityCard({ opp, onApply }: { opp: any; onApply: (id: string) => void }) {
  const { user } = useAuth();
  const isOwner = user?.id === opp.ownerId;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded-full">{opp.role}</span>
            {opp.isRemote && <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full"><Wifi className="h-3 w-3" />Remote</span>}
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${opp.status === "OPEN" ? "text-green-400 bg-green-900/30" : "text-gray-500 bg-gray-800"}`}>{opp.status}</span>
          </div>
          <h3 className="text-base font-semibold text-white mb-1">{opp.title}</h3>
          <p className="text-sm text-gray-400 line-clamp-2">{opp.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {opp.requiredSkills?.slice(0, 5).map((s: string, i: number) => (
          <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full">{s}</span>
        ))}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-500 mb-4">
        {opp.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{opp.duration}</span>}
        {opp.budget && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{opp.budget}</span>}
        <span>{opp._count?.applications ?? 0} applications</span>
        <span className="ml-auto">{formatDistanceToNow(new Date(opp.createdAt), { addSuffix: true })}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          {opp.owner?.avatarUrl
            ? <img src={opp.owner.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            : <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] font-bold text-white">{opp.owner?.username?.charAt(0).toUpperCase()}</div>
          }
          <span className="text-xs text-gray-500">{opp.owner?.username}</span>
          {opp.project && <Link href={`/projects/${opp.project.id}`} className="text-[10px] text-indigo-400 hover:text-indigo-300">· {opp.project.title}</Link>}
        </div>
        {!isOwner && opp.status === "OPEN" && (
          <button onClick={() => onApply(opp.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition">
            Apply <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
        {isOwner && (
          <Link href={`/opportunities/${opp.id}`} className="text-xs text-gray-400 hover:text-white transition">Manage →</Link>
        )}
      </div>
    </div>
  );
}

function ApplyModal({ oppId, onClose }: { oppId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ experience: "", githubUrl: "", portfolioUrl: "", message: "" });

  const applyMut = useMutation({
    mutationFn: () => opportunitiesAPI.apply(oppId, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opportunities"] }); onClose(); },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to apply"),
  });

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700">
        <div className="p-5 border-b border-gray-800"><h2 className="text-base font-semibold text-white">Apply for Opportunity</h2></div>
        <form onSubmit={e => { e.preventDefault(); applyMut.mutate(); }} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Your Experience *</label>
            <textarea required value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))}
              rows={3} placeholder="Describe your relevant experience…"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">GitHub URL</label>
              <input type="url" value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))}
                placeholder="https://github.com/…" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Portfolio URL</label>
              <input type="url" value={form.portfolioUrl} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                placeholder="https://…" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              rows={2} placeholder="Anything else you'd like to say…"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={applyMut.isPending}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
              {applyMut.isPending ? "Submitting…" : "Submit Application"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PostModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", role: "", description: "", requiredSkills: "", duration: "", budget: "", isRemote: true });

  const createMut = useMutation({
    mutationFn: () => opportunitiesAPI.create({
      ...form,
      requiredSkills: form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
    } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["opportunities"] }); onClose(); },
    onError: (e: any) => alert(e.response?.data?.message || "Failed"),
  });

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700 my-4">
        <div className="p-5 border-b border-gray-800"><h2 className="text-base font-semibold text-white">Post an Opportunity</h2></div>
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(); }} className="p-5 space-y-4">
          {[
            { key: "title", label: "Title *", placeholder: "e.g. React Developer Needed", required: true },
            { key: "role",  label: "Role *",  placeholder: "e.g. Frontend Developer", required: true },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
              <input type="text" required={required} value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Required Skills (comma-separated)</label>
            <input type="text" value={form.requiredSkills} onChange={e => setForm(f => ({ ...f, requiredSkills: e.target.value }))}
              placeholder="React, TypeScript, Node.js" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "duration", label: "Duration", placeholder: "e.g. 3 months" },
              { key: "budget",   label: "Budget",   placeholder: "e.g. $500/month" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
                <input type="text" value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder} className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRemote} onChange={e => setForm(f => ({ ...f, isRemote: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm text-gray-400">Remote position</span>
          </label>
          <div className="flex gap-3">
            <button type="submit" disabled={createMut.isPending}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
              {createMut.isPending ? "Posting…" : "Post Opportunity"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OpportunitiesPage() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [applyId, setApplyId] = useState<string | null>(null);
  const [showPost, setShowPost] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["opportunities", search],
    queryFn: async () => {
      const { data } = await opportunitiesAPI.getAll({ search: search || undefined, limit: 50 });
      return data;
    },
  });

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

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input type="text" placeholder="Search opportunities, roles, skills…" value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 text-white text-sm pl-11 pr-4 py-3 rounded-2xl focus:border-indigo-500 focus:outline-none" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : data?.opportunities && data.opportunities.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {data.opportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} onApply={id => isAuthenticated ? setApplyId(id) : alert("Please login to apply")} />)}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
          <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-700" />
          <p className="text-white font-medium mb-1">No opportunities found</p>
          <p className="text-sm text-gray-500 mb-4">Be the first to post a collaboration opportunity</p>
          {isAuthenticated && <button onClick={() => setShowPost(true)} className="text-sm text-indigo-400 hover:text-indigo-300">Post an Opportunity →</button>}
        </div>
      )}

      {applyId && <ApplyModal oppId={applyId} onClose={() => setApplyId(null)} />}
      {showPost && <PostModal onClose={() => setShowPost(false)} />}
    </div>
  );
}
