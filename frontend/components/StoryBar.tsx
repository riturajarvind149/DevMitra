"use client";

import { StoryGroup } from "@/types";
import { Plus, Globe, Users, Lock, X, Trash2, Pause, Play, Send, Heart, Share2, AtSign } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { storiesAPI, messagesAPI, connectionsAPI } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import FileUploader from "./FileUploader";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const STORY_LABELS = ["Release", "Bug Fix", "Milestone", "Update", "Looking for Help"];
const VIS_OPTIONS = [
  { value: "PUBLIC",           label: "Public",      icon: Globe  },
  { value: "CONNECTIONS_ONLY", label: "Connections", icon: Users  },
  { value: "PRIVATE",          label: "Only Me",     icon: Lock   },
];
const IMAGE_DURATION   = 15000; // 15s for images
const MAX_VIDEO_DURATION = 45;  // 45s cap for videos

// ── Per-user localStorage helpers ─────────────────────────────────────────────
// Stores { [ownerId]: viewedAtTimestamp }
// A group is "viewed" only if ALL its stories were created BEFORE viewedAt
// → posting a new story resets the ring to colourful

const VIEWED_KEY_PREFIX = "dvm_v2_viewed_";

function viewedKey(userId: string) { return `${VIEWED_KEY_PREFIX}${userId}`; }

function loadViewedMap(userId?: string): Map<string, number> {
  if (!userId || typeof window === "undefined") return new Map();
  try {
    // Clear old v1 keys
    const oldKey = `dvm_viewed_${userId}`;
    if (localStorage.getItem(oldKey)) localStorage.removeItem(oldKey);
    const s = localStorage.getItem(viewedKey(userId));
    if (!s) return new Map();
    return new Map(Object.entries(JSON.parse(s) as Record<string, number>));
  } catch { return new Map(); }
}

function saveViewedMap(userId: string, map: Map<string, number>) {
  try {
    const obj: Record<string, number> = {};
    map.forEach((ts, id) => { obj[id] = ts; });
    localStorage.setItem(viewedKey(userId), JSON.stringify(obj));
  } catch {}
}

function isGroupViewed(group: StoryGroup, viewedMap: Map<string, number>): boolean {
  const viewedAt = viewedMap.get(group.user.id);
  if (!viewedAt) return false;
  // Any story posted AFTER viewedAt means the group has new content
  return !group.stories.some(s => new Date(s.createdAt).getTime() > viewedAt);
}

// ── MIME-safe video detection ─────────────────────────────────────────────────
function isVideoUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith("data:")) {
    const mime = url.split(";")[0].split(":")[1] ?? "";
    return mime.startsWith("video/");
  }
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

interface StoryBarProps { stories: StoryGroup[] }

