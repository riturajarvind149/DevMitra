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
} from "lucide-react";

export default function MentorLandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [usernameInput, setUsernameInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [pastAnalyses, setPastAnalyses] = useState([]);
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

  const handleAnalyze = async (targetUsername) => {
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
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to start analysis. Please check the username and try again."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      {/* Precision Hero Header */}
      <div className="relative overflow-hidden rounded-sm border border-subtle surface-card p-8 sm:p-12 shadow-sm">
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            DevMitra AI Mentor Engine v3
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary leading-tight">
            Evidence-Backed{" "}
            <span className="text-amber-500 font-mono">Engineering Mentorship</span>
          </h1>

          <p className="text-sm sm:text-base text-secondary max-w-2xl mx-auto leading-relaxed">
            Zero hallucinated scores. Every rating traces directly to live GitHub API evidence. Get a personalized diagnosis and clear step-by-step roadmap to advance your engineering tier.
          </p>

          {/* Action Form Container */}
          <div className="pt-4 max-w-xl mx-auto space-y-4">
            {user?.githubUsername && (
              <div className="p-4 rounded-sm surface-input border border-subtle flex items-center justify-between">
                <div className="text-left">
                  <div className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-wider">
                    Your Authenticated GitHub Account
                  </div>
                  <div className="text-base font-bold text-primary font-mono">@{user.githubUsername}</div>
                </div>
                <button
                  onClick={() => handleAnalyze(user.githubUsername)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-sm shadow-sm transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  {isSubmitting ? "Queueing..." : "Analyze My GitHub"}
                </button>
              </div>
            )}

            {/* Public profile search form */}
            <div className="surface-card border border-subtle rounded-sm p-4 text-left shadow-sm">
              <label className="block text-xs font-mono font-semibold text-muted mb-2">
                Analyze Any Public Developer Profile
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Enter GitHub username (e.g. torvalds, shadcn)"
                    className="w-full surface-input border border-subtle rounded-sm pl-10 pr-4 py-2 text-xs text-primary placeholder-muted focus:outline-none focus:border-amber-500 transition font-mono"
                  />
                </div>
                <button
                  onClick={() => handleAnalyze()}
                  disabled={isSubmitting || !usernameInput.trim()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-sm transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                >
                  {isSubmitting ? "Processing..." : "Run Analysis"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-sm bg-red-950/40 border border-red-500/40 text-red-400 text-xs text-left font-mono">
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
            <h2 className="text-lg font-bold text-primary flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" />
              <span>Your Recent Mentor Reports</span>
            </h2>
            <span className="text-xs text-muted font-mono">Auto-saved to your account</span>
          </div>

          {loadingHistory ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 rounded-sm surface-card border border-subtle animate-pulse" />
              ))}
            </div>
          ) : pastAnalyses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastAnalyses.map((item) => (
                <Link
                  key={item.id}
                  href={`/mentor/${item.id}`}
                  className="p-5 rounded-sm surface-card border border-subtle hover:border-amber-500/40 transition block group shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-primary group-hover:text-amber-500 transition font-mono text-sm">
                      @{item.githubUsername}
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-sm font-mono font-bold uppercase tracking-wider ${
                        item.status === "DONE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : item.status === "FAILED"
                          ? "bg-red-500/10 text-red-400 border border-red-500/30"
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1 border-t border-subtle">
                    <div className="flex items-baseline gap-2">
                      {item.overallScore !== null ? (
                        <span className="text-2xl font-black text-primary font-mono">{item.overallScore}<span className="text-xs font-normal text-muted">/100</span></span>
                      ) : (
                        <span className="text-xs text-muted font-medium font-mono">No Score</span>
                      )}
                      {item.tier && (
                        <span className="text-xs font-bold text-amber-500 font-mono">
                          ({item.tier})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted font-mono">
                      {new Date(item.requestedAt).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-sm surface-card border border-subtle text-center text-sm text-muted font-mono">
              No previous analyses recorded. Run your first analysis above!
            </div>
          )}
        </div>
      )}

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-sm surface-card border border-subtle hover:border-amber-500/30 transition">
          <ShieldCheck className="w-7 h-7 text-amber-500 mb-4" />
          <h3 className="text-sm font-bold text-primary mb-2">Zero Hallucination Guarantee</h3>
          <p className="text-xs text-secondary leading-relaxed">
            Hard Quality Gate ensures scores are only derived from verified public GitHub evidence. No fake numbers.
          </p>
        </div>

        <div className="p-6 rounded-sm surface-card border border-subtle hover:border-amber-500/30 transition">
          <Code2 className="w-7 h-7 text-amber-500 mb-4" />
          <h3 className="text-sm font-bold text-primary mb-2">Repo-Specific Diagnosis</h3>
          <p className="text-xs text-secondary leading-relaxed">
            Diagnoses specific missing tests, Docker configs, or CI workflows by naming your actual repositories.
          </p>
        </div>

        <div className="p-6 rounded-sm surface-card border border-subtle hover:border-amber-500/30 transition">
          <Cpu className="w-7 h-7 text-amber-500 mb-4" />
          <h3 className="text-sm font-bold text-primary mb-2">Interactive Action Plan</h3>
          <p className="text-xs text-secondary leading-relaxed">
            Check off weekly tasks as you complete them to persist your progress and track score progression over time.
          </p>
        </div>
      </div>
    </div>
  );
}
