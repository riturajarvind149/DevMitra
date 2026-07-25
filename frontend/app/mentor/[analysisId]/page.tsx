"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { mentorAPI } from "@/lib/api";
import Link from "next/link";
import {
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  ExternalLink,
  Shield,
  Award,
  BookOpen,
  Code,
  Layers,
  TrendingUp,
  Briefcase,
  CheckSquare,
  Square,
  Info,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function MentorDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const analysisId = params.analysisId as string;

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "developer" | "projects" | "reputation" | "progress" | "career" | "recruiter"
  >("overview");

  const [history, setHistory] = useState<any[]>([]);
  const [completingTaskIds, setCompletingTaskIds] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Poll analysis until DONE or FAILED
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const fetchAnalysis = async () => {
      try {
        const res = await mentorAPI.getAnalysis(analysisId);
        const data = res.data;
        setAnalysis(data);
        setLoading(false);

        if (data.status === "DONE" && data.userId) {
          mentorAPI.getHistory(data.userId).then((hRes) => setHistory(hRes.data || [])).catch(() => {});
        }

        if (data.status !== "DONE" && data.status !== "FAILED") {
          timer = setTimeout(fetchAnalysis, 2000);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load analysis.");
        setLoading(false);
      }
    };

    fetchAnalysis();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [analysisId]);

  const handleTaskComplete = async (taskId: string) => {
    setCompletingTaskIds((prev) => ({ ...prev, [taskId]: true }));
    try {
      await mentorAPI.completeTask(taskId);
      setAnalysis((prev: any) => {
        if (!prev || !prev.mentorPlan) return prev;
        const updatedTasks = prev.mentorPlan.weeklyTasks.map((t: any) =>
          t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
        );
        return {
          ...prev,
          mentorPlan: { ...prev.mentorPlan, weeklyTasks: updatedTasks },
        };
      });
      setToastMessage("✅ Task marked as complete! Your next analysis will reflect this progress.");
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setCompletingTaskIds((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently delete this analysis?")) return;
    try {
      await mentorAPI.deleteAnalysis(analysisId);
      router.push("/mentor");
    } catch (err) {
      alert("Failed to delete analysis.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-neutral-400">Loading analysis status...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Analysis Failed</h2>
          <p className="text-sm text-neutral-400 mb-6">{error || "Could not retrieve analysis report."}</p>
          <Link href="/mentor" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium">
            Return to Mentor
          </Link>
        </div>
      </div>
    );
  }

  // Progress Loader View (QUEUED / COLLECTING / SCORING)
  if (analysis.status !== "DONE" && analysis.status !== "FAILED") {
    const steps = ["QUEUED", "COLLECTING", "SCORING", "DONE"];
    const currentStepIdx = steps.indexOf(analysis.status);

    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-50 blur-2xl" />
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6 relative z-10" />
          <h2 className="text-2xl font-bold mb-2 relative z-10">Analyzing @{analysis.githubUsername}</h2>
          <p className="text-sm text-neutral-400 mb-8 relative z-10">
            Fetching repositories, commit velocity, and contribution graph from GitHub API...
          </p>

          <div className="space-y-4 relative z-10 text-left">
            {[
              { id: "QUEUED", label: "Job Queued in Worker" },
              { id: "COLLECTING", label: "Fetching Live GitHub API Evidence" },
              { id: "SCORING", label: "Running 8-Dimension Scoring Engines" },
              { id: "DONE", label: "Generating Repo-Specific Mentor Plan" },
            ].map((step, idx) => {
              const isPassed = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPassed
                        ? "bg-green-500 text-black"
                        : isCurrent
                        ? "bg-indigo-500 text-white animate-pulse"
                        : "bg-neutral-800 text-neutral-500"
                    }`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-sm ${
                      isPassed ? "text-neutral-300 font-medium" : isCurrent ? "text-indigo-400 font-bold" : "text-neutral-600"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Failed State View
  if (analysis.status === "FAILED") {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6">
        <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center max-w-lg">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Analysis Could Not Complete</h2>
          <p className="text-sm text-neutral-400 mb-6">{analysis.errorMessage || "GitHub API limit reached or invalid user."}</p>
          <Link href="/mentor" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium">
            Try Another Username
          </Link>
        </div>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData = Object.values(analysis.dimensions || {}).map((dim: any) => ({
    dimension: dim.label,
    score: dim.score !== null ? dim.score : 0,
  }));

  const evidence = analysis.evidence || {};
  const repos = evidence.repositories || [];
  const mentorPlan = analysis.mentorPlan || { skillGaps: [], weeklyTasks: [] };

  return (
    <div className="min-h-screen bg-neutral-950 text-white pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-medium animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          {toastMessage}
        </div>
      )}

      {/* Top Bar */}
      <div className="border-b border-neutral-800 bg-neutral-900/60 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/mentor" className="p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">@{analysis.githubUsername}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  {analysis.tier}
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Analyzed on {new Date(analysis.requestedAt).toLocaleDateString()} • Verified Live GitHub API Evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/mentor/privacy"
              className="text-xs text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" /> Privacy
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 text-neutral-400 hover:text-red-400 bg-neutral-800/50 hover:bg-red-950/40 rounded-lg transition-colors"
              title="Delete Analysis"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6 flex gap-2 overflow-x-auto border-t border-neutral-800/50">
          {[
            { id: "overview", label: "Overview", icon: Sparkles },
            { id: "developer", label: "Developer Profile", icon: Code },
            { id: "projects", label: "Projects", icon: Layers },
            { id: "reputation", label: "Reputation Gate", icon: Award },
            { id: "progress", label: "Progress History", icon: TrendingUp },
            { id: "career", label: "Mentor Roadmap", icon: CheckSquare, highlight: true },
            { id: "recruiter", label: "Recruiter Intel", icon: Briefcase },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-indigo-500 text-indigo-400 bg-indigo-500/5"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.highlight ? "text-indigo-400" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 p-6 rounded-2xl bg-neutral-900 border border-neutral-800 text-center flex flex-col justify-center items-center relative overflow-hidden">
              <div className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-2">Overall Score</div>
              <div className="text-6xl font-black text-white mb-2">
                {analysis.overallScore !== null ? analysis.overallScore : "N/A"}
              </div>
              <div className="text-sm font-semibold text-indigo-400 mb-4">{analysis.tier} TIER</div>
              <div className="w-full bg-neutral-800 rounded-full h-2 max-w-xs mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                  style={{ width: `${analysis.overallScore || 0}%` }}
                />
              </div>
              <p className="text-xs text-neutral-500 max-w-xs">
                Confidence: {analysis.overallConfidence}% based on public repositories and commit activity.
              </p>
            </div>

            <div className="lg:col-span-2 p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="text-lg font-bold mb-4">8-Dimension Engineering Profile</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="dimension" stroke="#9CA3AF" tick={{ fill: "#9CA3AF", fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4B5563" />
                    <Radar name="Developer Score" dataKey="score" stroke="#818CF8" fill="#6366F1" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Dimension Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.values(analysis.dimensions || {}).map((dim: any) => (
                <div key={dim.dimension} className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-neutral-300">{dim.label}</span>
                    <span className="text-base font-bold text-indigo-400">
                      {dim.score !== null ? `${dim.score}/100` : "No Data"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2">{dim.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DEVELOPER PROFILE TAB */}
        {activeTab === "developer" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{evidence.accountAge || 0} mos</div>
                <div className="text-xs text-neutral-400">Account Age</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{evidence.totalPublicRepos || 0}</div>
                <div className="text-xs text-neutral-400">Public Repos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{evidence.totalStars || 0}</div>
                <div className="text-xs text-neutral-400">Total Stars</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{evidence.commits?.lastYear || 0}</div>
                <div className="text-xs text-neutral-400">Yearly Contributions</div>
              </div>
            </div>

            {/* Languages */}
            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
              <h3 className="text-lg font-bold mb-4">Primary Languages & Stack</h3>
              <div className="space-y-3">
                {Object.entries(evidence.languages?.distribution || {}).map(([lang, pct]: any) => (
                  <div key={lang}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-neutral-200">{lang}</span>
                      <span className="text-neutral-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROJECTS TAB */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mb-4">Analyzed Repositories ({repos.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {repos.map((repo: any) => (
                <div key={repo.name} className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-lg">{repo.name}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      Grade: {repo.grade}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2">{repo.description || "No description provided."}</p>
                  
                  <div className="flex flex-wrap gap-2 text-xs pt-2">
                    <span className={`px-2 py-1 rounded ${repo.hasTests ? "bg-green-950 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>
                      Tests: {repo.hasTests ? "✓" : "✗"}
                    </span>
                    <span className={`px-2 py-1 rounded ${repo.hasCI ? "bg-green-950 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>
                      CI/CD: {repo.hasCI ? "✓" : "✗"}
                    </span>
                    <span className={`px-2 py-1 rounded ${repo.hasDocker ? "bg-green-950 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>
                      Docker: {repo.hasDocker ? "✓" : "✗"}
                    </span>
                    <span className={`px-2 py-1 rounded ${repo.hasReadme ? "bg-green-950 text-green-400" : "bg-neutral-800 text-neutral-500"}`}>
                      README: {repo.hasReadme ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REPUTATION TAB */}
        {activeTab === "reputation" && (
          <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center max-w-2xl mx-auto space-y-4">
            <Award className="w-12 h-12 text-indigo-400 mx-auto" />
            <h3 className="text-2xl font-bold">Reputation Engine</h3>
            {analysis.reputationScore !== null ? (
              <div>
                <div className="text-5xl font-black text-white my-4">{analysis.reputationScore}</div>
                <p className="text-sm text-neutral-400">
                  Reputation is calculated purely from project quality, contribution velocity, and technical excellence. Vanity metrics are excluded.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-yellow-950/40 border border-yellow-500/30 text-yellow-300 text-sm">
                Insufficient public GitHub activity to generate a reputation score. Make more repositories public or add contributions to unlock your reputation rating.
              </div>
            )}
          </div>
        )}

        {/* PROGRESS HISTORY TAB */}
        {activeTab === "progress" && (
          <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-6">
            <h3 className="text-xl font-bold">Historical Score Progression</h3>
            {history.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="createdAt" stroke="#9CA3AF" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                    <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151" }} />
                    <Line type="monotone" dataKey="reputationScore" stroke="#818CF8" strokeWidth={3} dot={{ fill: "#818CF8" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="p-6 text-center text-neutral-400 text-sm">
                Baseline analysis recorded. Re-run your analysis over time after completing mentor tasks to see your progress curve.
              </div>
            )}
          </div>
        )}

        {/* CAREER / MENTOR ROADMAP TAB (CORE TAB) */}
        {activeTab === "career" && (
          <div className="space-y-8">
            {/* Skill Gaps */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                Identified Skill Gaps
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mentorPlan.skillGaps.map((gap: any) => (
                  <div key={gap.skill} className="p-5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{gap.skill}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        gap.priority === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {gap.priority}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      Current Level: <span className="text-white font-semibold">{gap.currentLevel}</span> → Target: <span className="text-indigo-400 font-semibold">{gap.requiredLevel}</span>
                    </div>
                    <p className="text-xs text-neutral-300 pt-2 border-t border-neutral-800/80">
                      {gap.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Weekly Tasks */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-400" />
                Actionable Weekly Tasks (Repo-Specific)
              </h3>
              <div className="space-y-3">
                {mentorPlan.weeklyTasks.map((task: any) => {
                  const isPending = completingTaskIds[task.id];
                  return (
                    <div
                      key={task.id || task.title}
                      className={`p-4 rounded-xl border flex items-start gap-4 transition-all ${
                        task.completed
                          ? "bg-neutral-900/40 border-neutral-800/50 opacity-60"
                          : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      <button
                        onClick={() => !task.completed && handleTaskComplete(task.id)}
                        disabled={task.completed || isPending}
                        className="mt-1 text-neutral-400 hover:text-indigo-400 transition-colors disabled:cursor-not-allowed"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : isPending ? (
                          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        ) : (
                          <Square className="w-6 h-6" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-semibold text-base ${task.completed ? "line-through text-neutral-500" : "text-white"}`}>
                            {task.title}
                          </h4>
                          <span className="text-xs px-2.5 py-0.5 rounded bg-neutral-800 text-neutral-300 font-medium">
                            Week {task.weekNumber} • {task.taskType}
                          </span>
                        </div>
                        <p className="text-xs text-indigo-400 mt-1 font-medium">{task.impactDescription}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* RECRUITER INTEL TAB */}
        {activeTab === "recruiter" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {/* Phase 4 Legal Disclaimer Banner */}
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Legal Disclaimer:</strong> This report is not an automated hiring decision tool. Reputation scores reflect public GitHub activity and engineering artifacts only, and do not evaluate a candidate's full professional capability or demographic background.
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
              <h3 className="text-xl font-bold">Hiring & Engineering Readiness</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xs text-neutral-400">Technical Fit</div>
                  <div className="text-2xl font-bold text-white">{analysis.overallScore || 0}/100</div>
                </div>
                <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800">
                  <div className="text-xs text-neutral-400">Estimated Level</div>
                  <div className="text-2xl font-bold text-indigo-400">{analysis.tier}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
