"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { opportunitiesAPI, messagesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Clock, DollarSign, Wifi, Users, Check, X, MessageSquare, ArrowLeft, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function OpportunityDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: opp, isLoading } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: async () => { const { data } = await opportunitiesAPI.getById(id); return data; },
    enabled: !!id,
  });

  const approveMut = useMutation({
    mutationFn: (appId) => opportunitiesAPI.approveApp(id, appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunity", id] }),
    onError: (e) => alert(e.response?.data?.message || "Failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (appId) => opportunitiesAPI.rejectApp(id, appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunity", id] }),
  });

  const deleteMut = useMutation({
    mutationFn: () => opportunitiesAPI.delete(id),
    onSuccess: () => router.push("/opportunities"),
  });

  const closeMut = useMutation({
    mutationFn: () => opportunitiesAPI.update(id, { status: "CLOSED" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunity", id] }),
  });

  const startChat = async (applicantId) => {
    await messagesAPI.send({ receiverId: applicantId, content: "Hi! I'd like to discuss your application." });
    router.push("/messages");
  };

  if (isLoading) return (
    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
  );
  if (!opp) return <div className="text-center py-20 text-muted font-mono">Opportunity not found</div>;

  const isOwner = user?.id === opp.ownerId;

  return (
    <div className="min-h-screen surface-base p-6">
      <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm text-secondary hover:text-primary mb-5 transition font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to Opportunities
      </Link>

      {/* Header card */}
      <div className="surface-card border border-subtle rounded-sm p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs font-mono font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-sm">{opp.role}</span>
              {opp.isRemote && <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-sm font-mono"><Wifi className="h-3 w-3" />Remote</span>}
              <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-sm ${opp.status === "OPEN" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30" : "text-muted surface-raised border border-subtle"}`}>
                {opp.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-primary mb-2 tracking-tight">{opp.title}</h1>
            <p className="text-secondary leading-relaxed">{opp.description}</p>
          </div>
          {isOwner && (
            <div className="flex gap-2 flex-shrink-0">
              {opp.status === "OPEN" && (
                <button onClick={() => closeMut.mutate()} className="text-sm font-mono text-amber-500 border border-subtle surface-input px-3 py-2 rounded-sm hover:border-amber-500/40 transition">
                  Close
                </button>
              )}
              <button onClick={() => { if (confirm("Delete this opportunity?")) deleteMut.mutate(); }}
                className="text-sm font-mono text-secondary border border-subtle px-3 py-2 rounded-sm hover:text-red-400 hover:border-red-500/40 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Skills */}
        {opp.requiredSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {opp.requiredSkills.map((s, i) => (
              <span key={i} className="text-xs font-mono text-secondary bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-sm">{s}</span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-subtle text-sm text-muted font-mono">
          {opp.duration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{opp.duration}</span>}
          {opp.budget && <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{opp.budget}</span>}
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{opp._count?.applications ?? 0} applications</span>
          <span className="ml-auto">{formatDistanceToNow(new Date(opp.createdAt), { addSuffix: true })}</span>
        </div>

        {/* Posted by */}
        <div className="flex items-center gap-2 mt-3">
          {opp.owner?.avatarUrl
            ? <img src={opp.owner.avatarUrl} alt="" className="w-6 h-6 rounded-sm object-cover" />
            : <div className="w-6 h-6 rounded-sm bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center text-[10px] font-bold">{opp.owner?.username?.charAt(0).toUpperCase()}</div>
          }
          <span className="text-xs text-muted">Posted by <span className="text-primary font-medium">{opp.owner?.username}</span></span>
          {opp.project && (
            <Link href={`/projects/${opp.project.id}`} className="text-xs text-amber-500 hover:underline ml-2 font-mono">
              · {opp.project.title}
            </Link>
          )}
        </div>
      </div>

      {/* Applications (owner only) */}
      {isOwner && opp.applications && (
        <div>
          <h2 className="text-lg font-semibold text-primary mb-4">
            Applications <span className="text-muted font-normal text-sm font-mono">({opp.applications.length})</span>
          </h2>
          {opp.applications.length > 0 ? (
            <div className="space-y-3">
              {opp.applications.map((app) => (
                <div key={app.id} className="surface-card border border-subtle rounded-sm p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {app.applicant?.avatarUrl
                        ? <img src={app.applicant.avatarUrl} alt="" className="w-10 h-10 rounded-sm object-cover" />
                        : <div className="w-10 h-10 rounded-sm bg-amber-500/20 border border-amber-500/40 text-amber-500 flex items-center justify-center font-bold">{app.applicant?.username?.charAt(0).toUpperCase()}</div>
                      }
                      <div>
                        <Link href={`/users/${app.applicantId}`} className="text-sm font-semibold text-primary hover:text-amber-500 transition">{app.applicant?.username}</Link>
                        <p className="text-xs text-muted font-mono">{formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-sm ${
                      app.status === "APPROVED" ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/30"
                      : app.status === "REJECTED" ? "text-red-400 bg-red-500/10 border border-red-500/30"
                      : "text-amber-500 bg-amber-500/10 border border-amber-500/30"
                    }`}>{app.status}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div><span className="text-xs text-muted font-mono">Experience</span><p className="text-sm text-secondary mt-0.5">{app.experience}</p></div>
                    <div className="flex gap-4 font-mono">
                      {app.githubUrl && <a href={app.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 hover:underline">GitHub →</a>}
                      {app.portfolioUrl && <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-500 hover:underline">Portfolio →</a>}
                    </div>
                    {app.message && <div><span className="text-xs text-muted font-mono">Message</span><p className="text-sm text-secondary mt-0.5">{app.message}</p></div>}
                  </div>

                  {app.status === "PENDING" && (
                    <div className="flex gap-2 pt-3 border-t border-subtle">
                      <button onClick={() => approveMut.mutate(app.id)} disabled={approveMut.isPending}
                        className="flex items-center gap-1.5 text-sm font-semibold text-black bg-amber-500 px-3 py-2 rounded-sm hover:bg-amber-400 disabled:opacity-50 transition shadow-sm">
                        <Check className="h-4 w-4" />Approve
                      </button>
                      <button onClick={() => rejectMut.mutate(app.id)} disabled={rejectMut.isPending}
                        className="flex items-center gap-1.5 text-sm text-secondary border border-subtle px-3 py-2 rounded-sm hover:text-red-400 hover:border-red-500/40 disabled:opacity-50 transition">
                        <X className="h-4 w-4" />Reject
                      </button>
                      <button onClick={() => startChat(app.applicantId)}
                        className="flex items-center gap-1.5 text-sm text-muted border border-subtle px-3 py-2 rounded-sm hover:text-primary transition ml-auto">
                        <MessageSquare className="h-4 w-4" />Message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 surface-card border border-subtle rounded-sm">
              <Users className="h-10 w-10 mx-auto mb-2 text-muted" />
              <p className="text-muted font-mono">No applications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
