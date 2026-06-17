"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { repoRequestsAPI, messagesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { KeyRound, Check, X, Clock, CheckCircle, XCircle, Send, Inbox, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

function StatusBadge({ status }: { status: string }) {
  if (status === "APPROVED") return <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full"><CheckCircle className="h-3 w-3" />Approved</span>;
  if (status === "REJECTED") return <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-900/30 px-2.5 py-1 rounded-full"><XCircle className="h-3 w-3" />Rejected</span>;
  return <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-900/30 px-2.5 py-1 rounded-full"><Clock className="h-3 w-3" />Pending</span>;
}

export default function RepoRequestsPage() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<"sent" | "received">("sent");

  const { data: sent, isLoading: loadSent } = useQuery({
    queryKey: ["repoReqSent"],
    queryFn: async () => { const { data } = await repoRequestsAPI.getMine(); return data; },
    enabled: isAuthenticated,
  });

  const { data: received, isLoading: loadReceived } = useQuery({
    queryKey: ["repoReqReceived"],
    queryFn: async () => { const { data } = await repoRequestsAPI.getIncoming(); return data; },
    enabled: isAuthenticated,
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => repoRequestsAPI.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repoReqReceived"] }),
    onError: (e: any) => alert(e.response?.data?.message || "Failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (id: string) => repoRequestsAPI.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repoReqReceived"] }),
    onError: (e: any) => alert(e.response?.data?.message || "Failed"),
  });

  const startChat = async (userId: string) => {
    try {
      await messagesAPI.send({ receiverId: userId, content: "Hi! I'd like to discuss the repository access request." });
      router.push("/messages");
    } catch { router.push("/messages"); }
  };

  if (!isAuthenticated) return <div className="flex items-center justify-center py-20 text-gray-500">Please login</div>;

  const pendingCount = (received ?? []).filter(r => r.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <KeyRound className="h-6 w-6 text-purple-400" /> Repository Requests
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage repository access requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 w-fit">
        {[
          { key: "sent",     label: `Sent (${sent?.length ?? 0})`,                                   icon: Send },
          { key: "received", label: `Received${pendingCount > 0 ? ` (${pendingCount})` : ""}`,       icon: Inbox },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${tab === key ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {/* Sent */}
      {tab === "sent" && (
        loadSent ? <Spinner /> : sent && sent.length > 0 ? (
          <div className="space-y-3">
            {sent.map(req => (
              <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <Link href={`/projects/${req.projectId}`} className="text-base font-semibold text-indigo-400 hover:text-indigo-300">
                      {req.project?.title || "Unknown Project"}
                    </Link>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-gray-500 block mb-0.5">Requested Role</span><span className="text-gray-300">{req.requestedRole}</span></div>
                  <div><span className="text-xs text-gray-500 block mb-0.5">Availability</span><span className="text-gray-300">{req.availabilityHours} hrs/week</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-500 block mb-0.5">Experience</span><p className="text-gray-300 text-sm">{req.experienceDescription}</p></div>
                  {req.portfolioUrl && <div><span className="text-xs text-gray-500 block mb-0.5">Portfolio</span><a href={req.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs hover:text-indigo-300">{req.portfolioUrl}</a></div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={<Send className="h-10 w-10 text-gray-700" />} title="No sent requests" desc="Browse projects and request repository access" cta={{ label: "Explore Projects", href: "/explore" }} />
        )
      )}

      {/* Received */}
      {tab === "received" && (
        loadReceived ? <Spinner /> : received && received.length > 0 ? (
          <div className="space-y-3">
            {received.map(req => (
              <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {req.requester?.avatarUrl
                      ? <img src={req.requester.avatarUrl} alt="" className="w-10 h-10 rounded-xl" />
                      : <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center"><span className="text-sm font-bold text-white">{req.requester?.username?.charAt(0).toUpperCase()}</span></div>
                    }
                    <div>
                      <p className="text-sm font-semibold text-white">{req.requester?.username}</p>
                      <Link href={`/projects/${req.projectId}`} className="text-xs text-indigo-400 hover:text-indigo-300">{req.project?.title}</Link>
                      <p className="text-xs text-gray-600 mt-0.5">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div><span className="text-xs text-gray-500 block mb-0.5">Requested Role</span><span className="text-gray-300">{req.requestedRole}</span></div>
                  <div><span className="text-xs text-gray-500 block mb-0.5">Availability</span><span className="text-gray-300">{req.availabilityHours} hrs/week</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-500 block mb-0.5">Experience</span><p className="text-gray-300 text-sm">{req.experienceDescription}</p></div>
                  <div><span className="text-xs text-gray-500 block mb-0.5">GitHub</span><a href={req.githubProfile} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs hover:text-indigo-300 truncate block">{req.githubProfile}</a></div>
                  {req.portfolioUrl && <div><span className="text-xs text-gray-500 block mb-0.5">Portfolio</span><a href={req.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-xs hover:text-indigo-300">{req.portfolioUrl}</a></div>}
                  {req.additionalMessage && <div className="col-span-2"><span className="text-xs text-gray-500 block mb-0.5">Message</span><p className="text-gray-300 text-sm">{req.additionalMessage}</p></div>}
                </div>
                {req.status === "PENDING" && (
                  <div className="flex gap-2 pt-3 border-t border-gray-800">
                    <button onClick={() => approveMut.mutate(req.id)} disabled={approveMut.isPending}
                      className="flex items-center gap-2 text-sm font-medium text-white bg-green-600 px-4 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 transition">
                      <Check className="h-4 w-4" />Approve
                    </button>
                    <button onClick={() => rejectMut.mutate(req.id)} disabled={rejectMut.isPending}
                      className="flex items-center gap-2 text-sm text-red-400 border border-red-800 px-4 py-2 rounded-xl hover:bg-red-900/20 disabled:opacity-50 transition">
                      <X className="h-4 w-4" />Reject
                    </button>
                    <button onClick={() => startChat(req.requesterId)}
                      className="flex items-center gap-2 text-sm text-gray-400 border border-gray-700 px-4 py-2 rounded-xl hover:bg-gray-800 transition ml-auto">
                      <MessageSquare className="h-4 w-4" />Chat
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={<Inbox className="h-10 w-10 text-gray-700" />} title="No received requests" desc="Repository access requests will appear here" />
        )
      )}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
}

function Empty({ icon, title, desc, cta }: { icon: React.ReactNode; title: string; desc: string; cta?: { label: string; href: string } }) {
  return (
    <div className="text-center py-16 bg-gray-900 rounded-2xl border border-gray-800">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-white font-medium mb-1">{title}</p>
      <p className="text-sm text-gray-500">{desc}</p>
      {cta && <Link href={cta.href} className="mt-3 inline-block text-sm text-indigo-400 hover:text-indigo-300">{cta.label} →</Link>}
    </div>
  );
}
