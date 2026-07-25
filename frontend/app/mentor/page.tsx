"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { mentorAPI } from "@/lib/api";
import Link from "next/link";
import {
  Sparkles,
  Search,
  History,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Code2,
  Zap,
  CheckCircle,
  TrendingUp,
  Award,
  Layers,
} from "lucide-react";

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
      setError(
        err.response?.data?.message ||
          "Failed to start analysis. Please check the username and try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Immersive Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-800 bg-gradient-to-b from-gray-900/90 via-gray-900/60 to-gray-950 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider shadow-inner">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            DevMitra AI Mentor Engine v3
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Evidence-Backed{" "}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
              Engineering Mentorship
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Zero hallucinated scores. Every rating traces directly to live GitHub API evidence. Get a personalized diagnosis and clear step-by-step roadmap to advance your engineering tier.
          </p>

          {/* Action Form Container */}
          <div className="pt-4 max-w-xl mx-auto space-y-4">
            {user?.githubUsername && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 flex items-center justify-between shadow-xl">
                <div className="text-left">
                  <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                    Your Authenticated GitHub Account
                  </div>
                  <div className="text-lg font-extrabold text-white">@{user.githubUsername}</div>
                </div>
                <button
                  onClick={() => handleAnalyze(user.githubUsername!)}
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  {isSubmitting ? "Queueing..." : "Analyze My GitHub"}
                </button>
              </div>
            )}

            {/* Public profile search form */}
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 shadow-xl backdrop-blur-md text-left">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                Analyze Any Public Developer Profile
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter GitHub username (e.g. torvalds, shadcn)"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={isSubmitting || !usernameInput.trim()}
                  className="px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Run Analysis"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs text-left">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Past Analyses Section */}
      {user && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              Your Recent Mentor Reports
            </h2>
            <span className="text-xs text-gray-500">Auto-saved to your account</span>
          </div>

          {loadingHistory ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-gray-900 border border-gray-800 animate-pulse" />
              ))}
            </div>
          ) : pastAnalyses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastAnalyses.map((item) => (
                <Link
                  key={item.id}
                  href={`/mentor/${item.id}`}
                  className="p-5 rounded-2xl bg-gray-900 border border-gray-800 hover:border-indigo-500/50 hover:bg-gray-900/90 transition-all block group shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                      @{item.githubUsername}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
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

                  <div className="flex items-baseline justify-between pt-1 border-t border-gray-800/80">
                    <div className="flex items-baseline gap-2">
                      {item.overallScore !== null ? (
                        <span className="text-2xl font-black text-white">{item.overallScore}<span className="text-xs font-normal text-gray-500">/100</span></span>
                      ) : (
                        <span className="text-xs text-gray-500 font-medium">No Score</span>
                      )}
                      {item.tier && (
                        <span className="text-xs font-semibold text-indigo-400">
                          ({item.tier})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-500 font-medium">
                      {new Date(item.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-gray-900/60 border border-gray-800 text-center text-sm text-gray-400">
              No previous analyses recorded. Run your first analysis above!
            </div>
          )}
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 transition">
          <ShieldCheck className="w-8 h-8 text-indigo-400 mb-4" />
          <h3 className="text-base font-bold text-white mb-2">Zero Hallucination Guarantee</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Hard Quality Gate ensures scores are only derived from verified public GitHub evidence. No fake numbers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 transition">
          <Code2 className="w-8 h-8 text-purple-400 mb-4" />
          <h3 className="text-base font-bold text-white mb-2">Repo-Specific Diagnosis</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Diagnoses specific missing tests, Docker configs, or CI workflows by naming your actual repositories.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-gray-900/70 border border-gray-800 hover:border-gray-700 transition">
          <Cpu className="w-8 h-8 text-pink-400 mb-4" />
          <h3 className="text-base font-bold text-white mb-2">Interactive Action Plan</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Check off weekly tasks as you complete them to persist your progress and track score progression over time.
          </p>
        </div>
      </div>
    </div>
  );
}
