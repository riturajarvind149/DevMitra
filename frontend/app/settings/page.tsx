"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usersAPI, profileDataAPI } from "@/lib/api";
import {
  Save, LogOut, Globe, Lock, Users, Plus, X, ExternalLink,
  User, Bell, Shield, Palette, Link2, CreditCard, Trash2,
  Check, Moon, Sun, Monitor, ToggleLeft, ToggleRight,
  DollarSign, Star, Zap,
} from "lucide-react";

// ── Autocomplete data ─────────────────────────────────────────────────────────
const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh",
  "Belgium","Brazil","Canada","Chile","China","Colombia","Croatia","Czech Republic",
  "Denmark","Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece",
  "Hungary","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan",
  "Jordan","Kenya","Malaysia","Mexico","Morocco","Netherlands","New Zealand",
  "Nigeria","Norway","Pakistan","Peru","Philippines","Poland","Portugal","Romania",
  "Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain",
  "Sri Lanka","Sweden","Switzerland","Taiwan","Thailand","Turkey","Ukraine",
  "United Arab Emirates","United Kingdom","United States","Vietnam",
];

const SKILL_SUGGESTIONS = [
  "React","React Native","Redux","Remix","Ruby","Ruby on Rails","Rust",
  "Python","PyTorch","PostgreSQL","PHP","Prisma",
  "Node.js","Next.js","NestJS","Nuxt.js",
  "TypeScript","TailwindCSS","Three.js",
  "Vue.js","Vite","Vercel",
  "Angular","AWS","Azure","Ansible",
  "Docker","Django","Dart",
  "Flutter","Firebase","FastAPI",
  "Go","GraphQL","Git",
  "Java","JavaScript","Jenkins","Jest",
  "Kubernetes","Kotlin",
  "Linux","Laravel",
  "MongoDB","MySQL","MUI",
  "Swift","Svelte","Solidity","Spring Boot",
  "C","C++","C#","CSS",
  "HTML","Haskell",
  "Elasticsearch","Express.js",
  "Bootstrap","Bash",
  "Figma","Flask",
  "Terraform","TensorFlow",
  "OpenAI","OpenCV",
];

