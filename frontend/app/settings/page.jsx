"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { usersAPI, profileDataAPI } from "@/lib/api";
import {
  UserIcon,
  BellIcon,
  ShieldIcon,
  SettingsIcon,
  LockIcon,
  GlobeIcon,
  UsersIcon,
  PlusIcon,
  CloseIcon,
  TrashIcon,
  CheckIcon,
  MoonIcon,
  SunIcon,
  LogOutIcon,
  ExternalLinkIcon,
  TerminalIcon,
} from "@/components/icons";

// Autocomplete data
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

function SuggestionInput({
  value, onChange, onSelect, suggestions, placeholder, className,
}) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (v) => {
    onChange(v);
    if (v.trim().length >= 1) {
      const f = suggestions.filter(s => s.toLowerCase().includes(v.toLowerCase())).slice(0, 6);
      setFiltered(f);
      setOpen(f.length > 0);
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (onSelect && value.trim()) {
        onSelect(value.trim());
        setOpen(false);
      }
    }
    if (e.key === "Escape") setOpen(false);
  };

  const pick = (s) => {
    if (onSelect) {
      onSelect(s);
      onChange("");
    } else {
      onChange(s);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim().length >= 1 && filtered.length > 0 && setOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 surface-card border border-subtle rounded-sm z-50 overflow-hidden font-mono text-xs">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => pick(s)}
              className="w-full text-left px-3 py-2 text-secondary hover:surface-raised hover:text-amber-500 transition block truncate"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Precision toggle switch
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-sm transition-colors border ${
        checked ? "bg-amber-500 border-amber-600" : "surface-raised border-subtle"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-[1px] transition-transform ${
          checked ? "translate-x-4 bg-gray-950" : "bg-gray-400"
        }`}
      />
    </button>
  );
}

const inputCls = "w-full surface-input border border-subtle text-primary text-xs px-3.5 py-2 rounded-sm focus:border-amber-500 focus:outline-none placeholder:text-muted font-mono transition";

// Appearance tab
function AppearanceTab() {
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const handleSelect = (val, label) => {
    setTheme(val);
    toast.info(`Workstation theme updated to ${label}`, "Appearance");
  };

  return (
    <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
      <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-wider mb-2">
        Appearance & Engine Theme
      </h2>
      <p className="text-xs text-muted mb-4 font-sans">
        Select your workstation color scheme for code clarity and high-contrast ergonomics.
      </p>
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 max-w-md">
        {[
          { value: "dark",   label: "Dark Slate",  icon: MoonIcon },
          { value: "light",  label: "Tech Light",  icon: SunIcon },
          { value: "system", label: "System Sync", icon: TerminalIcon },
        ].map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value, label)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-sm border transition cursor-pointer font-mono ${
                active
                  ? "border-amber-500 bg-amber-500/10 text-amber-500 font-bold"
                  : "border-subtle surface-raised text-muted hover:border-amber-500/40 hover:text-primary"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[11px] truncate">{label}</span>
              {active && <CheckIcon className="h-3 w-3 text-amber-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const NAV = [
  { key: "profile",       label: "Profile",       icon: UserIcon },
  { key: "notifications", label: "Notifications", icon: BellIcon },
  { key: "security",      label: "Security",      icon: ShieldIcon },
  { key: "appearance",    label: "Appearance",    icon: SettingsIcon },
  { key: "integrations",  label: "Integrations",  icon: TerminalIcon },
  { key: "billing",       label: "Billing",       icon: LockIcon },
];

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState("profile");
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
  const [skills, setSkills] = useState([]);
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
    queryKey: ["myFullProfile", user?.id],
    queryFn: async () => { const { data } = await profileDataAPI.getMyProfile(); return data; },
    enabled: !!user,
  });

  useEffect(() => {
    if (profileData?.user) {
      const u = profileData.user;
      setIsPaidContributor(Boolean(u.isPaidContributor));
      setPricePerBug(u.pricePerBug?.toString() ?? "");
      setPricePerFeature(u.pricePerFeature?.toString() ?? "");
      setHourlyRate(u.hourlyRate?.toString() ?? "");
      setOpenForPaid(Boolean(u.openForPaidWork));
    }
  }, [profileData]);

  useEffect(() => {
    if (user && !hydrated) {
      setUsername(user.username ?? "");
      setBio(user.bio ?? "");
      setLocation(user.location ?? "");
      setWebsite(user.website ?? "");
      setLinkedin(user.linkedinUrl ?? "");
      setTwitter(user.twitterUrl ?? "");
      setPortfolio(user.portfolioUrl ?? "");
      setAvailability(user.availabilityHours?.toString() ?? "");
      setSkills(user.skills ?? []);
      setVisibility(user.profileVisibility ?? "PUBLIC");
      setHydrated(true);
    }
  }, [user, hydrated]);

  const addSkill = (rawInput) => {
    const source = rawInput ?? skillInput;
    const parts = source.split(",").map(s => s.trim()).filter(Boolean);
    const newSkills = parts.filter(s => !skills.includes(s));
    if (newSkills.length) setSkills(p => [...p, ...newSkills]);
    setSkillInput("");
  };

  const updateMut = useMutation({
    mutationFn: () => usersAPI.update(user.id, {
      username, bio, location, website,
      linkedinUrl: linkedin, twitterUrl: twitter,
      portfolioUrl: portfolio,
      availabilityHours: availability ? parseInt(availability) : undefined,
      skills, profileVisibility: visibility,
    }),
    onSuccess: async () => { await refreshUser(); setSaved(true); setTimeout(() => setSaved(false), 2500); },
    onError: (e) => alert(e.response?.data?.message || "Failed to save"),
  });

  const billingMut = useMutation({
    mutationFn: () => usersAPI.update(user.id, {
      isPaidContributor,
      pricePerBug:     pricePerBug     ? parseFloat(pricePerBug)     : undefined,
      pricePerFeature: pricePerFeature ? parseFloat(pricePerFeature) : undefined,
      hourlyRate:      hourlyRate      ? parseFloat(hourlyRate)      : undefined,
      openForPaidWork: openForPaid,
    }),
    onSuccess: async () => { await refreshUser(); setBillingSaved(true); setTimeout(() => setBillingSaved(false), 2500); },
    onError: (e) => alert(e.response?.data?.message || "Failed to save billing settings"),
  });

  if (!user) return null;

  const VIS_OPTIONS = [
    { value: "PUBLIC",           label: "Public",           desc: "Visible to all developers", icon: GlobeIcon,  activeCls: "border-emerald-500 text-emerald-500 bg-emerald-500/10" },
    { value: "CONNECTIONS_ONLY", label: "Connections Only", desc: "Only accepted peers",       icon: UsersIcon,  activeCls: "border-sky-500 text-sky-500 bg-sky-500/10" },
    { value: "PRIVATE",          label: "Private",          desc: "Only you can view",          icon: LockIcon,   activeCls: "border-amber-500 text-amber-500 bg-amber-500/10" },
  ];

  return (
    <div className="w-full min-w-0 max-w-full space-y-5 font-sans">
      <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary">
        Settings
      </h1>

      {/* Mobile Horizontal Scrollable Tab Bar */}
      <div className="md:hidden overflow-x-auto scrollbar-hide flex gap-1.5 pb-2 border-b border-subtle">
        {NAV.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono whitespace-nowrap transition flex-shrink-0 ${
              tab === key
                ? "bg-amber-500 text-gray-950 font-bold"
                : "surface-raised border border-subtle text-muted hover:text-primary"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono whitespace-nowrap bg-red-950/40 border border-red-800 text-red-400 hover:bg-red-900/40 transition flex-shrink-0"
        >
          <LogOutIcon className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full min-w-0 max-w-full items-start">
        {/* Left nav for desktop */}
        <nav className="hidden md:block w-48 flex-shrink-0 self-start sticky top-4">
          <div className="space-y-1">
            {NAV.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-mono transition ${
                  tab === key
                    ? "bg-amber-500 text-gray-950 font-bold"
                    : "text-muted hover:surface-raised hover:text-primary"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="pt-3 mt-3 border-t border-subtle">
            <button
              onClick={() => setConfirmLogout(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs font-mono text-red-400 hover:bg-red-950/20 transition"
            >
              <LogOutIcon className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>

        {/* Right content */}
        <div className="w-full flex-1 min-w-0 max-w-full space-y-4 pb-8">
          {/* Profile tab */}
          {tab === "profile" && (
            <>
              {/* Avatar Strip */}
              <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5 flex items-center gap-4 w-full min-w-0 max-w-full overflow-hidden">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-12 h-12 rounded-sm object-cover border border-subtle flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-sm surface-raised border border-subtle flex items-center justify-center flex-shrink-0 font-mono font-bold text-amber-500 text-xl">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold font-mono text-primary truncate">{user.username}</p>
                  <p className="text-xs text-muted mt-0.5 truncate font-sans">Avatar synced from GitHub</p>
                  {user.githubProfileUrl && (
                    <a
                      href={user.githubProfileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-amber-500 flex items-center gap-1 mt-1 hover:underline"
                    >
                      <ExternalLinkIcon className="h-3 w-3" />
                      <span>Edit on GitHub</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Form */}
              <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5 space-y-3.5 w-full min-w-0 max-w-full overflow-hidden">
                <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider">
                  Public Profile Information
                </h2>
                <div>
                  <label className="block text-xs font-mono text-muted mb-1">Display Name</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-mono text-muted mb-1">Bio</label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell developers about your tech stack and experience..."
                    className={`${inputCls} resize-none`}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-muted mb-1">Location / Country</label>
                    <SuggestionInput
                      value={location}
                      onChange={setLocation}
                      suggestions={COUNTRIES}
                      placeholder="e.g. India, United States"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted mb-1">Website</label>
                    <input
                      type="url"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://yoursite.com"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-muted mb-1">LinkedIn URL</label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted mb-1">Twitter/X URL</label>
                    <input
                      type="url"
                      value={twitter}
                      onChange={e => setTwitter(e.target.value)}
                      placeholder="https://twitter.com/..."
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-muted mb-1">Portfolio URL</label>
                    <input
                      type="url"
                      value={portfolio}
                      onChange={e => setPortfolio(e.target.value)}
                      placeholder="https://yourportfolio.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-muted mb-1">Availability (hrs/week)</label>
                    <input
                      type="number"
                      min="0"
                      max="80"
                      value={availability}
                      onChange={e => setAvailability(e.target.value)}
                      placeholder="e.g. 20"
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <label className="block text-xs font-mono text-muted mb-1">Technical Skills</label>
                  <div className="flex gap-2 mb-2">
                    <SuggestionInput
                      value={skillInput}
                      onChange={setSkillInput}
                      onSelect={(v) => addSkill(v)}
                      suggestions={SKILL_SUGGESTIONS.filter(s => !skills.includes(s))}
                      placeholder="e.g. React, Python, Docker (press Enter)"
                      className={`${inputCls} flex-1`}
                    />
                    <button
                      type="button"
                      onClick={() => addSkill()}
                      disabled={!skillInput.trim()}
                      aria-label="Add Skill"
                      className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-3 rounded-sm disabled:opacity-40 transition flex items-center justify-center flex-shrink-0"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skills.map(s => (
                        <span
                          key={s}
                          className="flex items-center gap-1.5 text-xs font-mono text-secondary surface-raised border border-subtle px-2 py-0.5 rounded-sm"
                        >
                          <span>{s}</span>
                          <button
                            onClick={() => setSkills(p => p.filter(x => x !== s))}
                            aria-label={`Remove skill ${s}`}
                            className="hover:text-red-400 transition"
                          >
                            <CloseIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Visibility */}
              <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
                <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider mb-3">
                  Profile Visibility
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {VIS_OPTIONS.map(({ value, label, desc, icon: Icon, activeCls }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setVisibility(value)}
                      className={`flex flex-col items-start p-3 rounded-sm border transition text-left ${
                        visibility === value
                          ? activeCls
                          : "border-subtle surface-raised text-muted hover:border-amber-500/40 hover:text-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4 mb-1" />
                      <span className="text-xs font-bold font-mono block">{label}</span>
                      <span className="text-[10px] text-muted block mt-0.5 font-sans">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => updateMut.mutate()}
                disabled={updateMut.isPending || !username.trim()}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-sm text-xs font-mono font-bold transition ${
                  saved
                    ? "bg-emerald-500 text-gray-950"
                    : "bg-amber-500 hover:bg-amber-400 text-gray-950"
                } disabled:opacity-50`}
              >
                {saved ? "Profile Saved" : updateMut.isPending ? "Saving..." : "Save Profile"}
              </button>
            </>
          )}

          {/* Notifications tab */}
          {tab === "notifications" && (
            <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5 space-y-3 w-full min-w-0 max-w-full overflow-hidden">
              <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider mb-2">
                Notification Preferences
              </h2>
              {[
                { key: "newProposals",   label: "New Proposals",    desc: "When someone submits a proposal on your repository" },
                { key: "comments",       label: "Comments",          desc: "When someone comments on your code or updates" },
                { key: "connections",    label: "Connections",       desc: "When someone sends you a connection request" },
                { key: "projectLikes",   label: "Project Likes",     desc: "When someone stars or likes your project" },
                { key: "repoRequests",   label: "Repo Requests",     desc: "When someone requests repository access" },
                { key: "opportunities",  label: "Opportunities",     desc: "When someone applies to your open role" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between py-2.5 border-b border-subtle last:border-0 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold font-mono text-primary">{label}</p>
                    <p className="text-xs text-muted mt-0.5 font-sans leading-snug">{desc}</p>
                  </div>
                  <Toggle checked={(notifPrefs)[key]} onChange={v => setNotifPrefs(p => ({ ...p, [key]: v }))} />
                </div>
              ))}
              <p className="text-[10px] text-muted pt-2 font-mono">
                Email notifications are controlled via your connected GitHub account.
              </p>
            </div>
          )}

          {/* Security tab */}
          {tab === "security" && (
            <div className="space-y-4">
              <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5 space-y-3 w-full min-w-0 max-w-full overflow-hidden">
                <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider">
                  Authentication & Security
                </h2>
                <div className="flex items-center justify-between p-3 surface-raised border border-subtle rounded-sm gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-sm surface-base border border-subtle flex items-center justify-center font-mono font-bold text-primary flex-shrink-0 text-xs">
                      GH
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold font-mono text-primary">GitHub OAuth</p>
                      <p className="text-[10px] text-muted font-mono truncate">@{user.githubUsername ?? "connected"}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-[2px] font-bold">
                    CONNECTED
                  </span>
                </div>
                <p className="text-xs text-muted font-sans">
                  Your identity is secured by GitHub OAuth tokens. No raw passwords are stored on DevMitra servers.
                </p>
              </div>

              <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5 w-full min-w-0 max-w-full overflow-hidden">
                <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider mb-2">
                  Active Sessions
                </h2>
                <div className="flex items-center justify-between p-3 surface-raised border border-subtle rounded-sm gap-3">
                  <div>
                    <p className="text-xs font-mono font-bold text-primary">Current Browser Workstation</p>
                    <p className="text-[10px] text-muted font-mono">Active token session</p>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-[2px] font-bold">
                    ONLINE
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Appearance tab */}
          {tab === "appearance" && <AppearanceTab />}

          {/* Integrations tab */}
          {tab === "integrations" && (
            <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5 space-y-3 w-full min-w-0 max-w-full overflow-hidden">
              <h2 className="text-xs font-mono font-bold text-muted uppercase tracking-wider mb-1">
                Developer Integrations
              </h2>
              <p className="text-xs text-muted mb-3 font-sans">
                Connect external developer platforms to showcase and deploy your code.
              </p>

              {/* GitHub */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 surface-raised border border-subtle rounded-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-sm surface-card border border-subtle flex items-center justify-center font-mono font-bold text-xs text-primary flex-shrink-0">
                    GH
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold font-mono text-primary">GitHub</p>
                    <p className="text-[10px] text-muted font-mono truncate">Connected as @{user.githubUsername ?? user.username}</p>
                  </div>
                </div>
                <a
                  href={user.githubProfileUrl ?? `https://github.com/${user.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono font-bold px-3 py-1.5 rounded-sm transition text-amber-500 border border-amber-500/40 hover:bg-amber-500/10 text-center flex-shrink-0"
                >
                  View Profile &rarr;
                </a>
              </div>

              {/* Vercel */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 surface-raised border border-subtle rounded-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-sm surface-card border border-subtle flex items-center justify-center font-mono font-bold text-xs text-primary flex-shrink-0">
                    ▲
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold font-mono text-primary">Vercel</p>
                    <p className="text-[10px] text-muted font-sans">Deploy repositories from DevMitra</p>
                  </div>
                </div>
                <a
                  href="https://vercel.com/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono font-bold px-3 py-1.5 rounded-sm transition text-secondary border border-subtle hover:text-primary text-center flex-shrink-0"
                >
                  Open Vercel &rarr;
                </a>
              </div>
            </div>
          )}

          {/* Billing tab */}
          {tab === "billing" && (
            <div className="space-y-4 w-full min-w-0 max-w-full overflow-hidden">
              <div className="surface-card rounded-sm border border-subtle p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                      Paid Contributor Status
                    </h2>
                    <p className="text-xs text-muted mt-0.5 font-sans">
                      Set hourly and per-task rates visible on your verified profile.
                    </p>
                  </div>
                  <Toggle checked={isPaidContributor} onChange={setIsPaidContributor} />
                </div>

                {isPaidContributor && (
                  <div className="space-y-3 pt-3 border-t border-subtle">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-mono text-muted mb-1">Per Bug Fix ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label="Price per bug fix (USD)"
                          value={pricePerBug}
                          onChange={e => setPricePerBug(e.target.value)}
                          placeholder="50"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted mb-1">Per Feature ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label="Price per feature (USD)"
                          value={pricePerFeature}
                          onChange={e => setPricePerFeature(e.target.value)}
                          placeholder="200"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-muted mb-1">Hourly Rate ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          aria-label="Hourly rate (USD)"
                          value={hourlyRate}
                          onChange={e => setHourlyRate(e.target.value)}
                          placeholder="30"
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-subtle gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold font-mono text-primary">Open for Paid Collaborations</p>
                        <p className="text-[10px] text-muted font-sans">Displays a &quot;Hire Me&quot; badge on your profile</p>
                      </div>
                      <Toggle checked={openForPaid} onChange={setOpenForPaid} />
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => billingMut.mutate()}
                disabled={billingMut.isPending}
                className={`w-full py-2.5 rounded-sm text-xs font-mono font-bold transition flex items-center justify-center gap-2 ${
                  billingSaved
                    ? "bg-emerald-500 text-gray-950"
                    : "bg-amber-500 hover:bg-amber-400 text-gray-950"
                } disabled:opacity-50`}
              >
                {billingSaved ? "Billing Saved" : billingMut.isPending ? "Saving..." : "Save Billing Settings"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {confirmLogout && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="surface-card rounded-sm p-6 border border-subtle max-w-sm w-full font-sans">
            <h3 className="text-base font-bold font-mono text-primary mb-2">Sign Out?</h3>
            <p className="text-xs text-muted mb-5 leading-relaxed">
              Are you sure you want to end your workstation session on DevMitra?
            </p>
            <div className="flex gap-3 font-mono text-xs">
              <button
                onClick={logout}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-sm font-bold transition"
              >
                Sign Out
              </button>
              <button
                onClick={() => setConfirmLogout(false)}
                className="flex-1 surface-raised text-secondary hover:text-primary border border-subtle py-2 rounded-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
