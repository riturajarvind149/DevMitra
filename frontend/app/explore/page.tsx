"use client";

import { useState, Suspense, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI, opportunitiesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Compass, Briefcase, FolderGit2, Clock, ChevronRight, Wifi, DollarSign, Plus } from "lucide-react";
import ProjectFeedCard from "@/components/ProjectFeedCard";
import Link from "next/link";
import { FeedSkeleton } from "@/components/Skeleton";

const TABS = [
  { key: "projects",      label: "Projects",      icon: FolderGit2 },
  { key: "opportunities", label: "Opportunities", icon: Briefcase },
] as const;
type Tab = typeof TABS[number]["key"];

const CATS = ["All","SaaS","AI/ML","Health","Marketing","E-commerce","DevTools","Mobile","Other"];

/* ─── Opportunity Card ───────────────────────────────────────────────────── */
function OppCard({ opp, onApply }: { opp: any; onApply: (id: string) => void }) {
  const { user } = useAuth();
  const isOwner = user?.id === opp.ownerId;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="text-xs font-semibold text-indigo-400 bg-indigo-900/40 px-2 py-0.5 rounded-full">{opp.role}</span>
        {opp.isRemote && <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full"><Wifi className="h-3 w-3" />Remote</span>}
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{opp.title}</h3>
      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{opp.description}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {opp.requiredSkills?.slice(0, 4).map((s: string, i: number) => (
          <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full">{s}</span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-3">
        {opp.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{opp.duration}</span>}
        {opp.budget && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{opp.budget}</span>}
        <span>{opp._count?.applications ?? 0} applicants</span>
        {opp.project && <Link href={`/projects/${opp.project.id}`} className="text-indigo-400 hover:text-indigo-300">{opp.project.title}</Link>}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          {opp.owner?.avatarUrl
            ? <img src={opp.owner.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
            : <div className="w-5 h-5 rounded-full bg-indigo-700 flex items-center justify-center text-[9px] font-bold text-white">{opp.owner?.username?.charAt(0).toUpperCase()}</div>
          }
          <span className="text-[10px] text-gray-500">{opp.owner?.username}</span>
        </div>
        {!isOwner && opp.status === "OPEN" && (
          <button onClick={() => onApply(opp.id)}
            className="flex items-center gap-1 text-xs font-medium text-white bg-indigo-600 px-3 py-1.5 rounded-xl hover:bg-indigo-700 transition">
            Apply <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Apply Modal ────────────────────────────────────────────────────────── */
function ApplyModal({ oppId, onClose }: { oppId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ experience: "", githubUrl: "", portfolioUrl: "", message: "" });
  const mut = useMutation({
    mutationFn: () => opportunitiesAPI.apply(oppId, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["explore-opps"] }); onClose(); },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to apply"),
  });
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-700">
        <div className="p-5 border-b border-gray-800"><h2 className="text-base font-semibold text-white">Apply for Opportunity</h2></div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Your Experience *</label>
            <textarea required value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} rows={3}
              placeholder="Describe your relevant experience…"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["githubUrl","GitHub URL","https://github.com/…"],["portfolioUrl","Portfolio","https://…"]].map(([k,l,p])=>(
              <div key={k}>
                <label className="block text-sm text-gray-400 mb-1.5">{l}</label>
                <input type="url" value={(form as any)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder={p} className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
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

/* ─── Main Explore Content ───────────────────────────────────────────────── */
function ExploreContent() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "projects";
  const initialSearch = searchParams.get("search") || "";

  const [tab, setTab]       = useState<Tab>(initialTab);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("All");
  const [applyId, setApplyId] = useState<string | null>(null);
  const [showPostOpp, setShowPostOpp] = useState(false);

  // Sync search from URL when TopBar submits (pushes to /explore?search=…)
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    setSearch(urlSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("search")]);

  // Projects
  const { data: projData, isLoading: projLoading } = useQuery({
    queryKey: ["explore-projects", search, category],
    queryFn: async () => {
      const { data } = await projectsAPI.getAll({ search: search || undefined, limit: 50 });
      if (category !== "All") return { ...data, projects: data.projects.filter((p: any) => p.category === category) };
      return data;
    },
    enabled: tab === "projects",
  });

  // Opportunities
  const { data: oppData, isLoading: oppLoading } = useQuery({
    queryKey: ["explore-opps", search],
    queryFn: async () => {
      const { data } = await opportunitiesAPI.getAll({ search: search || undefined, limit: 50 });
      return data;
    },
    enabled: tab === "opportunities",
  });

  const loading = projLoading || oppLoading;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Compass className="h-6 w-6 text-indigo-400" />Explore
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Discover projects and collaboration opportunities</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-5 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Search + Post button */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder={`Search ${tab}…`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && search.trim()) {
                router.push(`/explore?search=${encodeURIComponent(search.trim())}&tab=${tab}`);
              }
            }}
            className="w-full bg-gray-900 border border-gray-800 text-white text-sm pl-11 pr-4 py-3 rounded-2xl focus:border-indigo-500 focus:outline-none"
          />
        </div>
        {tab === "opportunities" && isAuthenticated && (
          <button onClick={() => setShowPostOpp(true)}
            className="flex items-center gap-2 text-sm font-medium text-white bg-indigo-600 px-4 py-2.5 rounded-2xl hover:bg-indigo-700 transition flex-shrink-0">
            <Plus className="h-4 w-4" />Post
          </button>
        )}
      </div>

      {/* Category filter */}
      {tab === "projects" && (
        <div className="flex flex-wrap gap-2 mb-5">
          {CATS.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${category === c ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>{c}</button>
          ))}
        </div>
      )}

      {/* Results */}
      {loading ? <FeedSkeleton count={4} /> : (
        <>
          {tab === "projects" && (
            projData?.projects.length ? (
              <>
                <p className="text-xs text-gray-600 mb-4">{projData.projects.length} projects</p>
                <div className="grid grid-cols-1 gap-5">
                  {projData.projects.map((p: any) => <ProjectFeedCard key={p.id} project={p} />)}
                </div>
              </>
            ) : <EmptyState icon={FolderGit2} label="No projects found" sub="Try different search terms or filters" />
          )}
          {tab === "opportunities" && (
            oppData?.opportunities.length ? (
              <>
                <p className="text-xs text-gray-600 mb-4">{oppData.opportunities.length} opportunities</p>
                <div className="grid grid-cols-1 gap-4">
                  {oppData.opportunities.map((o: any) => (
                    <OppCard key={o.id} opp={o} onApply={id => isAuthenticated ? setApplyId(id) : alert("Please login")} />
                  ))}
                </div>
              </>
            ) : <EmptyState icon={Briefcase} label="No opportunities found"
                sub={isAuthenticated ? "Be the first to post" : "Login to post an opportunity"}
                cta={isAuthenticated ? { label: "Post Opportunity", onClick: () => setShowPostOpp(true) } : undefined} />
          )}
        </>
      )}

      {applyId && <ApplyModal oppId={applyId} onClose={() => setApplyId(null)} />}
      {showPostOpp && <PostOppModal onClose={() => { setShowPostOpp(false); qc.invalidateQueries({ queryKey: ["explore-opps"] }); }} />}
    </div>
  );
}

function EmptyState({ icon: Icon, label, sub, cta }: { icon: any; label: string; sub: string; cta?: { label: string; onClick: () => void } }) {
  return (
    <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
      <Icon className="h-12 w-12 mx-auto mb-3 text-gray-700" />
      <p className="text-white font-medium mb-1">{label}</p>
      <p className="text-sm text-gray-500">{sub}</p>
      {cta && (
        <button onClick={cta.onClick}
          className="mt-4 inline-flex items-center gap-2 text-sm text-white bg-indigo-600 px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition">
          <Plus className="h-4 w-4" />{cta.label}
        </button>
      )}
    </div>
  );
}

/* ─── Post Opportunity Modal ─────────────────────────────────────────────── */
function PostOppModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    title: "", role: "", description: "",
    requiredSkills: "", duration: "", budget: "", isRemote: true,
  });

  const mut = useMutation({
    mutationFn: () => opportunitiesAPI.create({
      ...form,
      requiredSkills: form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean),
    } as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["explore-opps"] }); onClose(); },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to post"),
  });

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-700 my-4">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">Post an Opportunity</h2>
          <p className="text-xs text-gray-500 mt-0.5">Find collaborators for your project</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Title *</label>
            <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. React Developer Needed"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Role *</label>
            <input required type="text" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              placeholder="e.g. Frontend Developer"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Description *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} placeholder="Describe what you need and what the contributor will work on…"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Required Skills (comma-separated)</label>
            <input type="text" value={form.requiredSkills} onChange={e => setForm(f => ({ ...f, requiredSkills: e.target.value }))}
              placeholder="React, TypeScript, Node.js"
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Duration</label>
              <input type="text" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                placeholder="e.g. 3 months"
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Compensation</label>
              <input type="text" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                placeholder="e.g. Volunteer / $500"
                className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRemote} onChange={e => setForm(f => ({ ...f, isRemote: e.target.checked }))}
              className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm text-gray-400">Remote position</span>
          </label>
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={mut.isPending}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
              {mut.isPending ? "Posting…" : "Post Opportunity"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return <Suspense><ExploreContent /></Suspense>;
}
