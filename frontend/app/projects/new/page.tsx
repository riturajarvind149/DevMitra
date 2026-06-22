"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { projectsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, FolderGit2, Globe, EyeOff, Lock, Plus, X } from "lucide-react";
import Link from "next/link";
import FileUploader from "@/components/FileUploader";

const CATEGORIES = ["SaaS", "AI/ML", "Health", "Marketing", "E-commerce", "DevTools", "Mobile", "Other"];

const VISIBILITY_OPTIONS = [
  { value: "PUBLIC",   label: "Public",   desc: "Visible to everyone",              icon: Globe,  color: "green" },
  { value: "UNLISTED", label: "Unlisted", desc: "Only via direct link",             icon: EyeOff, color: "yellow" },
  { value: "PRIVATE",  label: "Private",  desc: "Members & owner only",             icon: Lock,   color: "red" },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deployedUrl, setDeployedUrl] = useState("");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [isRepoPrivate, setIsRepoPrivate] = useState(false);
  const [openRoles, setOpenRoles] = useState<string[]>([]);
  const [roleInput, setRoleInput] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [budget, setBudget] = useState("");

  const addRole = () => {
    const r = roleInput.trim();
    if (r && !openRoles.includes(r)) setOpenRoles(prev => [...prev, r]);
    setRoleInput("");
  };
  const removeRole = (r: string) => setOpenRoles(prev => prev.filter(x => x !== r));

  const createMutation = useMutation({
    mutationFn: (data: any) => projectsAPI.create(data),
    onSuccess: (res) => router.push(`/projects/${res.data.id}`),
    onError: (e: any) => alert(e.response?.data?.message || "Failed to create project"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    createMutation.mutate({
      title, description, deployedUrl,
      githubRepoUrl: githubRepoUrl || undefined,
      tags, coverImage: coverImage || undefined, category: category || undefined,
      visibility, isRepoPrivate, openRoles, isPaid, budget: budget || undefined,
    });
  };

  if (!isAuthenticated) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <p className="text-gray-400">Please login to create a project</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-5 transition">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">Create New Project</h1>
        <p className="text-sm text-gray-500 mb-6">Share your project with the developer community</p>

        {/* Cover preview — now handled inside FileUploader */}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-5">

            {/* Cover Image / Video upload */}
            <FileUploader
              value={coverImage}
              onChange={setCoverImage}
              accept="image/*,video/*"
              label="Cover Image / Video"
              placeholder="https://example.com/cover.png"
              previewHeight={160}
            />

            {/* Title */}
            <Field label="Project Title *">
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="My Awesome Project" className={inputCls} />
            </Field>

            {/* Description */}
            <Field label="Description *">
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4}
                placeholder="Describe what your project does, the problem it solves, and what you're looking for in collaborators..."
                className={`${inputCls} resize-none`} />
            </Field>

            {/* Category */}
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button type="button" key={cat} onClick={() => setCategory(cat === category ? "" : cat)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${category === cat ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </Field>

            {/* Tech Stack */}
            <Field label="Tech Stack" hint="Comma-separated">
              <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                placeholder="React, Node.js, PostgreSQL" className={inputCls} />
            </Field>

            {/* Open Roles */}
            <Field label="Open Roles" hint="Roles you're looking for">
              <div className="flex gap-2 mb-2">
                <input type="text" value={roleInput} onChange={e => setRoleInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRole(); }}}
                  placeholder="e.g. Frontend Dev, UI Designer" className={`${inputCls} flex-1`} />
                <button type="button" onClick={addRole} disabled={!roleInput.trim()}
                  className="bg-indigo-600 text-white px-3 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {openRoles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {openRoles.map(r => (
                    <span key={r} className="flex items-center gap-1 text-xs text-yellow-300 bg-yellow-900/30 border border-yellow-800/40 px-2.5 py-1 rounded-full">
                      {r}
                      <button type="button" onClick={() => removeRole(r)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            {/* Live URL */}
            <Field label="Live URL *">
              <input type="url" required value={deployedUrl} onChange={e => setDeployedUrl(e.target.value)}
                placeholder="https://myproject.com" className={inputCls} />
            </Field>

            {/* GitHub URL */}
            <Field label="GitHub Repo URL" hint="Optional">
              <input type="url" value={githubRepoUrl} onChange={e => setGithubRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo" className={inputCls} />
              {githubRepoUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="repoPrivate" checked={isRepoPrivate} onChange={e => setIsRepoPrivate(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600" />
                  <label htmlFor="repoPrivate" className="text-sm text-gray-400 cursor-pointer">
                    Private repository <span className="text-gray-600">(only members can see the link)</span>
                  </label>
                </div>
              )}
            </Field>

            {/* Paid Contributions */}
            <Field label="Paid Contributions">
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700">
                <div>
                  <p className="text-sm font-medium text-white">This project pays contributors</p>
                  <p className="text-xs text-gray-500 mt-0.5">Enable if you plan to pay contributors for their work</p>
                </div>
                <button type="button" onClick={() => setIsPaid(v => !v)}
                  className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${isPaid ? "bg-green-600" : "bg-gray-600"}`}>
                  <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPaid ? "translate-x-4" : ""}`} />
                </button>
              </div>
              {isPaid && (
                <input type="text" value={budget} onChange={e => setBudget(e.target.value)} className={`${inputCls} mt-2`}
                  placeholder="e.g. $500 total budget, $50/bug fix, $200/feature" />
              )}
            </Field>

            {/* Visibility */}
            <Field label="Project Visibility">
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITY_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => (
                  <button key={value} type="button" onClick={() => setVisibility(value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
                      visibility === value
                        ? `border-${color}-600 bg-${color}-900/30`
                        : "border-gray-700 bg-gray-800 hover:border-gray-600"
                    }`}>
                    <Icon className={`h-5 w-5 ${visibility === value ? `text-${color}-400` : "text-gray-500"}`} />
                    <span className={`text-xs font-semibold ${visibility === value ? "text-white" : "text-gray-400"}`}>{label}</span>
                    <span className="text-[10px] text-gray-600 leading-tight">{desc}</span>
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={createMutation.isPending}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
              {createMutation.isPending ? "Creating…" : "Post Project"}
            </button>
            <Link href="/" className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helpers
const inputCls = "w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-lg focus:border-indigo-500 focus:outline-none placeholder-gray-600";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">
        {label}{hint && <span className="ml-1.5 text-gray-600 text-xs">({hint})</span>}
      </label>
      {children}
    </div>
  );
}
