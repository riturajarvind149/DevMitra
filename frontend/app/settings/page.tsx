"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { usersAPI } from "@/lib/api";
import { Save, LogOut, Globe, Lock, Users, Plus, X, ExternalLink, Link2 } from "lucide-react";

const inputCls = "w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none placeholder-gray-600";
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        {label}{hint && <span className="text-gray-600 text-xs ml-1.5">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const [saved, setSaved]         = useState(false);
  const [hydrated, setHydrated]   = useState(false);

  const [username, setUsername]         = useState("");
  const [bio, setBio]                   = useState("");
  const [location, setLocation]         = useState("");
  const [website, setWebsite]           = useState("");
  const [linkedin, setLinkedin]         = useState("");
  const [twitter, setTwitter]           = useState("");
  const [portfolio, setPortfolio]       = useState("");
  const [availability, setAvailability] = useState("");
  const [skills, setSkills]             = useState<string[]>([]);
  const [skillInput, setSkillInput]     = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");

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

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills(p => [...p, s]);
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
    onSuccess: async () => {
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
    onError: (e: any) => alert(e.response?.data?.message || "Failed to save"),
  });

  if (!user) return null;

  const VIS_OPTIONS = [
    { value: "PUBLIC",           label: "Public",           desc: "Anyone can view your profile",              icon: Globe,  color: "green" },
    { value: "CONNECTIONS_ONLY", label: "Connections Only", desc: "Only connections can view your profile",   icon: Users,  color: "blue" },
    { value: "PRIVATE",          label: "Private",          desc: "Only you can view your profile",           icon: Lock,   color: "red" },
  ];

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-gray-500 mb-6">Manage your profile and account preferences</p>

        {/* Avatar preview */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 mb-4 flex items-center gap-4">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-14 h-14 rounded-2xl" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{user.username.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="text-sm text-white font-medium">{user.username}</p>
            <p className="text-xs text-gray-500 mt-0.5">Profile picture synced from GitHub</p>
            {user.githubProfileUrl && (
              <a href={user.githubProfileUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1">
                <ExternalLink className="h-3 w-3" />Edit on GitHub
              </a>
            )}
          </div>
        </div>

        {/* Profile form */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4 space-y-4">
          <h2 className="text-sm font-semibold text-white mb-2">Profile Information</h2>
          <Field label="Display Name">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Bio">
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              placeholder="Tell developers about yourself…" className={`${inputCls} resize-none`} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Location">
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" className={inputCls} />
            </Field>
            <Field label="Website">
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yoursite.com" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="LinkedIn URL">
              <input type="url" value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" className={inputCls} />
            </Field>
            <Field label="Twitter/X URL">
              <input type="url" value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="https://twitter.com/…" className={inputCls} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Portfolio URL">
              <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} placeholder="https://yourportfolio.com" className={inputCls} />
            </Field>
            <Field label="Availability (hrs/week)">
              <input type="number" min="0" max="80" value={availability} onChange={e => setAvailability(e.target.value)} placeholder="e.g. 20" className={inputCls} />
            </Field>
          </div>

          {/* Skills */}
          <Field label="Skills">
            <div className="flex gap-2 mb-2">
              <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkill(); }}}
                placeholder="e.g. React, Python, Docker" className={`${inputCls} flex-1`} />
              <button type="button" onClick={addSkill} disabled={!skillInput.trim()}
                className="bg-indigo-600 text-white px-3 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="flex items-center gap-1 text-xs text-indigo-300 bg-indigo-900/40 border border-indigo-800/40 px-2.5 py-1 rounded-full">
                    {s}
                    <button onClick={() => setSkills(p => p.filter(x => x !== s))} className="hover:text-red-400 transition"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </Field>
        </div>

        {/* Profile Visibility */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <h2 className="text-sm font-semibold text-white mb-3">Profile Visibility</h2>
          <div className="grid grid-cols-3 gap-2">
            {VIS_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => (
              <button key={value} type="button" onClick={() => setVisibility(value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
                  visibility === value
                    ? color === "green" ? "border-green-600 bg-green-900/30"
                    : color === "blue"  ? "border-blue-600 bg-blue-900/30"
                    : "border-red-600 bg-red-900/30"
                    : "border-gray-700 bg-gray-800 hover:border-gray-600"
                }`}>
                <Icon className={`h-5 w-5 ${visibility === value
                  ? color === "green" ? "text-green-400" : color === "blue" ? "text-blue-400" : "text-red-400"
                  : "text-gray-500"}`} />
                <span className={`text-xs font-semibold ${visibility === value ? "text-white" : "text-gray-400"}`}>{label}</span>
                <span className="text-[10px] text-gray-600 leading-tight">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-4">
          <h2 className="text-sm font-semibold text-white mb-3">Account</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-800">
              <div>
                <p className="text-sm font-medium text-white">Email</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded-full">From GitHub</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-white">GitHub Account</p>
                <p className="text-xs text-gray-500">@{user.githubUsername || "not connected"}</p>
              </div>
              {user.githubProfileUrl && (
                <a href={user.githubProfileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />View
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Save + Danger */}
        <button onClick={() => updateMut.mutate()} disabled={updateMut.isPending || !username.trim()}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mb-4 transition ${
            saved ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
          } disabled:opacity-50`}>
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : updateMut.isPending ? "Saving…" : "Save Changes"}
        </button>

        <div className="bg-red-950/30 rounded-2xl border border-red-900/40 p-5">
          <h2 className="text-sm font-semibold text-red-400 mb-3">Danger Zone</h2>
          <button onClick={logout}
            className="flex items-center gap-2 text-sm text-red-400 border border-red-800 px-4 py-2.5 rounded-xl hover:bg-red-900/30 transition">
            <LogOut className="h-4 w-4" />Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
