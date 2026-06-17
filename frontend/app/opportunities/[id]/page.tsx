"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { opportunitiesAPI, messagesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { Briefcase, Clock, DollarSign, Wifi, Users, Check, X, MessageSquare, ArrowLeft, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function OpportunityDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const qc = useQueryClient();
  const router = useRouter();

  const { data: opp, isLoading } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: async () => { const { data } = await opportunitiesAPI.getById(id); return data; },
    enabled: !!id,
  });

  const approveMut = useMutation({
    mutationFn: (appId: string) => opportunitiesAPI.approveApp(id, appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunity", id] }),
    onError: (e: any) => alert(e.response?.data?.message || "Failed"),
  });

  const rejectMut = useMutation({
    mutationFn: (appId: string) => opportunitiesAPI.rejectApp(id, appId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunity", id] }),
  });

  const deleteMut = useMutation({
    mutationFn: () => opportunitiesAPI.delete(id),
    onSuccess: () => router.push("/opportunities"),
  });

  const closeMut = useMutation({
    mutationFn: () => opportunitiesAPI.update(id, { status: "CLOSED" } as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["opportunity", id] }),
  });

  const startChat = async (applicantId: string) => {
    await messagesAPI.send({ receiverId: applicantId, content: "Hi! I'd like to discuss your application." });
    router.push("/messages");
  };

  if (isLoading) return (
    <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
  );
  if (!opp) return <div className="text-center py-20 text-gray-500">Opportunity not found</div>;

  const isOwner = user?.id === opp.ownerId;

  return (
    <div className="min-h-screen bg-gray-950">
      <Link href="/opportunities" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-5 transition">
        <ArrowLeft className="h-4 w-4" /> Back to Opportunities
      </Link>

      {/* Header card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs font-semibold text-indigo-400 bg-indigo-900/40 px-2.5 py-1 rounded-full">{opp.role}</span>
              {opp.isRemote && <span className="flex items-center gap-1 text-xs text-green-400 bg-green-900/30 px-2.5 py-1 rounded-full"><Wifi className="h-3 w-3" />Remote</span>}
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${opp.status === "OPEN" ? "text-green-400 bg-green-900/30" : "text-gray-500 bg-gray-800"}`}>
                {opp.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{opp.title}</h1>
            <p className="text-gray-400 leading-relaxed">{opp.description}</p>
          </div>
          {isOwner && (
            <div className="flex gap-2 flex-shrink-0">
              {opp.status === "OPEN" && (
                <button onClick={() => closeMut.mutate()} className="text-sm text-yellow-400 border border-yellow-800 px-3 py-2 rounded-xl hover:bg-yellow-900/20 transition">
                  Close
                </button>
              )}
              <button onClick={() => { if (confirm("Delete this opportunity?")) deleteMut.mutate(); }}
                className="text-sm text-red-400 border border-red-800 px-3 py-2 rounded-xl hover:bg-red-900/20 transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Skills */}
        {opp.requiredSkills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {opp.requiredSkills.map((s: string, i: number) => (
              <span key={i} className="text-xs text-indigo-300 bg-indigo-900/40 px-2.5 py-1 rounded-full">{s}</span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-800 text-sm text-gray-500">
          {opp.duration && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{opp.duration}</span>}
          {opp.budget && <span className="flex items-center gap-1.5"><DollarSign className="h-4 w-4" />{opp.budget}</span>}
          <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{opp._count?.applications ?? 0} applications</span>
          <span className="ml-auto">{formatDistanceToNow(new Date(opp.createdAt), { addSuffix: true })}</span>
        </div>

        {/* Posted by */}
        <div className="flex items-center gap-2 mt-3">
          {opp.owner?.avatarUrl
            ? <img src={opp.owner.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            : <div className="w-6 h-6 rounded-full bg-indigo-700 flex items-center justify-center text-[10px] font-bold text-white">{opp.owner?.username?.charAt(0).toUpperCase()}</div>
          }
          <span className="text-xs text-gray-500">Posted by <span className="text-gray-300">{opp.owner?.username}</span></span>
          {opp.project && (
            <Link href={`/projects/${opp.project.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 ml-2">
              · {opp.project.title}
            </Link>
          )}
        </div>
      </div>

      {/* Applications (owner only) */}
      {isOwner && opp.applications && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Applications <span className="text-gray-500 font-normal text-sm">({opp.applications.length})</span>
          </h2>
          {opp.applications.length > 0 ? (
            <div className="space-y-3">
              {opp.applications.map((app: any) => (
                <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      {app.applicant?.avatarUrl
                        ? <img src={app.applicant.avatarUrl} alt="" className="w-10 h-10 rounded-xl" />
                        : <div className="w-10 h-10 rounded-xl bg-indigo-700 flex items-center justify-center font-bold text-white">{app.applicant?.username?.charAt(0).toUpperCase()}</div>
                      }
                      <div>
                        <Link href={`/users/${app.applicantId}`} className="text-sm font-semibold text-white hover:text-indigo-400">{app.applicant?.username}</Link>
                        <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      app.status === "APPROVED" ? "text-green-400 bg-green-900/30"
                      : app.status === "REJECTED" ? "text-red-400 bg-red-900/30"
                      : "text-yellow-400 bg-yellow-900/30"
                    }`}>{app.status}</span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div><span className="text-xs text-gray-500">Experience</span><p className="text-sm text-gray-300 mt-0.5">{app.experience}</p></div>
                    <div className="flex gap-4">
                      {app.githubUrl && <a href={app.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">GitHub →</a>}
                      {app.portfolioUrl && <a href={app.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300">Portfolio →</a>}
                    </div>
                    {app.message && <div><span className="text-xs text-gray-500">Message</span><p className="text-sm text-gray-300 mt-0.5">{app.message}</p></div>}
                  </div>

                  {app.status === "PENDING" && (
                    <div className="flex gap-2 pt-3 border-t border-gray-800">
                      <button onClick={() => approveMut.mutate(app.id)} disabled={approveMut.isPending}
                        className="flex items-center gap-1.5 text-sm text-white bg-green-600 px-3 py-2 rounded-xl hover:bg-green-700 disabled:opacity-50 transition">
                        <Check className="h-4 w-4" />Approve
                      </button>
                      <button onClick={() => rejectMut.mutate(app.id)} disabled={rejectMut.isPending}
                        className="flex items-center gap-1.5 text-sm text-red-400 border border-red-800 px-3 py-2 rounded-xl hover:bg-red-900/20 disabled:opacity-50 transition">
                        <X className="h-4 w-4" />Reject
                      </button>
                      <button onClick={() => startChat(app.applicantId)}
                        className="flex items-center gap-1.5 text-sm text-gray-400 border border-gray-700 px-3 py-2 rounded-xl hover:bg-gray-800 transition ml-auto">
                        <MessageSquare className="h-4 w-4" />Message
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-900 border border-gray-800 rounded-2xl">
              <Users className="h-10 w-10 mx-auto mb-2 text-gray-700" />
              <p className="text-gray-400">No applications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
