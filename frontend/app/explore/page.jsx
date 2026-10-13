"use client";

import { useState, Suspense, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI, opportunitiesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Compass, Briefcase, FolderGit2, Clock, ChevronRight,
  Wifi, DollarSign, Plus, Users, GitPullRequest, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { FeedSkeleton } from "@/components/Skeleton";

const TABS = [
  { key: "projects",      label: "Projects",      icon: FolderGit2 },
  { key: "opportunities", label: "Opportunities", icon: Briefcase },
];
const CATS = ["All","SaaS","AI/ML","Health","Marketing","E-commerce","DevTools","Mobile","Other"];

// ── Compact project row ──────────────────────────────────────────────────────
function ProjectRow({ project }) {
  return (
    <Link href={`/projects/${project.id}`}
      className="flex items-center gap-4 p-4 surface-card border border-subtle rounded-sm hover:border-amber-500/40 transition group shadow-sm">
      {/* Small thumbnail */}
      <div className="w-12 h-12 rounded-sm overflow-hidden surface-input border border-subtle flex-shrink-0">
        {project.coverImage
          ? <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><FolderGit2 className="h-5 w-5 text-muted" /></div>}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-primary truncate group-hover:text-amber-500 transition">{project.title}</h3>
          {project.category && <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.2 rounded-sm flex-shrink-0">{project.category}</span>}
        </div>
        <p className="text-xs text-secondary truncate">{project.description}</p>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted font-mono">
          <span className="flex items-center gap-1">
            {project.owner?.avatarUrl
              ? <img src={project.owner.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full" />
              : <div className="w-3.5 h-3.5 rounded-full bg-amber-500" />}
            {project.owner?.username}
          </span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{project._count?.members ?? 0}</span>
          <span className="flex items-center gap-1"><GitPullRequest className="h-3 w-3" />{project._count?.accessRequests ?? 0}</span>
          <span>{formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}</span>
        </div>
      </div>
      {/* Tags */}
      <div className="hidden sm:flex flex-wrap gap-1 max-w-[140px] flex-shrink-0">
        {project.tags.slice(0, 3).map((t, i) => (
          <span key={i} className="text-[10px] font-mono text-muted surface-input border border-subtle px-1.5 py-0.5 rounded-sm">{t}</span>
        ))}
      </div>
      <ExternalLink className="h-4 w-4 text-muted flex-shrink-0 group-hover:text-amber-500 transition" />
    </Link>
  );
}

// ── Opportunity card with apply status ────────────────────────────────────────
function OppCard({ opp, onApply }) {
  const { user } = useAuth();
  const isOwner = user?.id === opp.ownerId;

  const { data: checkData } = useQuery({
    queryKey: ["oppCheck", opp.id],
    queryFn: async () => { const { data } = await opportunitiesAPI.checkApplied(opp.id); return data; },
    enabled: !!user && !isOwner,
    staleTime: 30000,
  });
  const hasApplied = checkData?.applied ?? false;
  const myAppId = checkData?.application?.id;

  return (
    <div className="surface-card border border-subtle rounded-sm p-4 hover:border-amber-500/30 transition shadow-sm">
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="text-[11px] font-mono font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-sm">{opp.role}</span>
        {opp.isRemote && <span className="flex items-center gap-1 text-[10px] font-mono text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-sm"><Wifi className="h-3 w-3" />Remote</span>}
        {hasApplied && <span className="text-[10px] font-mono text-green-500 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-sm">✓ Applied</span>}
      </div>
      <h3 className="text-sm font-semibold text-primary mb-1">{opp.title}</h3>
      <p className="text-xs text-secondary line-clamp-2 mb-3">{opp.description}</p>
      <div className="flex flex-wrap gap-1 mb-3">
        {opp.requiredSkills?.slice(0, 4).map((s, i) => (
          <span key={i} className="text-[10px] font-mono text-muted surface-input border border-subtle px-1.5 py-0.5 rounded-sm">{s}</span>
        ))}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-muted font-mono mb-3">
        {opp.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{opp.duration}</span>}
        {opp.budget && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3 text-amber-500" />{opp.budget}</span>}
        <span>{opp._count?.applications ?? 0} applicants</span>
        {opp.project && <Link href={`/projects/${opp.project.id}`} className="text-amber-500 hover:text-amber-400" onClick={e => e.stopPropagation()}>{opp.project.title}</Link>}
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-subtle">
        <div className="flex items-center gap-2">
          {opp.owner?.avatarUrl
            ? <img src={opp.owner.avatarUrl} alt="" className="w-5 h-5 rounded-full" />
            : <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[9px] font-bold text-black">{opp.owner?.username?.charAt(0).toUpperCase()}</div>}
          <span className="text-xs text-muted font-mono">{opp.owner?.username}</span>
        </div>
        <div className="flex items-center gap-2">
          {hasApplied && myAppId && (
            <Link href={`/opportunities?chat=${opp.id}&app=${myAppId}`}
              className="text-xs font-mono text-amber-500 border border-amber-500/30 px-3 py-1.5 rounded-sm hover:bg-amber-500/10 transition">
              View Chat
            </Link>
          )}
          {!isOwner && !hasApplied && opp.status === "OPEN" && (
            <button onClick={() => onApply(opp.id)}
              className="flex items-center gap-1 text-xs font-semibold text-black bg-amber-500 px-3 py-1.5 rounded-sm hover:bg-amber-400 transition">
              Apply <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({ oppId, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ experience: "", githubUrl: "", portfolioUrl: "", message: "" });
  const mut = useMutation({
    mutationFn: () => opportunitiesAPI.apply(oppId, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["explore-opps"] });
      qc.invalidateQueries({ queryKey: ["oppCheck", oppId] });
      onClose();
    },
    onError: (e) => alert(e.response?.data?.message || "Failed to apply"),
  });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="surface-card rounded-sm max-w-md w-full border border-subtle shadow-xl">
        <div className="p-4 border-b border-subtle"><h2 className="text-sm font-semibold text-primary">Apply for Opportunity</h2></div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-mono text-secondary mb-1">Your Experience *</label>
            <textarea required value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} rows={3}
              placeholder="Describe your relevant experience…"
              className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-secondary mb-1">GitHub URL</label>
              <input type="url" value={form.githubUrl} onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))}
                placeholder="https://github.com/…" className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-mono text-secondary mb-1">Portfolio URL</label>
              <input type="url" value={form.portfolioUrl} onChange={e => setForm(f => ({ ...f, portfolioUrl: e.target.value }))}
                placeholder="https://…" className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono text-secondary mb-1">Message</label>
            <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} rows={2}
              className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none resize-none" />
          </div>
          <div className="flex gap-2.5 pt-1">
            <button type="submit" disabled={mut.isPending}
              className="flex-1 bg-amber-500 text-black py-2 rounded-sm text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 transition">
              {mut.isPending ? "Submitting…" : "Submit Application"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 surface-input border border-subtle text-secondary py-2 rounded-sm text-xs font-medium hover:text-primary transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Post Opportunity Modal ─────────────────────────────────────────────── */
function PostOppModal({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", role: "", description: "", requiredSkills: "", duration: "", budget: "", isRemote: true });
  const mut = useMutation({
    mutationFn: () => opportunitiesAPI.create({ ...form, requiredSkills: form.requiredSkills.split(",").map(s => s.trim()).filter(Boolean) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["explore-opps"] }); onClose(); },
    onError: (e) => alert(e.response?.data?.message || "Failed to post"),
  });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="surface-card rounded-sm max-w-lg w-full border border-subtle my-4 shadow-xl">
        <div className="p-4 border-b border-subtle"><h2 className="text-sm font-semibold text-primary">Post an Opportunity</h2></div>
        <form onSubmit={e => { e.preventDefault(); mut.mutate(); }} className="p-4 space-y-3">
          {[["title","Title *","e.g. React Developer Needed",true],["role","Role *","e.g. Frontend Developer",true]].map(([k,l,p,r])=>(
            <div key={k}><label className="block text-xs font-mono text-secondary mb-1">{l}</label>
              <input required={!!r} type="text" value={(form)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                placeholder={p} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none" /></div>
          ))}
          <div><label className="block text-xs font-mono text-secondary mb-1">Description *</label>
            <textarea required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none resize-none" /></div>
          <div><label className="block text-xs font-mono text-secondary mb-1">Required Skills (comma-separated)</label>
            <input type="text" value={form.requiredSkills} onChange={e => setForm(f => ({ ...f, requiredSkills: e.target.value }))}
              placeholder="React, TypeScript" className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none" /></div>
          <div className="grid grid-cols-2 gap-3">
            {[["duration","Duration","3 months"],["budget","Compensation","$500"]].map(([k,l,p])=>(
              <div key={k}><label className="block text-xs font-mono text-secondary mb-1">{l}</label>
                <input type="text" value={(form)[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder={p} className="w-full surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none" /></div>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isRemote} onChange={e => setForm(f => ({ ...f, isRemote: e.target.checked }))} className="w-4 h-4 accent-amber-500" />
            <span className="text-xs text-secondary font-mono">Remote position</span>
          </label>
          <div className="flex gap-2.5 pt-1">
            <button type="submit" disabled={mut.isPending} className="flex-1 bg-amber-500 text-black py-2 rounded-sm text-xs font-semibold hover:bg-amber-400 disabled:opacity-50 transition">
              {mut.isPending ? "Posting…" : "Post Opportunity"}</button>
            <button type="button" onClick={onClose} className="flex-1 surface-input border border-subtle text-secondary py-2 rounded-sm text-xs font-medium hover:text-primary transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label, sub, cta }) {
  return (
    <div className="text-center py-16 surface-card rounded-sm border border-subtle">
      <Icon className="h-10 w-10 mx-auto mb-3 text-muted" />
      <p className="text-primary font-medium text-sm mb-1">{label}</p>
      <p className="text-xs text-muted font-mono">{sub}</p>
      {cta && <button onClick={cta.onClick} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-black bg-amber-500 px-3.5 py-1.5 rounded-sm hover:bg-amber-400 transition"><Plus className="h-4 w-4" />{cta.label}</button>}
    </div>
  );
}

function ExploreContent() {
  const { isAuthenticated, user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "projects";
  const [tab, setTab] = useState(initialTab);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState("All");
  const [applyId, setApplyId] = useState(null);
  const [showPostOpp, setShowPostOpp] = useState(false);

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("search")]);

  const { data: projData, isLoading: projLoading } = useQuery({
    queryKey: ["explore-projects", search, category],
    queryFn: async () => {
      const { data } = await projectsAPI.getAll({ search: search || undefined, limit: 50 });
      if (category !== "All") return { ...data, projects: data.projects.filter((p) => p.category === category) };
      return data;
    },
    enabled: tab === "projects",
  });

  const { data: oppData, isLoading: oppLoading } = useQuery({
    queryKey: ["explore-opps", search],
    queryFn: async () => { const { data } = await opportunitiesAPI.getAll({ search: search || undefined, limit: 50 }); return data; },
    enabled: tab === "opportunities",
  });

  return (
    <div className="space-y-5 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-2">
          <Compass className="h-5 w-5 text-amber-500" />
          <span>Explore Repositories</span>
        </h1>
        <p className="text-xs text-muted mt-0.5 font-sans">Discover repositories and engineering opportunities</p>
      </div>

      <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm mb-4 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-mono transition ${tab === key ? "bg-amber-500 text-gray-950 font-bold" : "text-muted hover:text-primary"}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      <div className="flex gap-2.5 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
          <input type="text" placeholder={`Search ${tab}...`} value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && search.trim()) router.push(`/explore?search=${encodeURIComponent(search.trim())}&tab=${tab}`); }}
            className="w-full surface-input border border-subtle text-primary text-xs pl-9 pr-3.5 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" />
        </div>
        {tab === "opportunities" && isAuthenticated && (
          <button onClick={() => setShowPostOpp(true)}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-gray-950 bg-amber-500 hover:bg-amber-400 px-3.5 py-2 rounded-sm transition flex-shrink-0">
            <Plus className="h-3.5 w-3.5" />Post Opportunity
          </button>
        )}
      </div>

      {tab === "projects" && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {CATS.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`text-xs font-mono px-3 py-1 rounded-sm transition ${
                category === c
                  ? "bg-amber-500 text-black font-semibold"
                  : "surface-input text-secondary border border-subtle hover:text-primary hover:border-amber-500/40"
              }`}>{c}</button>
          ))}
        </div>
      )}

      {(projLoading || oppLoading) ? <FeedSkeleton count={4} /> : (
        <>
          {tab === "projects" && (
            projData?.projects.length ? (
              <>
                <p className="text-xs text-muted font-mono mb-4">{projData.projects.length} projects</p>
                <div className="space-y-2.5">
                  {projData.projects.map((p) => <ProjectRow key={p.id} project={p} />)}
                </div>
              </>
            ) : <EmptyState icon={FolderGit2} label="No projects found" sub="Try different search terms or filters" />
          )}
          {tab === "opportunities" && (
            (() => {
              // Never show own posted opportunities on Explore
              const filtered = (oppData?.opportunities ?? []).filter((o) => o.ownerId !== user?.id);
              return filtered.length > 0 ? (
                <>
                  <p className="text-xs text-muted font-mono mb-4">{filtered.length} opportunities</p>
                  <div className="grid grid-cols-1 gap-3">
                    {filtered.map((o) => (
                      <OppCard key={o.id} opp={o} onApply={id => isAuthenticated ? setApplyId(id) : alert("Please login")} />
                    ))}
                  </div>
                </>
              ) : <EmptyState icon={Briefcase} label="No opportunities found" sub={isAuthenticated ? "Be the first to post" : "Login to post"} cta={isAuthenticated ? { label: "Post Opportunity", onClick: () => setShowPostOpp(true) } : undefined} />;
            })()
          )}
        </>
      )}
      {applyId && <ApplyModal oppId={applyId} onClose={() => setApplyId(null)} />}
      {showPostOpp && <PostOppModal onClose={() => { setShowPostOpp(false); qc.invalidateQueries({ queryKey: ["explore-opps"] }); }} />}
    </div>
  );
}

export default function ExplorePage() { return <Suspense><ExploreContent /></Suspense>; }
