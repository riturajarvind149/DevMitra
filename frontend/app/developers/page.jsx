"use client";

import { useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { developersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, Clock, Users, FolderGit2, ExternalLink } from "lucide-react";
import ConnectButton from "@/components/ConnectButton";
import Link from "next/link";

const SKILLS = ["React", "Node.js", "Python", "TypeScript", "Go", "Rust", "Vue", "Angular", "Docker", "AWS"];
const AVAIL = [{ label: "Any", value: "" }, { label: "5+ hrs/wk", value: "5" }, { label: "10+ hrs/wk", value: "10" }, { label: "20+ hrs/wk", value: "20" }];

function DeveloperCard({ dev }) {
  return (
    <div className="surface-card border border-subtle rounded-sm p-4 hover:border-normal transition flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <Link href={`/users/${dev.id}`}>
            {dev.avatarUrl
              ? <img src={dev.avatarUrl} alt="" className="w-12 h-12 rounded-sm border border-subtle flex-shrink-0 object-cover" />
              : <div className="w-12 h-12 rounded-sm surface-raised border border-subtle flex items-center justify-center flex-shrink-0 text-amber-500 font-mono font-bold">{dev.username.charAt(0).toUpperCase()}</div>
            }
          </Link>
          <div className="min-w-0">
            <Link href={`/users/${dev.id}`} className="text-sm font-semibold text-primary hover:text-amber-500 transition block font-mono">{dev.username}</Link>
            {dev.bio && <p className="text-xs text-muted mt-0.5 line-clamp-2 font-sans">{dev.bio}</p>}
            <div className="flex flex-wrap gap-2 mt-1.5 font-mono">
              {dev.location && <span className="flex items-center gap-1 text-[10px] text-muted"><MapPin className="h-3 w-3" />{dev.location}</span>}
              {dev.availabilityHours && <span className="flex items-center gap-1 text-[10px] text-emerald-500"><Clock className="h-3 w-3" />{dev.availabilityHours} hrs/wk</span>}
              {dev.githubUsername && (
                <a href={dev.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400">
                  <ExternalLink className="h-3 w-3" />@{dev.githubUsername}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {dev.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dev.skills.slice(0, 5).map((s, i) => (
            <span key={i} className="text-[10px] font-mono text-amber-500 surface-raised border border-subtle px-1.5 py-0.5 rounded-[2px]">{s}</span>
          ))}
          {dev.skills.length > 5 && <span className="text-[10px] font-mono text-muted">+{dev.skills.length - 5}</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-subtle">
        <div className="flex items-center gap-3 text-xs font-mono text-muted">
          <span className="flex items-center gap-1"><FolderGit2 className="h-3 w-3" />{dev._count?.projects ?? 0} projects</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{dev._count?.projectMemberships ?? 0} contribs</span>
        </div>
        <ConnectButton userId={dev.id} />
      </div>
    </div>
  );
}

function DevelopersContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [skill, setSkill]   = useState("");
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["developers", search, skill, location, availability],
    queryFn: async () => {
      const { data } = await developersAPI.getAll({
        search: search || undefined,
        skill:  skill  || undefined,
        location: location || undefined,
        availability: availability ? parseInt(availability) : undefined,
        limit: 40,
      });
      return data;
    },
  });

  return (
    <div className="space-y-5 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary">Developers</h1>
        <p className="text-xs text-muted mt-0.5 font-sans">Discover and connect with developers worldwide</p>
      </div>

      {/* Filters */}
      <div className="surface-card rounded-sm border border-subtle p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input type="text" placeholder="Search developers…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full surface-input border border-subtle text-primary text-xs pl-9 pr-3.5 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted" />
            <input type="text" placeholder="Filter by location…" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full surface-input border border-subtle text-primary text-xs pl-9 pr-3.5 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono" />
          </div>
          <select value={availability} onChange={e => setAvailability(e.target.value)}
            className="surface-input border border-subtle text-primary text-xs px-3 py-2 rounded-sm focus:border-amber-500 focus:outline-none font-mono">
            {AVAIL.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs font-mono text-muted mr-1">Skills:</span>
          <button onClick={() => setSkill("")}
            className={`text-xs font-mono px-2.5 py-1 rounded-sm transition ${!skill ? "bg-amber-500 text-gray-950 font-bold" : "surface-raised text-muted border border-subtle hover:text-primary"}`}>
            All
          </button>
          {SKILLS.map(s => (
            <button key={s} onClick={() => setSkill(skill === s ? "" : s)}
              className={`text-xs font-mono px-2.5 py-1 rounded-sm transition ${skill === s ? "bg-amber-500 text-gray-950 font-bold" : "surface-raised text-muted border border-subtle hover:text-primary"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : data?.developers && data.developers.length > 0 ? (
        <>
          <p className="text-xs text-muted font-mono">{data.pagination.total} developers found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.developers.map(dev => <DeveloperCard key={dev.id} dev={dev} />)}
          </div>
        </>
      ) : (
        <div className="text-center py-20 surface-card rounded-sm border border-subtle">
          <Users className="h-10 w-10 mx-auto mb-3 text-muted" />
          <p className="text-primary font-mono font-medium mb-1">No developers found</p>
          <p className="text-xs text-muted font-sans">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

export default function DevelopersPage() {
  return <Suspense><DevelopersContent /></Suspense>;
}