// ── Suggestion dropdown ───────────────────────────────────────────────────────
function SuggestionInput({
  value, onChange, onSelect, suggestions, placeholder, className, type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;  // called when user picks from dropdown or hits Enter
  suggestions: string[];
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    if (v.trim().length >= 1) {
      const f = suggestions.filter(s => s.toLowerCase().includes(v.toLowerCase())).slice(0, 6);
      setFiltered(f);
      setOpen(f.length > 0);
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onSelect && value.trim()) {
        onSelect(value.trim());
        setOpen(false);
      }
    }
    if (e.key === "Escape") setOpen(false);
  };

  const pick = (s: string) => {
    if (onSelect) {
      onSelect(s);
      onChange("");
    } else {
      onChange(s);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <input
        type={type}
        value={value}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        onFocus={() => value.length >= 1 && filtered.length > 0 && setOpen(true)}
      />
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-xl shadow-2xl overflow-hidden">
          {filtered.map(s => (
            <button key={s} type="button"
              className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-indigo-600 hover:text-white transition"
              onMouseDown={e => { e.preventDefault(); pick(s); }}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-indigo-600" : "bg-gray-700"}`}>
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
    </button>
  );
}

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none placeholder-gray-600";

// ── Appearance tab — uses next-themes for real theme switching ───────────────
function AppearanceTab() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
      <h2 className="text-sm font-semibold text-white mb-4">Appearance</h2>
      <p className="text-sm text-gray-400 mb-3">Theme</p>
      <div className="grid grid-cols-3 gap-3">
        {[
          { value: "dark",   label: "Dark",   icon: Moon },
          { value: "light",  label: "Light",  icon: Sun },
          { value: "system", label: "System", icon: Monitor },
        ].map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button key={value} type="button" onClick={() => setTheme(value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition cursor-pointer ${
                active ? "border-indigo-600 bg-indigo-900/30" : "border-gray-700 bg-gray-800 hover:border-gray-600"
              }`}>
              <Icon className={`h-6 w-6 ${active ? "text-indigo-400" : "text-gray-500"}`} />
              <span className={`text-xs font-medium ${active ? "text-white" : "text-gray-400"}`}>{label}</span>
              {active && <Check className="h-3.5 w-3.5 text-indigo-400" />}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-gray-600 mt-4">
        Theme is saved and applied immediately. Light mode is in beta.
      </p>
    </div>
  );
}

// ── Settings tabs ─────────────────────────────────────────────────────────────
type Tab = "profile" | "notifications" | "security" | "appearance" | "integrations" | "billing";

const NAV: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "profile",       label: "Profile",       icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security",      label: "Security",      icon: Shield },
  { key: "appearance",    label: "Appearance",    icon: Palette },
  { key: "integrations",  label: "Integrations",  icon: Link2 },
  { key: "billing",       label: "Billing",       icon: CreditCard },
];

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Profile fields
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [availability, setAvailability] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    newProposals: true, comments: true, connections: true,
    projectLikes: true, repoRequests: true, opportunities: true,
  });

  // Billing
  const [isPaidContributor, setIsPaidContributor] = useState(false);
  const [pricePerBug, setPricePerBug] = useState("");
  const [pricePerFeature, setPricePerFeature] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [openForPaid, setOpenForPaid] = useState(false);
  const [billingSaved, setBillingSaved] = useState(false);

  // Profile data for billing eligibility
  const { data: profileData } = useQuery({
    queryKey: ["fullProfile", user?.id],
    queryFn: async () => { const { data } = await profileDataAPI.getMyProfile(); return data; },
    enabled: !!user,
    staleTime: 60000,
  });

  const isEligibleForBilling = (profileData?.reputation?.level ?? 0) >= 6
    || (profileData?.badges ?? []).length >= 5;

  // Initialize billing state from profileData once it loads
  const [billingHydrated, setBillingHydrated] = useState(false);
  useEffect(() => {
    if (profileData && !billingHydrated) {
      setIsPaidContributor(profileData.user?.isPaidContributor ?? false);
      setPricePerBug(profileData.user?.pricePerBug?.toString() ?? "");
      setPricePerFeature(profileData.user?.pricePerFeature?.toString() ?? "");
      setHourlyRate(profileData.user?.hourlyRate?.toString() ?? "");
      setOpenForPaid(profileData.user?.openForPaidWork ?? false);
      setBillingHydrated(true);
    }
  }, [profileData, billingHydrated]);

  useEffect(() => {
    if (user && !hydrated) {
      setUsername(user.username ?? "");
      setBio(user.bio ?? "");
      setLocation(user.location ?? "");
      setWebsite(user.website ?? "");
      setLinkedin((user as any).linkedinUrl ?? "");
      setTwitter((user as any).twitterUrl ?? "");
      setPortfolio((user as any).portfolioUrl ?? "");
      setAvailability((user as any).availabilityHours?.toString() ?? "");
      setSkills(user.skills ?? []);
      setVisibility((user as any).profileVisibility ?? "PUBLIC");
      setHydrated(true);
    }
  }, [user, hydrated]);

  const addSkill = (rawInput?: string) => {
    const source = rawInput ?? skillInput;
    // Support comma-separated input
    const parts = source.split(",").map(s => s.trim()).filter(Boolean);
    const newSkills = parts.filter(s => !skills.includes(s));
    if (newSkills.length) setSkills(p => [...p, ...newSkills]);
    setSkillInput("");
  };

  const updateMut = useMutation({
    mutationFn: () => usersAPI.update(user!.id, {
      username, bio, location, website,
      linkedinUrl: linkedin, twitterUrl: twitter,
      portfolioUrl: portfolio,
      availabilityHours: availability ? parseInt(availability) : undefined,
      skills, profileVisibility: visibility,
    } as any),
    onSuccess: async () => { await refreshUser(); setSaved(true); setTimeout(() => setSaved(false), 2500); },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to save"),
  });

  const billingMut = useMutation({
    mutationFn: () => usersAPI.update(user!.id, {
      isPaidContributor,
      pricePerBug:     pricePerBug     ? parseFloat(pricePerBug)     : undefined,
      pricePerFeature: pricePerFeature ? parseFloat(pricePerFeature) : undefined,
      hourlyRate:      hourlyRate      ? parseFloat(hourlyRate)      : undefined,
      openForPaidWork: openForPaid,
    } as any),
    onSuccess: async () => { await refreshUser(); setBillingSaved(true); setTimeout(() => setBillingSaved(false), 2500); },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to save billing settings"),
  });

  if (!user) return null;

  const VIS_OPTIONS = [
    { value: "PUBLIC",           label: "Public",           desc: "Anyone can view",        icon: Globe,  cls: "border-green-600 bg-green-900/30", active: "text-green-400" },
    { value: "CONNECTIONS_ONLY", label: "Connections Only", desc: "Only connections",        icon: Users,  cls: "border-blue-600 bg-blue-900/30",  active: "text-blue-400"  },
    { value: "PRIVATE",          label: "Private",          desc: "Only you",                icon: Lock,   cls: "border-red-600 bg-red-900/30",    active: "text-red-400"   },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>
      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 120px)" }}>
        {/* Left nav — fixed, doesn't scroll */}
        <nav className="w-44 flex-shrink-0 self-start sticky top-0">
          <div className="space-y-0.5">
            {NAV.map(({ key, label, icon: Icon }) => {
              const locked = false; // billing is unlocked for all users
              return (
                <button key={key} onClick={() => !locked && setTab(key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                    tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  } ${locked ? "opacity-40 cursor-not-allowed" : ""}`}>
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                  {locked && <Lock className="h-3 w-3 ml-auto" />}
                </button>
              );
            })}
          </div>
          <div className="pt-4 mt-4 border-t border-gray-800">
            <button onClick={() => setConfirmLogout(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition">
              <LogOut className="h-4 w-4" />Sign Out
            </button>
          </div>
        </nav>

        {/* Right content — scrolls independently */}
        <div className="flex-1 min-w-0 space-y-4 overflow-y-auto pb-8">

          {/* ── Profile tab ─────────────────────────────────────────────── */}
          {tab === "profile" && (
            <>
              {/* Avatar */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 flex items-center gap-4">
                {user.avatarUrl
                  ? <img src={user.avatarUrl} alt="" className="w-14 h-14 rounded-2xl" />
                  : <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
                    </div>
                }
                <div>
                  <p className="text-sm font-semibold text-white">{user.username}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Avatar synced from GitHub</p>
                  {user.githubProfileUrl && (
                    <a href={user.githubProfileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-indigo-400 flex items-center gap-1 mt-1 hover:text-indigo-300">
                      <ExternalLink className="h-3 w-3" />Edit on GitHub
                    </a>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white">Public Profile</h2>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Display Name</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Bio</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    placeholder="Tell developers about yourself…" className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Location / Country</label>
                    <SuggestionInput value={location} onChange={setLocation}
                      suggestions={COUNTRIES} placeholder="e.g. India, United States"
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Website</label>
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                      placeholder="https://yoursite.com" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">LinkedIn URL</label>
                    <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/…" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Twitter/X URL</label>
                    <input type="url" value={twitter} onChange={e => setTwitter(e.target.value)}
                      placeholder="https://twitter.com/…" className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Portfolio URL</label>
                    <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                      placeholder="https://yourportfolio.com" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Availability (hrs/week)</label>
                    <input type="number" min="0" max="80" value={availability}
                      onChange={e => setAvailability(e.target.value)} placeholder="e.g. 20" className={inputCls} />
                  </div>
                </div>

                {/* Skills with autocomplete + comma-separated */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Skills</label>
                  <div className="flex gap-2 mb-2">
                    <SuggestionInput value={skillInput} onChange={setSkillInput}
                      onSelect={(v) => addSkill(v)}
                      suggestions={SKILL_SUGGESTIONS.filter(s => !skills.includes(s))}
                      placeholder="e.g. React, Python, Docker (comma separated)"
                      className={`${inputCls} flex-1`} />
                    <button type="button" onClick={() => addSkill()} disabled={!skillInput.trim()}
                      className="bg-indigo-600 text-white px-3 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {skills.map(s => (
                        <span key={s} className="flex items-center gap-1 text-xs text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2.5 py-1 rounded-full">
                          {s}
                          <button onClick={() => setSkills(p => p.filter(x => x !== s))}
                            className="hover:text-red-400 transition"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Visibility */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h2 className="text-sm font-semibold text-white mb-3">Profile Visibility</h2>
                <div className="grid grid-cols-3 gap-2">
                  {VIS_OPTIONS.map(({ value, label, desc, icon: Icon, cls, active }) => (
                    <button key={value} type="button" onClick={() => setVisibility(value)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
                        visibility === value ? cls : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
                      <Icon className={`h-5 w-5 ${visibility === value ? active : "text-gray-500"}`} />
                      <span className={`text-xs font-semibold ${visibility === value ? "text-white" : "text-gray-400"}`}>{label}</span>
                      <span className="text-[10px] text-gray-600">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending || !username.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition ${
                  saved ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"} disabled:opacity-50`}>
                <Save className="h-4 w-4" />
                {saved ? "Saved!" : updateMut.isPending ? "Saving…" : "Save Changes"}
              </button>
            </>
          )}

          {/* ── Notifications tab ───────────────────────────────────────── */}
          {tab === "notifications" && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-white">Notification Preferences</h2>
              {[
                { key: "newProposals",   label: "New Proposals",    desc: "When someone submits a proposal on your project" },
                { key: "comments",       label: "Comments",          desc: "When someone comments on your proposals" },
                { key: "connections",    label: "Connections",       desc: "When someone sends you a connection request" },
                { key: "projectLikes",   label: "Project Likes",     desc: "When someone likes your project" },
                { key: "repoRequests",   label: "Repo Requests",     desc: "When someone requests repository access" },
                { key: "opportunities",  label: "Opportunities",     desc: "When someone applies to your opportunity" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <Toggle checked={(notifPrefs as any)[key]} onChange={v => setNotifPrefs(p => ({ ...p, [key]: v }))} />
                </div>
              ))}
              <p className="text-xs text-gray-600 pt-2">Email notifications are controlled by your GitHub account settings.</p>
            </div>
          )}

          {/* ── Security tab ────────────────────────────────────────────── */}
          {tab === "security" && (
            <>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
                <h2 className="text-sm font-semibold text-white">Connected Account</h2>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-white">G</div>
                    <div>
                      <p className="text-sm font-medium text-white">GitHub</p>
                      <p className="text-xs text-gray-500">@{user.githubUsername ?? "not connected"}</p>
                    </div>
                    <span className="text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">Connected</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Your account is secured via GitHub OAuth. No password is stored on DevMitra.</p>
              </div>
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <h2 className="text-sm font-semibold text-white mb-3">Active Sessions</h2>
                <div className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                  <div>
                    <p className="text-sm text-white">Current Browser</p>
                    <p className="text-xs text-gray-500">Active now</p>
                  </div>
                  <span className="text-[10px] text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">Current</span>
                </div>
              </div>
              <div className="bg-red-950/30 rounded-2xl border border-red-900/40 p-5">
                <h2 className="text-sm font-semibold text-red-400 mb-2">Danger Zone</h2>
                <p className="text-xs text-gray-500 mb-3">Permanently delete your account and all associated data.</p>
                <button className="flex items-center gap-2 text-sm text-red-400 border border-red-800 px-4 py-2 rounded-xl hover:bg-red-900/20 transition">
                  <Trash2 className="h-4 w-4" />Delete Account
                </button>
              </div>
            </>
          )}

          {/* ── Appearance tab ──────────────────────────────────────────── */}
          {tab === "appearance" && (
            <AppearanceTab />
          )}

          {/* ── Integrations tab ────────────────────────────────────────── */}
          {tab === "integrations" && (
            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-white mb-1">Integrations</h2>
              <p className="text-xs text-gray-500 mb-3">Connect external services to enhance your DevMitra experience.</p>

              {/* GitHub — always connected via OAuth */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center text-sm font-bold text-white">G</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">GitHub</p>
                      <span className="text-[10px] text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded-full">Connected</span>
                    </div>
                    <p className="text-xs text-gray-500">Connected as @{user.githubUsername ?? user.username}</p>
                  </div>
                </div>
                <a href={user.githubProfileUrl ?? `https://github.com/${user.githubUsername}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition text-indigo-400 border border-indigo-800 hover:bg-indigo-900/20">
                  View Profile
                </a>
              </div>

              {/* Vercel */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-black border border-gray-700 flex items-center justify-center text-sm font-bold text-white">▲</div>
                  <div>
                    <p className="text-sm font-medium text-white">Vercel</p>
                    <p className="text-xs text-gray-500">Deploy your projects directly from DevMitra</p>
                  </div>
                </div>
                <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition text-white bg-black border border-gray-600 hover:bg-gray-900">
                  Open Vercel
                </a>
              </div>

              {/* Railway */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-900 border border-purple-700 flex items-center justify-center text-sm font-bold text-white">R</div>
                  <div>
                    <p className="text-sm font-medium text-white">Railway</p>
                    <p className="text-xs text-gray-500">Deploy backend services in seconds</p>
                  </div>
                </div>
                <a href="https://railway.app" target="_blank" rel="noopener noreferrer"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg transition text-white bg-indigo-600 hover:bg-indigo-700">
                  Open Railway
                </a>
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-700 border border-blue-600 flex items-center justify-center text-sm font-bold text-white">in</div>
                  <div>
                    <p className="text-sm font-medium text-white">LinkedIn</p>
                    <p className="text-xs text-gray-500">Share your projects on LinkedIn</p>
                  </div>
                </div>
                {(user as any).linkedinUrl ? (
                  <a href={(user as any).linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition text-green-400 border border-green-800 hover:bg-green-900/20">
                    View Profile
                  </a>
                ) : (
                  <button onClick={() => setTab("profile")}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg transition text-white bg-blue-700 hover:bg-blue-800">
                    Add in Profile
                  </button>
                )}
              </div>

              <p className="text-[10px] text-gray-600 pt-2">More integrations coming soon — API keys, Webhooks, Slack, Jira.</p>
            </div>
          )}

          {/* ── Billing tab ─────────────────────────────────────────────── */}
          {tab === "billing" && (
            <div className="space-y-4">
                {/* Eligibility badge */}
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-2xl border border-indigo-700/50 p-4 flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">Verified Developer</p>
                    <p className="text-xs text-gray-400">
                      Level {profileData?.reputation?.level} · {(profileData?.badges ?? []).length} badges earned
                    </p>
                  </div>
                  <span className="ml-auto text-xs text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full font-medium">Eligible</span>
                </div>

                {/* Paid contributor toggle */}
                <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white">Paid Contributor</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Switch to a paid contributor account to charge for your work</p>
                    </div>
                    <Toggle checked={isPaidContributor} onChange={setIsPaidContributor} />
                  </div>

                  {isPaidContributor && (
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5">Per Bug Fix ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                            <input type="number" min="0" step="0.01" aria-label="Price per bug fix (USD)" value={pricePerBug}
                              onChange={e => setPricePerBug(e.target.value)}
                              placeholder="50" className={`${inputCls} pl-8 text-xs`} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5">Per Feature ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                            <input type="number" min="0" step="0.01" aria-label="Price per feature (USD)" value={pricePerFeature}
                              onChange={e => setPricePerFeature(e.target.value)}
                              placeholder="200" className={`${inputCls} pl-8 text-xs`} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1.5">Hourly Rate ($)</label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-500" />
                            <input type="number" min="0" step="0.01" aria-label="Hourly rate (USD)" value={hourlyRate}
                              onChange={e => setHourlyRate(e.target.value)}
                              placeholder="30" className={`${inputCls} pl-8 text-xs`} />
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-600">Rates are shown on your public profile to project owners looking to hire.</p>
                      <div className="flex items-center justify-between py-3 border-t border-gray-800">
                        <div>
                          <p className="text-sm font-medium text-white">Open for Paid Collaborations</p>
                          <p className="text-xs text-gray-500">Show a &quot;Hire Me&quot; badge on your profile</p>
                        </div>
                        <Toggle checked={openForPaid} onChange={setOpenForPaid} />
                      </div>
                    </div>
                  )}
                </div>

                {isPaidContributor && (
                  <div className="bg-indigo-900/20 rounded-2xl border border-indigo-800/40 p-4">
                    <p className="text-xs text-indigo-400 flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5" />
                      Your paid contributor rates are now visible on your public profile. Project owners can contact you directly.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => billingMut.mutate()}
                  disabled={billingMut.isPending}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
                    billingSaved ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
                  } disabled:opacity-50`}
                >
                  <Save className="h-4 w-4" />
                  {billingSaved ? "Saved!" : billingMut.isPending ? "Saving…" : "Save Billing Settings"}
                </button>
            </div>
          )}

        </div>
      </div>

      {/* ── Logout Confirmation Modal ─────────────────────────────────────── */}
      {confirmLogout && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
                <LogOut className="h-5 w-5 text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-white">Sign Out?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Are you sure you want to sign out of DevMitra?
            </p>
            <div className="flex gap-3">
              <button onClick={logout}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 transition">
                Sign Out
              </button>
              <button onClick={() => setConfirmLogout(false)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
