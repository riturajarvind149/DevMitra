"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { projectsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, FolderGit2, Globe, EyeOff, Lock, Plus, X } from "lucide-react";
import Link from "next/link";
import FileUploader from "@/components/FileUploader";

const CATEGORIES = ["SaaS", "AI/ML", "Health", "Marketing", "E-commerce", "DevTools", "Mobile", "Other"];
const VISIBILITY_OPTIONS = [
  { value: "PUBLIC",   label: "Public",   desc: "Visible to everyone",    icon: Globe,  color: "green" },
  { value: "UNLISTED", label: "Unlisted", desc: "Only via direct link",   icon: EyeOff, color: "yellow" },
  { value: "PRIVATE",  label: "Private",  desc: "Members & owner only",   icon: Lock,   color: "red" },
];

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

export default function EditProjectPage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => { const { data } = await projectsAPI.getById(projectId); return data; },
    enabled: !!projectId,
  });

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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (project && !hydrated) {
      setTitle(project.title);
      setDescription(project.description);
      setDeployedUrl(project.deployedUrl);
      setGithubRepoUrl(project.githubRepoUrl || "");
      setTagsInput(project.tags.join(", "));
      setCoverImage(project.coverImage || "");
      setCategory(project.category || "");
      setVisibility(project.visibility ?? "PUBLIC");
      setIsRepoPrivate(project.isRepoPrivate ?? false);
      setOpenRoles(project.openRoles ?? []);
      setHydrated(true);
    }
  }, [project, hydrated]);

  const addRole = () => {
    const r = roleInput.trim();
    if (r && !openRoles.includes(r)) setOpenRoles(prev => [...prev, r]);
    setRoleInput("");
  };
  const removeRole = (r: string) => setOpenRoles(prev => prev.filter(x => x !== r));

  const updateMutation = useMutation({
    mutationFn: () => projectsAPI.update(projectId, {
      title, description, deployedUrl,
      githubRepoUrl: githubRepoUrl || undefined,
      tags: tagsInput.split(",").map(t => t.trim()).filter(Boolean),
      coverImage: coverImage || undefined, category: category || undefined,
      visibility: visibility as "PUBLIC" | "UNLISTED" | "PRIVATE", isRepoPrivate, openRoles,
    }),
    onSuccess: () => router.push(`/projects/${projectId}`),
    onError: (e: any) => alert(e.response?.data?.message || "Failed to update"),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project || project.ownerId !== user?.id) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <p className="text-red-400">Not authorized to edit this project</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href={`/projects/${projectId}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-5 transition">
          <ArrowLeft className="h-4 w-4" /> Back to Project
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">Edit Project</h1>
        <p className="text-sm text-gray-500 mb-6">Update your project details</p>

        {/* Cover Preview — replaced by FileUploader */}

        <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-5">
          <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-5">
            <FileUploader
              value={coverImage}
              onChange={setCoverImage}
              accept="image/*,video/*"
              label="Cover Image / Video"
              placeholder="https://example.com/cover.png"
              previewHeight={160}
            />
            <Field label="Title *">
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Description *">
              <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={4} className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button type="button" key={cat} onClick={() => setCategory(cat === category ? "" : cat)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${category === cat ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Tech Stack" hint="Comma-separated">
              <input type="text" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="React, Node.js" className={inputCls} />
            </Field>
            <Field label="Open Roles" hint="Roles you're looking for">
              <div className="flex gap-2 mb-2">
                <input type="text" value={roleInput} onChange={e => setRoleInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addRole(); }}}
                  placeholder="e.g. Backend Dev" className={`${inputCls} flex-1`} />
                <button type="button" onClick={addRole} disabled={!roleInput.trim()}
                  className="bg-indigo-600 text-white px-3 rounded-lg hover:bg-indigo-700 disabled:opacity-40 transition">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {openRoles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {openRoles.map(r => (
                    <span key={r} className="flex items-center gap-1 text-xs text-yellow-300 bg-yellow-900/30 border border-yellow-800/40 px-2.5 py-1 rounded-full">
                      {r} <button type="button" onClick={() => removeRole(r)}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Live URL *">
              <input type="url" required value={deployedUrl} onChange={e => setDeployedUrl(e.target.value)} className={inputCls} />
            </Field>
            <Field label="GitHub Repo URL" hint="Optional">
              <input type="url" value={githubRepoUrl} onChange={e => setGithubRepoUrl(e.target.value)} placeholder="https://github.com/username/repo" className={inputCls} />
              {githubRepoUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="repoPrivate" checked={isRepoPrivate} onChange={e => setIsRepoPrivate(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                  <label htmlFor="repoPrivate" className="text-sm text-gray-400 cursor-pointer">
                    Private repository <span className="text-gray-600">(only members can see the link)</span>
                  </label>
                </div>
              )}
            </Field>
            <Field label="Project Visibility">
              <div className="grid grid-cols-3 gap-2">
                {VISIBILITY_OPTIONS.map(({ value, label, desc, icon: Icon, color }) => (
                  <button key={value} type="button" onClick={() => setVisibility(value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition ${
                      visibility === value ? `border-${color}-600 bg-${color}-900/30` : "border-gray-700 bg-gray-800 hover:border-gray-600"
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
            <button type="submit" disabled={updateMutation.isPending}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </button>
            <Link href={`/projects/${projectId}`} className="flex-1 bg-gray-800 text-gray-300 py-3 rounded-xl text-sm font-semibold hover:bg-gray-700 transition text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
