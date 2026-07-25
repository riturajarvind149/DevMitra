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
  GitBranch,
  Star,
  GitFork,
  Check,
  X,
  Zap,
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
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-medium">Loading analysis report...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 text-center max-w-md shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
          <p className="text-sm text-gray-400 mb-6">{error || "Could not retrieve analysis report."}</p>
          <Link href="/mentor" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium text-sm transition">
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
      <div className="py-12 flex flex-col items-center justify-center">
        <div className="max-w-lg w-full p-8 rounded-3xl bg-gray-900 border border-gray-800 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-purple-600/10 opacity-50 blur-2xl" />
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-6 relative z-10" />
          <h2 className="text-2xl font-black text-white mb-2 relative z-10">Analyzing @{analysis.githubUsername}</h2>
          <p className="text-xs text-gray-400 mb-8 relative z-10">
            Fetching repositories, commit velocity, and contribution graph from GitHub API...
          </p>

          <div className="space-y-4 relative z-10 text-left">
            {[
              { id: "QUEUED", label: "Job Queued in Background Worker" },
              { id: "COLLECTING", label: "Fetching Live GitHub API Evidence" },
              { id: "SCORING", label: "Running 8-Dimension Scoring Engines" },
              { id: "DONE", label: "Generating Repo-Specific Mentor Plan" },
            ].map((step, idx) => {
              const isPassed = currentStepIdx > idx;
              const isCurrent = currentStepIdx === idx;
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${
                      isPassed
                        ? "bg-green-500 text-black"
                        : isCurrent
                        ? "bg-indigo-600 text-white animate-pulse"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-sm ${
                      isPassed ? "text-gray-300 font-medium" : isCurrent ? "text-indigo-400 font-bold" : "text-gray-600"
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
      <div className="py-16 flex flex-col items-center justify-center">
        <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800 text-center max-w-lg shadow-2xl">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Analysis Could Not Complete</h2>
          <p className="text-sm text-gray-400 mb-6">{analysis.errorMessage || "GitHub API limit reached or invalid user."}</p>
          <Link href="/mentor" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-bold text-sm transition">
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
  const completedCount = mentorPlan.weeklyTasks.filter((t: any) => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-green-300" />
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-gray-900/90 border border-gray-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/mentor" className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-white">@{analysis.githubUsername}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {analysis.tier} TIER
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Analyzed on {new Date(analysis.requestedAt).toLocaleDateString()} • Live GitHub API Evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/mentor/privacy"
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/50"
          >
            <Shield className="w-4 h-4 text-indigo-400" /> Privacy & Policy
          </Link>
          <button
            onClick={handleDelete}
            className="p-2.5 text-gray-400 hover:text-red-400 bg-gray-800/60 hover:bg-red-950/40 border border-gray-700/50 rounded-xl transition-colors"
            title="Delete Analysis"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto p-1.5 bg-gray-900/80 border border-gray-800 rounded-2xl">
        {[
          { id: "overview", label: "Overview", icon: Sparkles },
          { id: "career", label: "Mentor Roadmap", icon: CheckSquare, highlight: true },
          { id: "developer", label: "Developer Profile", icon: Code },
          { id: "projects", label: "Projects", icon: Layers },
          { id: "reputation", label: "Reputation Gate", icon: Award },
          { id: "progress", label: "Progress History", icon: TrendingUp },
          { id: "recruiter", label: "Recruiter Intel", icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.highlight && !isActive ? "text-indigo-400" : ""}`} />
              {tab.label}
              {tab.id === "career" && mentorPlan.weeklyTasks?.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-950 text-indigo-300 font-mono">
                  {completedCount}/{mentorPlan.weeklyTasks.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="lg:col-span-1 p-8 rounded-3xl bg-gray-900 border border-gray-800 text-center flex flex-col justify-center items-center relative overflow-hidden shadow-xl">
              <div className="text-xs uppercase tracking-widest font-extrabold text-gray-400 mb-2">Overall Score</div>
              <div className="text-7xl font-black text-white mb-2 tracking-tight">
                {analysis.overallScore !== null ? analysis.overallScore : "N/A"}
              </div>
              <div className="text-sm font-extrabold text-indigo-400 mb-4">{analysis.tier} TIER</div>
              <div className="w-full bg-gray-800 rounded-full h-3 max-w-xs mb-4 overflow-hidden p-0.5 border border-gray-700">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${analysis.overallScore || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Confidence: <span className="font-bold text-white">{analysis.overallConfidence}%</span> based on public repositories and commit velocity.
              </p>
            </div>

            {/* Radar Chart */}
            <div className="lg:col-span-2 p-6 rounded-3xl bg-gray-900 border border-gray-800 shadow-xl flex flex-col justify-between">
              <h3 className="text-base font-bold text-white mb-2">8-Dimension Engineering Profile</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="dimension" stroke="#9CA3AF" tick={{ fill: "#D1D5DB", fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4B5563" />
                    <Radar name="Developer Score" dataKey="score" stroke="#818CF8" fill="#6366F1" fillOpacity={0.35} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 8 Dimension Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(analysis.dimensions || {}).map((dim: any) => (
              <div key={dim.dimension} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-2 hover:border-gray-700 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-gray-200">{dim.label}</span>
                  <span className="text-base font-black text-indigo-400">
                    {dim.score !== null ? `${dim.score}/100` : "No Data"}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full"
                    style={{ width: `${dim.score || 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 pt-1">{dim.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MENTOR ROADMAP TAB (CORE TAB) */}
      {activeTab === "career" && (
        <div className="space-y-8">
          {/* Skill Gaps */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Identified Skill Gaps & Diagnosis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mentorPlan.skillGaps.map((gap: any) => (
                <div key={gap.skill} className="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{gap.skill}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase ${
                      gap.priority === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {gap.priority}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Current Level: <span className="text-white font-bold">{gap.currentLevel}</span> → Target: <span className="text-indigo-400 font-bold">{gap.requiredLevel}</span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed pt-2 border-t border-gray-800">
                    {gap.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Weekly Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-green-400" />
                Actionable Weekly Tasks (Repo-Specific)
              </h3>
              <span className="text-xs text-gray-400 font-semibold">
                Completed: {completedCount} / {mentorPlan.weeklyTasks.length}
              </span>
            </div>

            <div className="space-y-3">
              {mentorPlan.weeklyTasks.map((task: any) => {
                const isPending = completingTaskIds[task.id];
                return (
                  <div
                    key={task.id || task.title}
                    className={`p-5 rounded-2xl border flex items-start gap-4 transition-all shadow-md ${
                      task.completed
                        ? "bg-gray-900/40 border-gray-800/50 opacity-60"
                        : "bg-gray-900 border-gray-800 hover:border-gray-700"
                    }`}
                  >
                    <button
                      onClick={() => !task.completed && handleTaskComplete(task.id)}
                      disabled={task.completed || isPending}
                      className="mt-0.5 text-gray-400 hover:text-indigo-400 transition-colors disabled:cursor-not-allowed"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : isPending ? (
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-500 hover:text-indigo-400" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className={`font-bold text-sm sm:text-base ${task.completed ? "line-through text-gray-500" : "text-white"}`}>
                          {task.title}
                        </h4>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 font-semibold w-fit">
                          Week {task.weekNumber} • {task.taskType}
                        </span>
                      </div>
                      <p className="text-xs text-indigo-400 font-medium">{task.impactDescription}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* DEVELOPER PROFILE TAB */}
      {activeTab === "developer" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 text-center">
              <div className="text-3xl font-black text-white">{evidence.accountAge || 0} mos</div>
              <div className="text-xs text-gray-400 mt-1">Account Age</div>
            </div>
            <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 text-center">
              <div className="text-3xl font-black text-white">{evidence.totalPublicRepos || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Public Repos</div>
            </div>
            <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 text-center">
              <div className="text-3xl font-black text-white">{evidence.totalStars || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Total Stars</div>
            </div>
            <div className="p-5 rounded-2xl bg-gray-900 border border-gray-800 text-center">
              <div className="text-3xl font-black text-white">{evidence.commits?.lastYear || 0}</div>
              <div className="text-xs text-gray-400 mt-1">Yearly Contributions</div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white">Language Distribution</h3>
            <div className="space-y-3">
              {Object.entries(evidence.languages?.distribution || {}).map(([lang, pct]: any) => (
                <div key={lang}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-200">{lang}</span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
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
          <h3 className="text-lg font-bold text-white mb-2">Analyzed Repositories ({repos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.map((repo: any) => (
              <div key={repo.name} className="p-6 rounded-2xl bg-gray-900 border border-gray-800 space-y-3 shadow-lg hover:border-gray-700 transition">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-lg">{repo.name}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Grade: {repo.grade}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{repo.description || "No description provided."}</p>

                <div className="flex flex-wrap gap-2 text-xs pt-2">
                  <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${repo.hasTests ? "bg-green-950/80 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500"}`}>
                    {repo.hasTests ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Tests
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${repo.hasCI ? "bg-green-950/80 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500"}`}>
                    {repo.hasCI ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} CI/CD
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${repo.hasDocker ? "bg-green-950/80 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500"}`}>
                    {repo.hasDocker ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Docker
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${repo.hasReadme ? "bg-green-950/80 text-green-400 border border-green-500/30" : "bg-gray-800 text-gray-500"}`}>
                    {repo.hasReadme ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} README
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REPUTATION TAB */}
      {activeTab === "reputation" && (
        <div className="p-8 rounded-3xl bg-gray-900 border border-gray-800 text-center max-w-xl mx-auto space-y-4 shadow-2xl">
          <Award className="w-12 h-12 text-indigo-400 mx-auto" />
          <h3 className="text-2xl font-black text-white">Reputation Engine</h3>
          {analysis.reputationScore !== null ? (
            <div>
              <div className="text-6xl font-black text-white my-4 tracking-tight">{analysis.reputationScore}</div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Reputation is calculated purely from engineering quality, contribution velocity, and technical excellence. Vanity metrics are excluded.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-yellow-950/40 border border-yellow-500/30 text-yellow-300 text-xs">
              Insufficient public GitHub activity to generate a reputation score. Make more repositories public or add contributions to unlock your reputation rating.
            </div>
          )}
        </div>
      )}

      {/* PROGRESS HISTORY TAB */}
      {activeTab === "progress" && (
        <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-6 shadow-xl">
          <h3 className="text-base font-bold text-white">Historical Score Progression</h3>
          {history.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="createdAt" stroke="#9CA3AF" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                  <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: "#111827", borderColor: "#374151", borderRadius: "12px" }} />
                  <Line type="monotone" dataKey="reputationScore" stroke="#818CF8" strokeWidth={3} dot={{ fill: "#818CF8", r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-6 text-center text-gray-400 text-xs">
              Baseline analysis recorded. Re-run your analysis over time after completing mentor tasks to see your progress curve.
            </div>
          )}
        </div>
      )}

      {/* RECRUITER INTEL TAB */}
      {activeTab === "recruiter" && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 shadow-lg">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Legal Disclaimer:</strong> This report is not an automated hiring decision tool. Reputation scores reflect public GitHub activity and engineering artifacts only, and do not evaluate a candidate's full professional capability.
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gray-900 border border-gray-800 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white">Hiring & Engineering Readiness</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800">
                <div className="text-xs text-gray-400">Technical Fit</div>
                <div className="text-2xl font-black text-white">{analysis.overallScore || 0}/100</div>
              </div>
              <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800">
                <div className="text-xs text-gray-400">Estimated Level</div>
                <div className="text-2xl font-black text-indigo-400">{analysis.tier}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