export default function StoryBar({ stories }: StoryBarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // ── Add modal ────────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [mediaUrl, setMediaUrl]         = useState("");
  const [caption, setCaption]           = useState("");
  const [label, setLabel]               = useState(STORY_LABELS[0]);
  const [visibility, setVisibility]     = useState("PUBLIC");
  const [mention, setMention]           = useState("");

  // ── Viewer ───────────────────────────────────────────────────────────────────
  const [viewStory, setViewStory]         = useState<StoryGroup | null>(null);
  const [storyIdx, setStoryIdx]           = useState(0);
  const [paused, setPaused]               = useState(false);
  const [progress, setProgress]           = useState(0);
  const [replyText, setReplyText]         = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showViewers, setShowViewers]     = useState(false);
  const [showStoryShare, setShowStoryShare] = useState(false);
  const [shareSheetTab, setShareSheetTab] = useState<"send" | "link">("send");
  const [storySentTo, setStorySentTo]     = useState<string | null>(null);
  const [shareCopied, setShareCopied]     = useState(false);

  // ── Viewed state ─────────────────────────────────────────────────────────────
  const [viewedMap, setViewedMap] = useState<Map<string, number>>(new Map());
  const loadedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (user?.id && user.id !== loadedForRef.current) {
      loadedForRef.current = user.id;
      setViewedMap(loadViewedMap(user.id));
    }
  }, [user?.id]);

  const markViewed = useCallback((ownerId: string) => {
    if (!user?.id) return;
    const now = Date.now();
    setViewedMap(prev => {
      const next = new Map(prev);
      next.set(ownerId, now);
      saveViewedMap(user.id!, next);
      return next;
    });
  }, [user?.id]);

  // ── RAF timer ────────────────────────────────────────────────────────────────
  const startTimeRef = useRef<number>(0);
  const elapsedRef   = useRef<number>(0);
  const durationRef  = useRef<number>(IMAGE_DURATION);
  const rafRef       = useRef<number>(0);
  const pausedRef    = useRef(false);
  const videoRef     = useRef<HTMLVideoElement>(null);
  const goNextRef    = useRef<() => void>(() => {});

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  const tick = useCallback((now: DOMHighResTimeStamp) => {
    if (pausedRef.current) return;
    const elapsed = elapsedRef.current + (now - startTimeRef.current);
    const pct = Math.min((elapsed / durationRef.current) * 100, 100);
    setProgress(pct);
    if (elapsed >= durationRef.current) { goNextRef.current(); return; }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const startRAF = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pauseRAF = useCallback(() => {
    elapsedRef.current += performance.now() - startTimeRef.current;
    cancelAnimationFrame(rafRef.current);
  }, []);

  const resumeRAF = useCallback(() => {
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // ── goNext / goPrev ───────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (!viewStory) return;
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setProgress(0);
    setShowViewers(false);
    setShowStoryShare(false);
    setShareSheetTab("send");
    if (storyIdx < viewStory.stories.length - 1) {
      setStoryIdx(i => i + 1);
    } else {
      const ci = stories.findIndex(g => g.user.id === viewStory.user.id);
      const next = stories[ci + 1];
      if (next) { setViewStory(next); setStoryIdx(0); markViewed(next.user.id); }
      else setViewStory(null);
    }
  }, [viewStory, storyIdx, stories, markViewed]);

  useEffect(() => { goNextRef.current = goNext; }, [goNext]);

  const goPrev = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setProgress(0);
    setShowViewers(false);
    setShowStoryShare(false);
    if (storyIdx > 0) setStoryIdx(i => i - 1);
  }, [storyIdx]);

  // ── Timer reset on story change ───────────────────────────────────────────────
  useEffect(() => {
    if (!viewStory) return;
    const story = viewStory.stories[storyIdx];
    if (!story) return;
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setProgress(0);
    if (!isVideoUrl(story.mediaUrl)) {
      durationRef.current = IMAGE_DURATION;
      if (!pausedRef.current) startRAF();
    }
    return () => { cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewStory?.user.id, storyIdx]);

  // ── Pause/resume ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewStory) return;
    const story = viewStory.stories[storyIdx];
    if (!story) return;
    const isVid = isVideoUrl(story.mediaUrl);
    if (paused) {
      pauseRAF();
      if (isVid && videoRef.current) videoRef.current.pause();
    } else {
      resumeRAF();
      if (isVid && videoRef.current) videoRef.current.play().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // ── Video play/pause sync ─────────────────────────────────────────────────────
  useEffect(() => {
    const story = viewStory?.stories[storyIdx];
    if (!videoRef.current || !story || !isVideoUrl(story.mediaUrl)) return;
    if (paused) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  // ── Open story ────────────────────────────────────────────────────────────────
  const openStory = useCallback((group: StoryGroup) => {
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    setViewStory(group);
    setStoryIdx(0);
    setProgress(0);
    setPaused(false);
    setShowViewers(false);
    setShowStoryShare(false);
    setShareSheetTab("send");
    setReplyText("");
    markViewed(group.user.id);
    if (user?.id && group.user.id !== user.id) {
      group.stories.forEach(s => storiesAPI.recordView(s.id).catch(() => {}));
    }
  }, [markViewed, user?.id]);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const myStoryGroup = stories.find(g => g.user.id === user?.id);
  const currentStory = viewStory?.stories[storyIdx];
  const isMyStory    = viewStory?.user.id === user?.id;
  const isVideo      = currentStory ? isVideoUrl(currentStory.mediaUrl) : false;
  const isUploadVideo = isVideoUrl(mediaUrl);

  // ── Like status (server-side) ─────────────────────────────────────────────────
  const { data: likeStatus, refetch: refetchLike } = useQuery({
    queryKey: ["storyLike", currentStory?.id],
    queryFn: async () => { const { data } = await storiesAPI.getLikeStatus(currentStory!.id); return data; },
    enabled: !isMyStory && !!currentStory?.id && !!user,
    staleTime: 10000,
  });
  const storyLiked = likeStatus?.liked ?? false;

  // ── Viewers (server-side, auto-fetch when own story open) ─────────────────────
  const { data: viewers = [] } = useQuery<any[]>({
    queryKey: ["storyViewers", currentStory?.id],
    queryFn: async () => { const { data } = await storiesAPI.getViewers(currentStory!.id); return data; },
    enabled: isMyStory === true && !!currentStory?.id,
    refetchInterval: isMyStory === true && !!viewStory ? 15000 : false,
    staleTime: 5000,
  });

  // ── Connections for story share ───────────────────────────────────────────────
  const { data: myConnections } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => { const { data } = await connectionsAPI.getAll(); return data; },
    enabled: showStoryShare && !!user,
    staleTime: 60000,
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const addMut = useMutation({
    mutationFn: () => {
      const finalCaption = mention.trim()
        ? `${caption.trim()} @${mention.trim().replace(/^@/, "")}`
        : caption.trim();
      return storiesAPI.create({ mediaUrl, caption: finalCaption || undefined, label, visibility });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeStories"] });
      setShowAddModal(false);
      setMediaUrl(""); setCaption(""); setLabel(STORY_LABELS[0]); setVisibility("PUBLIC"); setMention("");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => storiesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeStories"] });
      setConfirmDelete(null);
      setViewStory(null);
    },
  });

  const likeMut = useMutation({
    mutationFn: () => storiesAPI.toggleLike(currentStory!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["storyLike", currentStory?.id] });
      refetchLike();
    },
  });

  // Story reply — includes story thumbnail as context
  const sendReplyMut = useMutation({
    mutationFn: () => {
      if (!viewStory || !replyText.trim() || !currentStory) throw new Error("Empty");
      const content = `📖 Replied to @${viewStory.user.username}'s story\n[story:${currentStory.mediaUrl}]\n${replyText.trim()}`;
      return messagesAPI.send({ receiverId: viewStory.user.id, content });
    },
    onSuccess: () => setReplyText(""),
  });

  // Share story to a connection
  const shareStoryMut = useMutation({
    mutationFn: (receiverId: string) => {
      if (!currentStory || !viewStory) throw new Error("No story");
      const content = `📤 Shared a story by @${viewStory.user.username}\n[story:${currentStory.mediaUrl}]\n${currentStory.caption || ""}`.trim();
      return messagesAPI.send({ receiverId, content });
    },
    onSuccess: (_, receiverId) => {
      setStorySentTo(receiverId);
      setTimeout(() => setStorySentTo(null), 2000);
    },
  });

  const share = () => {
    if (!currentStory) return;
    const url = `${window.location.origin}/story/${currentStory.id}`;
    if (navigator.share) {
      navigator.share({ title: `${viewStory?.user.username}'s story`, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
      }).catch(() => {});
    } else {
      const inp = document.createElement("input");
      inp.value = url; document.body.appendChild(inp); inp.select();
      document.execCommand("copy"); document.body.removeChild(inp);
      setShareCopied(true); setTimeout(() => setShareCopied(false), 2000);
    }
  };

  return (
    <>
      {/* ── Story strip ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-4 overflow-x-auto pb-2 mb-6 scrollbar-hide">
        {/* Your story */}
        <button onClick={() => myStoryGroup ? openStory(myStoryGroup) : setShowAddModal(true)}
          className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
          <div className="relative w-16 h-16">
            <div className={`w-16 h-16 rounded-full ${
              !myStoryGroup
                ? "border-2 border-dashed border-gray-600 group-hover:border-indigo-500 transition"
                : isGroupViewed(myStoryGroup, viewedMap)
                  ? "p-0.5 bg-gray-600"
                  : "p-0.5 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500"
            }`}>
              <div className={`w-full h-full rounded-full overflow-hidden ${myStoryGroup ? "border-2 border-gray-900" : ""} bg-gray-800`}>
                {user?.avatarUrl
                  ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gradient-to-br from-indigo-700 to-purple-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-white">{user?.username?.charAt(0).toUpperCase()}</span>
                    </div>}
              </div>
            </div>
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

        {/* Others' stories */}
        {stories.filter(g => g.user.id !== user?.id).map(group => {
          const viewed = isGroupViewed(group, viewedMap);
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

      {/* ── Add Story Modal ────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[80] p-4">
          <div className="bg-gray-900 rounded-2xl w-full max-w-md border border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
              <h2 className="text-base font-semibold text-white">Add Developer Story</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <FileUploader value={mediaUrl} onChange={setMediaUrl} accept="image/*,video/*"
                label="Photo / Video *" placeholder="https://example.com/image.png" previewHeight={160} />
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Caption</label>
                <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="What's happening?"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5 flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5" />Mention someone (optional)
                </label>
                <input type="text" value={mention} onChange={e => setMention(e.target.value)} placeholder="@username"
                  className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-4 py-2.5 rounded-xl focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Label</label>
                <div className="flex flex-wrap gap-2">
                  {STORY_LABELS.map(l => (
                    <button key={l} type="button" onClick={() => setLabel(l)}
                      className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${label === l ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">Visibility</label>
                <div className="grid grid-cols-3 gap-2">
                  {VIS_OPTIONS.map(({ value, label: vLabel, icon: Icon }) => (
                    <button key={value} type="button" onClick={() => setVisibility(value)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition ${visibility === value ? "border-indigo-600 bg-indigo-900/30" : "border-gray-700 bg-gray-800 hover:border-gray-600"}`}>
                      <Icon className={`h-4 w-4 ${visibility === value ? "text-indigo-400" : "text-gray-500"}`} />
                      <span className={`text-[10px] font-semibold ${visibility === value ? "text-white" : "text-gray-400"}`}>{vLabel}</span>
                    </button>
                  ))}
                </div>
              </div>
              {mediaUrl && isUploadVideo && (
                <p className="text-[10px] text-blue-400 bg-blue-900/20 border border-blue-800/40 rounded-lg px-3 py-2">
                  📹 Video detected — capped at 45s during playback.
                </p>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={() => addMut.mutate()} disabled={!mediaUrl || addMut.isPending}
                  className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
                  {addMut.isPending ? "Posting…" : "Post Story"}
                </button>
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen Story Viewer ──────────────────────────────────────────── */}
      {viewStory && currentStory && (
        <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center select-none"
          onClick={() => setPaused(p => !p)}>
          <div className="relative w-full h-full max-w-sm mx-auto flex flex-col">

            {/* Progress bars */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
              {viewStory.stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-none"
                    style={{ width: i < storyIdx ? "100%" : i === storyIdx ? `${progress}%` : "0%" }} />
                </div>
              ))}
            </div>

            {/* Top bar */}
            <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-3 pt-2"
              onClick={e => e.stopPropagation()}>
              {/* Clicking avatar/name goes to user profile */}
              <Link
                href={`/users/${viewStory.user.id}`}
                className="flex items-center gap-2 hover:opacity-80 transition"
                onClick={() => { cancelAnimationFrame(rafRef.current); setViewStory(null); }}
              >
                {viewStory.user.avatarUrl
                  ? <img src={viewStory.user.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-white/30" />
                  : <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{viewStory.user.username.charAt(0).toUpperCase()}</span>
                    </div>}
                <div>
                  <p className="text-sm font-semibold text-white leading-none">{viewStory.user.username}</p>
                  <p className="text-[10px] text-white/60 mt-0.5">
                    {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {currentStory.label && (
                  <span className="text-[10px] bg-indigo-600/90 text-white px-2 py-0.5 rounded-full ml-1">{currentStory.label}</span>
                )}
              </Link>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setPaused(p => !p)} className="p-1.5 bg-black/40 rounded-full text-white/80 hover:text-white transition">
                  {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                {isMyStory && (
                  <button onClick={() => setConfirmDelete(currentStory.id)} className="p-1.5 bg-black/40 rounded-full text-white/80 hover:text-red-400 transition">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => { cancelAnimationFrame(rafRef.current); setViewStory(null); }}
                  className="p-1.5 bg-black/40 rounded-full text-white/80 hover:text-white transition">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Media */}
            <div className="w-full h-full flex items-center justify-center bg-black">
              {isVideo ? (
                <video ref={videoRef} src={currentStory.mediaUrl}
                  className="w-full h-full object-contain" autoPlay={!paused} muted={false} playsInline
                  onLoadedMetadata={() => {
                    const vid = videoRef.current;
                    if (!vid) return;
                    const dur = isFinite(vid.duration) ? Math.min(vid.duration, MAX_VIDEO_DURATION) : MAX_VIDEO_DURATION;
                    durationRef.current = dur * 1000;
                    elapsedRef.current  = 0;
                    if (!pausedRef.current) startRAF();
                  }}
                  onEnded={goNext}
                  onPlay={() => { if (pausedRef.current && videoRef.current) videoRef.current.pause(); }}
                  style={{ pointerEvents: "none" }}
                />
              ) : (
                <img src={currentStory.mediaUrl} alt="" className="w-full h-full object-contain" style={{ pointerEvents: "none" }} />
              )}
            </div>

            {/* Caption */}
            {currentStory.caption && (
              <div className="absolute bottom-28 left-0 right-0 z-20 px-5 pointer-events-none">
                <p className="text-sm text-white leading-snug drop-shadow">
                  {currentStory.caption.split(/(@\w+)/g).map((part, i) =>
                    part.startsWith("@")
                      ? <span key={i} className="text-indigo-300 font-semibold">{part}</span>
                      : <span key={i}>{part}</span>
                  )}
                </p>
              </div>
            )}

            {/* Bottom bar */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-6 pt-12"
              onClick={e => e.stopPropagation()}>

              {/* Own story */}
              {isMyStory && (
                <div className="flex items-center justify-center gap-3 mb-2">
                  <button onClick={e => { e.stopPropagation(); setShowViewers(v => !v); setPaused(v => !v); }}
                    className={`flex items-center gap-2 text-sm border px-4 py-2 rounded-full transition ${showViewers ? "text-white bg-white/10 border-white/40" : "text-white/80 border-white/30 hover:bg-white/10"}`}>
                    👁 {viewers.length} {viewers.length === 1 ? "view" : "views"}
                  </button>
                  <button onClick={e => { e.stopPropagation(); cancelAnimationFrame(rafRef.current); setViewStory(null); setShowAddModal(true); }}
                    className="flex items-center gap-2 text-sm text-white/80 border border-white/30 px-4 py-2 rounded-full hover:bg-white/10 transition">
                    <Plus className="h-4 w-4" />Add
                  </button>
                </div>
              )}

              {/* Others' story: reply + like + send + copy */}
              {!isMyStory && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 bg-transparent border border-white/30 rounded-full px-4 py-2.5 flex items-center">
                    <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder={`Reply to ${viewStory.user.username}…`}
                      className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder-white/50"
                      onFocus={() => setPaused(true)}
                      onBlur={() => { if (!replyText.trim()) setPaused(false); }}
                      onKeyDown={e => { if (e.key === "Enter" && replyText.trim()) sendReplyMut.mutate(); }}
                    />
                    <button onClick={() => sendReplyMut.mutate()}
                      disabled={!replyText.trim() || sendReplyMut.isPending}
                      className="ml-2 text-white/70 hover:text-white disabled:opacity-40 transition flex-shrink-0">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Like */}
                  <button onClick={() => { if (!likeMut.isPending) likeMut.mutate(); }}
                    className={`p-2.5 rounded-full border transition ${storyLiked ? "border-red-500 text-red-500" : "border-white/30 text-white/70 hover:text-white"}`}>
                    <Heart className={`h-5 w-5 ${storyLiked ? "fill-current" : ""}`} />
                  </button>
                  {/* Single Share button — opens full sheet with Send + Copy tabs */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setShowStoryShare(s => !s);
                      setPaused(true);
                    }}
                    className={`p-2.5 rounded-full border transition ${showStoryShare ? "border-indigo-400 text-indigo-400" : "border-white/30 text-white/70 hover:text-white"}`}
                    title="Share"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              )}

              <p className="text-center text-[10px] text-white/40">{storyIdx + 1} / {viewStory.stories.length}</p>
            </div>

            {/* Tap zones: left = prev, right = next (stopPropagation so they don't toggle pause) */}
            <div className="absolute inset-0 flex z-10">
              <div className="w-1/3 h-full cursor-pointer" onClick={e => { e.stopPropagation(); goPrev(); }} />
              <div className="w-2/3 h-full cursor-pointer" onClick={e => { e.stopPropagation(); goNext(); }} />
            </div>

            {/* Viewers panel */}
            {isMyStory && showViewers && (
              <div className="absolute inset-x-0 bottom-0 z-30 bg-gray-900/97 rounded-t-2xl border-t border-gray-800 max-h-80 overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900/97">
                  <h3 className="text-sm font-semibold text-white">👁 Viewed by {viewers.length}</h3>
                  <button onClick={() => { setShowViewers(false); setPaused(false); }} className="text-gray-500 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {viewers.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm py-8">No views yet</p>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {viewers.map((v: any) => (
                      <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                        {/* Avatar with heart badge if liked */}
                        <div className="relative flex-shrink-0">
                          {v.avatarUrl
                            ? <img src={v.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
                            : <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{v.username.charAt(0).toUpperCase()}</span>
                              </div>}
                          {v.liked && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center border border-gray-900">
                              <Heart className="h-2.5 w-2.5 text-white fill-current" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{v.username}</p>
                          <p className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(v.viewedAt), { addSuffix: true })}</p>
                        </div>
                        {v.liked && <span className="text-[10px] text-red-400 flex-shrink-0">❤️</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Story share sheet — combined: Send to friend + Share externally */}
            {!isMyStory && showStoryShare && (
              <div className="absolute inset-x-0 bottom-0 z-30 bg-gray-900/97 rounded-t-2xl border-t border-gray-800 max-h-96 overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 sticky top-0 bg-gray-900/97">
                  <h3 className="text-sm font-semibold text-white">Share story</h3>
                  <button onClick={() => { setShowStoryShare(false); setPaused(false); }} className="text-gray-500 hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mx-5 mt-4 mb-3 bg-gray-800 rounded-xl p-1">
                  <button onClick={() => setShareSheetTab("send")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${shareSheetTab === "send" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}>
                    Send to Friend
                  </button>
                  <button onClick={() => setShareSheetTab("link")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${shareSheetTab === "link" ? "bg-gray-700 text-white" : "text-gray-400 hover:text-white"}`}>
                    Share Link
                  </button>
                </div>

                {/* Send to friend tab */}
                {shareSheetTab === "send" && (
                  <div className="px-5 pb-5 space-y-2">
                    {!myConnections ? (
                      <div className="flex justify-center py-4"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
                    ) : (myConnections as any[]).length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No connections yet</p>
                    ) : (myConnections as any[]).map((conn: any) => (
                      <div key={conn.id} className="flex items-center justify-between p-2.5 bg-gray-800/60 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          {conn.user.avatarUrl
                            ? <img src={conn.user.avatarUrl} alt="" className="w-9 h-9 rounded-full" />
                            : <div className="w-9 h-9 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white">{conn.user.username.charAt(0).toUpperCase()}</div>}
                          <span className="text-sm text-white">{conn.user.username}</span>
                        </div>
                        <button onClick={() => shareStoryMut.mutate(conn.user.id)}
                          disabled={shareStoryMut.isPending || storySentTo === conn.user.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${storySentTo === conn.user.id ? "bg-green-600 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"}`}>
                          {storySentTo === conn.user.id ? "Sent ✓" : "Send"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Share link tab */}
                {shareSheetTab === "link" && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* Copy link row */}
                    {(() => {
                      const storyLink = currentStory ? `${typeof window !== "undefined" ? window.location.origin : ""}/story/${currentStory.id}` : "";
                      return (
                        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <Share2 className="h-4 w-4 text-gray-300" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-white">Copy link</p>
                            <p className="text-[10px] text-gray-500 truncate">{storyLink}</p>
                          </div>
                          <button onClick={() => share()}
                            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition flex-shrink-0 ${shareCopied ? "bg-green-600 text-white" : "bg-gray-700 text-gray-200 hover:bg-gray-600"}`}>
                            {shareCopied ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      );
                    })()}

                    {/* External platforms */}
                    <div>
                      <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider mb-3">Share via</p>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { label: "WhatsApp", emoji: "💬", bg: "bg-green-600",   action: () => { const u = encodeURIComponent(`${window.location.origin}/story/${currentStory?.id}`); window.open(`https://wa.me/?text=Check%20out%20this%20story%20${u}`, "_blank", "noopener"); } },
                          { label: "Twitter",  emoji: "𝕏",  bg: "bg-gray-700 border border-gray-600", action: () => { const u = encodeURIComponent(`${window.location.origin}/story/${currentStory?.id}`); window.open(`https://twitter.com/intent/tweet?text=Check%20out%20this%20story&url=${u}`, "_blank", "noopener"); } },
                          { label: "Telegram", emoji: "✈️", bg: "bg-blue-500",   action: () => { const u = encodeURIComponent(`${window.location.origin}/story/${currentStory?.id}`); window.open(`https://t.me/share/url?url=${u}&text=Check%20out%20this%20story`, "_blank", "noopener"); } },
                          { label: "Gmail",    emoji: "✉️", bg: "bg-red-500",    action: () => { const u = encodeURIComponent(`${window.location.origin}/story/${currentStory?.id}`); window.open(`https://mail.google.com/mail/?view=cm&body=Check%20out%20this%20story%20${u}`, "_blank", "noopener"); } },
                        ].map(({ label, emoji, bg, action }) => (
                          <button key={label} onClick={action} className="flex flex-col items-center gap-1.5 group">
                            <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center text-white font-bold text-base group-hover:opacity-80 transition`}>
                              {emoji}
                            </div>
                            <span className="text-[10px] text-gray-500">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Native share (mobile) */}
                    {typeof navigator !== "undefined" && (navigator as any).share && (
                      <button onClick={() => share()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-xl hover:bg-gray-700 transition border border-gray-700">
                        <Share2 className="h-4 w-4" />More options
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Confirm Delete ──────────────────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] p-4">
          <div className="bg-gray-900 rounded-2xl p-6 border border-red-900/50 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-900/40 rounded-xl flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-400" /></div>
              <h3 className="text-base font-semibold text-white">Delete Story?</h3>
            </div>
            <p className="text-sm text-gray-400 mb-5">This will be permanently removed from everyone's feed.</p>
            <div className="flex gap-3">
              <button onClick={() => deleteMut.mutate(confirmDelete)} disabled={deleteMut.isPending}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition">
                {deleteMut.isPending ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-800 text-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
