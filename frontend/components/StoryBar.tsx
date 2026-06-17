"use client";

import { StoryGroup } from "@/types";
import { Plus, Globe, Users, Lock, X } from "lucide-react";
import { useState } from "react";
import { storiesAPI } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

const STORY_LABELS = ["Release", "Bug Fix", "Milestone", "Update", "Looking for Help"];
const VIS_OPTIONS = [
  { value: "PUBLIC",           label: "Public",     icon: Globe,  desc: "Everyone" },
  { value: "CONNECTIONS_ONLY", label: "Connections",icon: Users,  desc: "Connections only" },
  { value: "PRIVATE",          label: "Only Me",    icon: Lock,   desc: "Private" },
];

interface StoryBarProps { stories: StoryGroup[] }

export default function StoryBar({ stories }: StoryBarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewStory, setViewStory]       = useState<StoryGroup | null>(null);
  const [storyIdx, setStoryIdx]         = useState(0);
  const [mediaUrl, setMediaUrl]         = useState("");
  const [caption, setCaption]           = useState("");
  const [label, setLabel]               = useState(STORY_LABELS[0]);
  const [visibility, setVisibility]     = useState("PUBLIC");

  const addMutation = useMutation({
    mutationFn: () => storiesAPI.create({ mediaUrl, caption, label, visibility }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeStories"] });
      setShowAddModal(false);
      setMediaUrl(""); setCaption(""); setLabel(STORY_LABELS[0]); setVisibility("PUBLIC");
    },
  });

  const openStory = (group: StoryGroup) => { setViewStory(group); setStoryIdx(0); };
  const nextStory = () => {
    if (!viewStory) return;
    if (storyIdx < viewStory.stories.length - 1) setStoryIdx(i => i + 1);
    else setViewStory(null);
  };

  return (
    <>
      {/* Story strip */}
      <div className="flex items-center gap-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {/* Add story */}
        <button onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center bg-gray-800/50 hover:border-indigo-500 transition">
            <Plus className="h-5 w-5 text-gray-400" />
          </div>
          <span className="text-[10px] text-gray-500">Add Story</span>
        </button>

        {/* User stories */}
        {stories.map((group) => (
          <button key={group.user.id} onClick={() => openStory(group)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500">
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-gray-900">
                {group.user.avatarUrl ? (
                  <img src={group.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-700 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{group.user.username.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[10px] text-gray-400 max-w-[56px] truncate">{group.user.username}</span>
            {group.stories[0]?.label && (
              <span className="text-[9px] text-indigo-400 bg-indigo-900/40 px-1.5 rounded-full -mt-0.5">{group.stories[0].label}</span>
            )}
          </button>
        ))}
      </div>

      {/* Add Story Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-base font-semibold text-white">Add Developer Story</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Image / Video URL *</label>
                <input type="url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
              </div>
              {mediaUrl && (
                <div className="w-full h-32 rounded-xl overflow-hidden bg-gray-800">
                  <img src={mediaUrl} alt="preview" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
              )}
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Caption</label>
                <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
                  placeholder="What's happening?"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Label</label>
                <div className="flex flex-wrap gap-2">
                  {STORY_LABELS.map(l => (
                    <button key={l} type="button" onClick={() => setLabel(l)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${label === l ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Visibility</label>
                <div className="grid grid-cols-3 gap-2">
                  {VIS_OPTIONS.map(({ value, label: vLabel, icon: Icon, desc }) => (
                    <button key={value} type="button" onClick={() => setVisibility(value)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition ${visibility === value ? "border-indigo-600 bg-indigo-900/30" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
                      <Icon className={`h-4 w-4 ${visibility === value ? "text-indigo-400" : "text-gray-500"}`} />
                      <span className={`text-[10px] font-semibold ${visibility === value ? "text-white" : "text-gray-400"}`}>{vLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => addMutation.mutate()} disabled={!mediaUrl || addMutation.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
                  {addMutation.isPending ? "Posting…" : "Post Story"}
                </button>
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Story Modal */}
      {viewStory && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={nextStory}>
          <div className="relative w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            {/* Progress */}
            <div className="flex gap-1 mb-3">
              {viewStory.stories.map((_, i) => (
                <div key={i} className={`h-0.5 flex-1 rounded-full transition-all ${i <= storyIdx ? "bg-white" : "bg-white/25"}`} />
              ))}
            </div>
            {/* Media */}
            <div className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-gray-900">
              <img src={viewStory.stories[storyIdx].mediaUrl} alt=""
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x700/1a1a2e/6366f1?text=Story"; }} />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  {viewStory.user.avatarUrl ? (
                    <img src={viewStory.user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{viewStory.user.username.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-white">{viewStory.user.username}</span>
                  {viewStory.stories[storyIdx].label && (
                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full">{viewStory.stories[storyIdx].label}</span>
                  )}
                </div>
                {viewStory.stories[storyIdx].caption && (
                  <p className="text-sm text-white">{viewStory.stories[storyIdx].caption}</p>
                )}
              </div>
              {/* Close */}
              <button onClick={() => setViewStory(null)} className="absolute top-3 right-3 text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Navigation */}
            <div className="flex justify-between mt-3">
              <button onClick={() => storyIdx > 0 && setStoryIdx(i => i - 1)}
                className="text-sm text-gray-400 hover:text-white disabled:opacity-30 transition"
                disabled={storyIdx === 0}>← Prev</button>
              <button onClick={nextStory} className="text-sm text-gray-400 hover:text-white transition">
                {storyIdx < viewStory.stories.length - 1 ? "Next →" : "Close ✕"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
