"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { repoRequestsAPI, messagesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { KeyRound, Check, X, Clock, CheckCircle, XCircle, Send, Inbox, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

function StatusBadge({ status }) {
  if (status === "APPROVED") return <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full"><CheckCircle className="h-3 w-3" />Approved</span>;
  if (status === "REJECTED") return <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-900/30 px-2.5 py-1 rounded-full"><XCircle className="h-3 w-3" />Rejected</span>;
  return <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-900/30 px-2.5 py-1 rounded-full"><Clock className="h-3 w-3" />Pending</span>;
}

export default function RepoRequestsPage() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState("sent");

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
    mutationFn: (id) => repoRequestsAPI.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repoReqReceived"] }),
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (id) => repoRequestsAPI.reject(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["repoReqReceived"] }),
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });

  const startChat = async (userId) => {
    try {
      await messagesAPI.send({ receiverId: userId, content: "Hi! I'd like to discuss the repository access request." });
      router.push("/messages");
    } catch { router.push("/messages"); }
  };

  if (!isAuthenticated) return <div className="flex items-center justify-center py-20 text-gray-500">Please login</div>;

  const pendingCount = (received ?? []).filter(r => r.status === "PENDING").length;

  return (
    <div className="space-y-5 font-sans">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold font-mono text-primary flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-500" />
          <span>Repository Requests</span>
        </h1>
        <p className="text-xs text-muted mt-0.5 font-sans">Manage private repository access authorizations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 surface-raised p-1 border border-subtle rounded-sm w-fit">
        {[
          { key: "sent",     label: `Sent (${sent?.length ?? 0})`,                                   icon: Send },
          { key: "received", label: `Received${pendingCount > 0 ? ` (${pendingCount})` : ""}`,       icon: Inbox },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-mono transition ${tab === key ? "bg-amber-500 text-gray-950 font-bold" : "text-muted hover:text-primary"}`}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Sent */}
      {tab === "sent" && (
        loadSent ? <Spinner /> : sent && sent.length > 0 ? (
          <div className="space-y-3">
            {sent.map(req => (
              <div key={req.id} className="surface-card border border-subtle rounded-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <Link href={`/projects/${req.projectId}`} className="text-base font-semibold text-primary hover:text-amber-500 transition">
                      {req.project?.title || "Unknown Project"}
                    </Link>
                    <p className="text-xs text-muted mt-0.5 font-mono">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-xs text-muted block mb-0.5 font-mono">Requested Role</span><span className="text-secondary">{req.requestedRole}</span></div>
                  <div><span className="text-xs text-muted block mb-0.5 font-mono">Availability</span><span className="text-secondary">{req.availabilityHours} hrs/week</span></div>
                  <div className="col-span-2"><span className="text-xs text-muted block mb-0.5 font-mono">Experience</span><p className="text-secondary text-sm">{req.experienceDescription}</p></div>
                  {req.portfolioUrl && <div><span className="text-xs text-muted block mb-0.5 font-mono">Portfolio</span><a href={req.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-amber-500 text-xs hover:underline">{req.portfolioUrl}</a></div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={<Send className="h-10 w-10 text-muted" />} title="No sent requests" desc="Browse projects and request repository access" cta={{ label: "Explore Projects", href: "/explore" }} />
        )
      )}

      {/* Received */}
      {tab === "received" && (
        loadReceived ? <Spinner /> : received && received.length > 0 ? (
          <div className="space-y-3">
            {received.map(req => (
              <div key={req.id} className="surface-card border border-subtle rounded-sm p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    {req.requester?.avatarUrl
                      ? <img src={req.requester.avatarUrl} alt="" className="w-10 h-10 rounded-sm object-cover" />
                      : <div className="w-10 h-10 rounded-sm bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center font-bold"><span className="text-sm">{req.requester?.username?.charAt(0).toUpperCase()}</span></div>
                    }
                    <div>
                      <p className="text-sm font-semibold text-primary">{req.requester?.username}</p>
                      <Link href={`/projects/${req.projectId}`} className="text-xs text-amber-500 hover:underline font-mono">{req.project?.title}</Link>
                      <p className="text-xs text-muted mt-0.5 font-mono">{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}</p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div><span className="text-xs text-muted block mb-0.5 font-mono">Requested Role</span><span className="text-secondary">{req.requestedRole}</span></div>
                  <div><span className="text-xs text-muted block mb-0.5 font-mono">Availability</span><span className="text-secondary">{req.availabilityHours} hrs/week</span></div>
                  <div className="col-span-2"><span className="text-xs text-muted block mb-0.5 font-mono">Experience</span><p className="text-secondary text-sm">{req.experienceDescription}</p></div>
                  <div><span className="text-xs text-muted block mb-0.5 font-mono">GitHub</span><a href={req.githubProfile} target="_blank" rel="noopener noreferrer" className="text-amber-500 text-xs hover:underline truncate block">{req.githubProfile}</a></div>
                  {req.portfolioUrl && <div><span className="text-xs text-muted block mb-0.5 font-mono">Portfolio</span><a href={req.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-amber-500 text-xs hover:underline">{req.portfolioUrl}</a></div>}
                  {req.additionalMessage && <div className="col-span-2"><span className="text-xs text-muted block mb-0.5 font-mono">Message</span><p className="text-secondary text-sm">{req.additionalMessage}</p></div>}
                </div>
                {req.status === "PENDING" && (
                  <div className="flex gap-2 pt-3 border-t border-subtle">
                    <button onClick={() => approveMut.mutate(req.id)} disabled={approveMut.isPending}
                      className="flex items-center gap-2 text-sm font-semibold text-black bg-amber-500 px-4 py-2 rounded-sm hover:bg-amber-400 disabled:opacity-50 transition shadow-sm">
                      <Check className="h-4 w-4" />Approve
                    </button>
                    <button onClick={() => rejectMut.mutate(req.id)} disabled={rejectMut.isPending}
                      className="flex items-center gap-2 text-sm text-secondary border border-subtle px-4 py-2 rounded-sm hover:text-red-400 hover:border-red-500/40 disabled:opacity-50 transition">
                      <X className="h-4 w-4" />Reject
                    </button>
                    <button onClick={() => startChat(req.requesterId)}
                      className="flex items-center gap-2 text-sm text-muted border border-subtle px-4 py-2 rounded-sm hover:text-primary transition ml-auto">
                      <MessageSquare className="h-4 w-4" />Chat
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty icon={<Inbox className="h-10 w-10 text-muted" />} title="No received requests" desc="Repository access requests will appear here" />
        )
      )}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>;
}

function Empty({ icon, title, desc, cta }) {
  return (
    <div className="text-center py-16 surface-card rounded-sm border border-subtle">
      <div className="flex justify-center mb-3">{icon}</div>
      <p className="text-primary font-medium mb-1">{title}</p>
      <p className="text-sm text-muted font-mono">{desc}</p>
      {cta && <Link href={cta.href} className="mt-3 inline-block text-sm text-amber-500 hover:underline font-mono">{cta.label} →</Link>}
    </div>
  );
}
