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

function DeveloperCard({ dev }: { dev: any }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <Link href={`/users/${dev.id}`}>
            {dev.avatarUrl
              ? <img src={dev.avatarUrl} alt="" className="w-12 h-12 rounded-2xl flex-shrink-0" />
              : <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold">{dev.username.charAt(0).toUpperCase()}</div>
            }
          </Link>
          <div className="min-w-0">
            <Link href={`/users/${dev.id}`} className="text-sm font-semibold text-white hover:text-indigo-400 transition block">{dev.username}</Link>
            {dev.bio && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{dev.bio}</p>}
            <div className="flex flex-wrap gap-2 mt-1.5">
              {dev.location && <span className="flex items-center gap-1 text-[10px] text-gray-600"><MapPin className="h-3 w-3" />{dev.location}</span>}
              {dev.availabilityHours && <span className="flex items-center gap-1 text-[10px] text-green-500"><Clock className="h-3 w-3" />{dev.availabilityHours} hrs/wk</span>}
              {dev.githubUsername && (
                <a href={dev.githubProfileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300">
                  <ExternalLink className="h-3 w-3" />@{dev.githubUsername}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {dev.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {dev.skills.slice(0, 5).map((s: string, i: number) => (
            <span key={i} className="text-[10px] text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {dev.skills.length > 5 && <span className="text-[10px] text-gray-600">+{dev.skills.length - 5}</span>}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-800">
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><FolderGit2 className="h-3 w-3" />{dev._count?.projects ?? 0} projects</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{dev._count?.projectMemberships ?? 0} contributions</span>
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
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Developers</h1>
        <p className="text-sm text-gray-500 mt-0.5">Discover and connect with developers worldwide</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Search developers…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input type="text" placeholder="Filter by location…" value={location} onChange={e => setLocation(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm pl-10 pr-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
          </div>
          <select value={availability} onChange={e => setAvailability(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none">
            {AVAIL.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center mr-1">Skills:</span>
          <button onClick={() => setSkill("")}
            className={`text-xs px-3 py-1 rounded-full transition ${!skill ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            All
          </button>
          {SKILLS.map(s => (
            <button key={s} onClick={() => setSkill(skill === s ? "" : s)}
              className={`text-xs px-3 py-1 rounded-full transition ${skill === s ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : data?.developers && data.developers.length > 0 ? (
        <>
          <p className="text-xs text-gray-600 mb-4">{data.pagination.total} developers found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.developers.map(dev => <DeveloperCard key={dev.id} dev={dev} />)}
          </div>
        </>
      ) : (
        <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-700" />
          <p className="text-white font-medium mb-1">No developers found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

export default function DevelopersPage() {
  return <Suspense><DevelopersContent /></Suspense>;
}
