"use client";

import { StoryGroup } from "@/types";
import { Plus, Globe, Users, Lock, X, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { storiesAPI } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import FileUploader from "./FileUploader";

const STORY_LABELS = ["Release", "Bug Fix", "Milestone", "Update", "Looking for Help"];
const VIS_OPTIONS = [
  { value: "PUBLIC",           label: "Public",      icon: Globe,  desc: "Everyone" },
  { value: "CONNECTIONS_ONLY", label: "Connections", icon: Users,  desc: "Connections only" },
  { value: "PRIVATE",          label: "Only Me",     icon: Lock,   desc: "Private" },
];

// localStorage key for viewed story IDs — persists across page navigations and tab reloads
const VIEWED_KEY = "devmitra_viewed_stories";

interface StoryBarProps {
  stories: StoryGroup[];
  viewedIds?: string[];
}

export default function StoryBar({ stories, viewedIds = [] }: StoryBarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewStory, setViewStory]       = useState<StoryGroup | null>(null);
  const [storyIdx, setStoryIdx]         = useState(0);
  const [mediaUrl, setMediaUrl]         = useState("");
  const [caption, setCaption]           = useState("");
  const [label, setLabel]               = useState(STORY_LABELS[0]);
  const [visibility, setVisibility]     = useState("PUBLIC");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // story id to delete

  // Persist viewed state in localStorage so it survives page navigations and tab reloads.
  // Key is per-user so different accounts don't share viewed state.
  const userKey = user ? `${VIEWED_KEY}_${user.id}` : VIEWED_KEY;

  const [localViewed, setLocalViewed] = useState<Set<string>>(() => {
    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem(userKey) : null;
      const initial = stored ? JSON.parse(stored) : viewedIds;
      return new Set(initial);
    } catch { return new Set(viewedIds); }
  });

  // Persist to localStorage whenever localViewed changes
  useEffect(() => {
    try { localStorage.setItem(userKey, JSON.stringify([...localViewed])); } catch {}
  }, [localViewed, userKey]);

  const addMutation = useMutation({
    mutationFn: () => storiesAPI.create({ mediaUrl, caption, label, visibility }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeStories"] });
      setShowAddModal(false);
      setMediaUrl(""); setCaption(""); setLabel(STORY_LABELS[0]); setVisibility("PUBLIC");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => storiesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeStories"] });
      setConfirmDelete(null);
      setViewStory(null);
    },
  });

  const openStory = (group: StoryGroup) => {
    setViewStory(group);
    setStoryIdx(0);
    setLocalViewed(prev => new Set([...prev, group.user.id]));
  };

  const nextStory = () => {
    if (!viewStory) return;
    if (storyIdx < viewStory.stories.length - 1) setStoryIdx(i => i + 1);
    else setViewStory(null);
  };

  const myStoryGroup = stories.find(g => g.user.id === user?.id);
  const currentStory = viewStory?.stories[storyIdx];
  const isMyStory = viewStory?.user.id === user?.id;

  return (
    <>
      {/* Story strip */}
      <div className="flex items-start gap-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">

        {/* ── "Add Story" / "Your Story" bubble ─────────────────────────── */}
        <button
          onClick={() => myStoryGroup ? openStory(myStoryGroup) : setShowAddModal(true)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
        >
          <div className="relative w-16 h-16">
            <div className={`w-16 h-16 rounded-full ${
              myStoryGroup
                ? "p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500"
                : "border-2 border-dashed border-gray-600 group-hover:border-indigo-500 transition"
            }`}>
              <div className={`w-full h-full rounded-full overflow-hidden ${myStoryGroup ? "border-2 border-gray-900" : ""} bg-gray-800`}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{user?.username?.charAt(0).toUpperCase()}</span>
                    </div>}
              </div>
            </div>
            {/* Plus badge — only when no story yet */}
            {!myStoryGroup && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-indigo-600 rounded-full border-2 border-gray-950 flex items-center justify-center">
                <Plus className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition">
            {myStoryGroup ? "Your story" : "Add Story"}
          </span>
        </button>

        {/* ── Other users' stories ──────────────────────────────────────── */}
        {stories
          .filter(g => g.user.id !== user?.id)
          .map((group) => {
            const viewed = localViewed.has(group.user.id);
            return (
              <button key={group.user.id} onClick={() => openStory(group)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className="relative w-16 h-16">
                  <div className={`w-16 h-16 rounded-full p-0.5 ${viewed ? "bg-gray-600" : "bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500"}`}>
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-900 bg-gray-800">
                      {group.user.avatarUrl
                        ? <img src={group.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full bg-indigo-700 flex items-center justify-center">
                            <span className="text-sm font-bold text-white">{group.user.username.charAt(0).toUpperCase()}</span>
                          </div>}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 max-w-[56px] truncate">{group.user.username}</span>
                {group.stories[0]?.label && (
                  <span className="text-[9px] text-indigo-400 bg-indigo-900/40 px-1.5 rounded-full -mt-0.5">{group.stories[0].label}</span>
                )}
              </button>
            );
          })}
      </div>

      {/* ── Add Story Modal ────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-base font-semibold text-white">Add Developer Story</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <FileUploader value={mediaUrl} onChange={setMediaUrl} accept="image/*,video/*" label="Photo / Video *" placeholder="https://example.com/image.png" previewHeight={160} />
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Caption</label>
                <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="What's happening?" className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Label</label>
                <div className="flex flex-wrap gap-2">
                  {STORY_LABELS.map(l => (
                    <button key={l} type="button" onClick={() => setLabel(l)} className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${label === l ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Visibility</label>
                <div className="grid grid-cols-3 gap-2">
                  {VIS_OPTIONS.map(({ value, label: vLabel, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setVisibility(value)} className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition ${visibility === value ? "border-indigo-600 bg-indigo-900/30" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
                      <Icon className={`h-4 w-4 ${visibility === value ? "text-indigo-400" : "text-gray-500"}`} />
                      <span className={`text-[10px] font-semibold ${visibility === value ? "text-white" : "text-gray-400"}`}>{vLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => addMutation.mutate()} disabled={!mediaUrl || addMutation.isPending} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">{addMutation.isPending ? "Posting…" : "Post Story"}</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Story Modal — full-screen TikTok/Instagram style ─────── */}
      {viewStory && currentStory && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          {/* Full-screen media container */}
          <div className="relative w-full h-full max-w-sm mx-auto flex flex-col">
            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3 pt-4">
              {viewStory.stories.map((_, i) => (
                <div key={i} className={`h-0.5 flex-1 rounded-full ${i < storyIdx ? "bg-white" : i === storyIdx ? "bg-white" : "bg-white/30"}`} />
              ))}
            </div>

            {/* Close + Delete buttons */}
            <div className="absolute top-8 right-3 z-10 flex items-center gap-2">
              {isMyStory && (
                <button onClick={() => setConfirmDelete(currentStory.id)} className="text-white/80 hover:text-red-400 transition p-1.5 bg-black/40 rounded-full">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button onClick={() => setViewStory(null)} className="text-white/80 hover:text-white transition p-1.5 bg-black/40 rounded-full">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Media — fill the full screen, object-contain to show full image */}
            <div className="w-full h-full flex items-center justify-center bg-black" onClick={nextStory}>
              {currentStory.mediaUrl.startsWith("data:video") || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(currentStory.mediaUrl)
                ? <video src={currentStory.mediaUrl} className="w-full h-full object-contain" autoPlay muted loop playsInline onClick={e => e.stopPropagation()} />
                : <img src={currentStory.mediaUrl} alt="" className="w-full h-full object-contain" onClick={e => e.stopPropagation()} />
              }
            </div>

            {/* Bottom overlay — user info + caption */}
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5 pb-8">
              <div className="flex items-center gap-2 mb-2">
                {viewStory.user.avatarUrl
                  ? <img src={viewStory.user.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-white/30" />
                  : <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center"><span className="text-xs font-bold text-white">{viewStory.user.username.charAt(0).toUpperCase()}</span></div>}
                <span className="text-sm font-semibold text-white">{viewStory.user.username}</span>
                {currentStory.label && <span className="text-xs bg-indigo-600/90 text-white px-2 py-0.5 rounded-full">{currentStory.label}</span>}
                {isMyStory && (
                  <button onClick={e => { e.stopPropagation(); setShowAddModal(true); setViewStory(null); }}
                    className="ml-auto text-xs text-white/70 hover:text-white border border-white/30 px-2 py-0.5 rounded-full">
                    + Add
                  </button>
                )}
              </div>
              {currentStory.caption && <p className="text-sm text-white/90 leading-snug">{currentStory.caption}</p>}
              <p className="text-xs text-white/40 mt-1">{storyIdx + 1} / {viewStory.stories.length}</p>
            </div>

            {/* Tap left half = prev, right half = next */}
            <div className="absolute inset-0 flex z-0">
              <div className="w-1/3 h-full cursor-pointer" onClick={e => { e.stopPropagation(); storyIdx > 0 && setStoryIdx(i => i - 1); }} />
              <div className="w-2/3 h-full cursor-pointer" onClick={nextStory} />
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Story Confirm ─────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-red-900/50 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-400" /></div>
              <h3 className="text-base font-semibold text-white">Delete Story?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">This story will be permanently deleted and removed from everyone's feed.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteMutation.mutate(confirmDelete)} disabled={deleteMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition">
                {deleteMutation.isPending ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
