"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { mentorAPI } from "@/lib/api";
import Link from "next/link";
import { Sparkles, Search, History, ArrowRight, ShieldCheck, Cpu, Code2 } from "lucide-react";

export default function MentorLandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [usernameInput, setUsernameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastAnalyses, setPastAnalyses] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user?.githubUsername) {
      setUsernameInput(user.githubUsername);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoadingHistory(true);
      mentorAPI
        .getMine()
        .then((res) => setPastAnalyses(res.data || []))
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [user]);

  const handleAnalyze = async (targetUsername?: string) => {
    const handleName = (targetUsername || usernameInput).trim();
    if (!handleName) {
      setError("Please enter a valid GitHub username.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await mentorAPI.analyze(handleName);
      const { analysisId } = response.data;
      router.push(`/mentor/${analysisId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to start analysis. Please check the username and try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500 selection:text-white">
      {/* Header / Hero Section */}
      <div className="relative overflow-hidden border-b border-neutral-800 bg-neutral-900/50 py-16 px-6 sm:px-12">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 opacity-70 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI Mentor Engine v3 — Production Grade
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent mb-4">
            Evidence-backed Engineering Mentorship
          </h1>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10">
            No hallucinated scores. Every rating traces directly to live GitHub API evidence. Get a personalized diagnosis and clear step-by-step roadmap to advance your engineering tier.
          </p>

          {/* Action Card */}
          <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md max-w-2xl mx-auto">
            {user?.githubUsername && (
              <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-500/30 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Your Authenticated Profile</div>
                  <div className="text-lg font-bold text-white">@{user.githubUsername}</div>
                </div>
                <button
                  onClick={() => handleAnalyze(user.githubUsername!)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSubmitting ? "Queueing..." : "Analyze My GitHub"}
                </button>
              </div>
            )}

            <div className="relative">
              <label className="block text-left text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Analyze Any Public Developer Profile
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-neutral-500" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter GitHub username (e.g. torvalds)"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={isSubmitting || !usernameInput.trim()}
                  className="px-6 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl transition-all border border-neutral-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Starting..." : "Run Analysis"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/50 border border-red-500/40 text-red-400 text-sm text-left">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Past Analyses */}
        {user && pastAnalyses.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <History className="w-6 h-6 text-indigo-400" />
                Your Recent Mentor Reports
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastAnalyses.map((item) => (
                <Link
                  key={item.id}
                  href={`/mentor/${item.id}`}
                  className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all block group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-lg text-white group-hover:text-indigo-400 transition-colors">
                      @{item.githubUsername}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                        item.status === "DONE"
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : item.status === "FAILED"
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-neutral-400">
                    <div>
                      {item.overallScore !== null ? (
                        <span className="text-white font-bold text-base">{item.overallScore}/100</span>
                      ) : (
                        <span>No Score</span>
                      )}
                      {item.tier && <span className="ml-2 text-indigo-400 font-medium">({item.tier})</span>}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {new Date(item.requestedAt).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
            <ShieldCheck className="w-8 h-8 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Zero Hallucination Scoring</h3>
            <p className="text-sm text-neutral-400">
              Hard Quality Gate ensures no numbers are fabricated. If evidence is missing, you get honest feedback on how to make your work visible.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
            <Code2 className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Repo-Specific Diagnosis</h3>
            <p className="text-sm text-neutral-400">
              Never get generic advice. The AI mentor identifies specific repositories, missing tests, or unconfigured CI pipelines by name.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-neutral-900/50 border border-neutral-800">
            <Cpu className="w-8 h-8 text-pink-400 mb-4" />
            <h3 className="text-lg font-bold mb-2">Actionable Weekly Tasks</h3>
            <p className="text-sm text-neutral-400">
              Interactive task checkboxes persist your progress and track score improvements as you fix issues across your projects.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
