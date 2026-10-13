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
  Check,
  X,
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
  const analysisId = params.analysisId;

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [history, setHistory] = useState([]);
  const [completingTaskIds, setCompletingTaskIds] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let timer;

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
      } catch (err) {
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

  const handleTaskComplete = async (taskId) => {
    setCompletingTaskIds((prev) => ({ ...prev, [taskId]: true }));
    try {
      await mentorAPI.completeTask(taskId);
      setAnalysis((prev) => {
        if (!prev || !prev.mentorPlan) return prev;
        const updatedTasks = prev.mentorPlan.weeklyTasks.map((t) =>
          t.id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
        );
        return {
          ...prev,
          mentorPlan: { ...prev.mentorPlan, weeklyTasks: updatedTasks },
        };
      });
      setToastMessage("Task marked as complete. Progress updated.");
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
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <p className="text-secondary text-sm font-mono">Loading engineering analysis...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-8 rounded-sm surface-card border border-subtle text-center max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-primary mb-2">Analysis Failed</h2>
          <p className="text-sm text-secondary mb-6">{error || "Could not retrieve analysis report."}</p>
          <Link href="/mentor" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-sm text-black font-semibold text-sm transition">
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
        <div className="max-w-lg w-full p-8 rounded-sm surface-card border border-subtle text-center relative overflow-hidden shadow-sm">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-primary mb-2">Analyzing @{analysis.githubUsername}</h2>
          <p className="text-xs text-muted mb-6 font-mono">
            Fetching repositories, commit velocity, and contribution graph from GitHub API...
          </p>

          <div className="space-y-3 text-left">
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
                    className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-mono font-bold ${
                      isPassed
                        ? "bg-green-500/20 text-green-500 border border-green-500/30"
                        : isCurrent
                        ? "bg-amber-500 text-black animate-pulse"
                        : "surface-input text-muted border border-subtle"
                    }`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </div>
                  <span
                    className={`text-xs font-mono ${
                      isPassed ? "text-secondary font-medium" : isCurrent ? "text-amber-500 font-bold" : "text-muted"
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
        <div className="p-8 rounded-sm surface-card border border-subtle text-center max-w-lg shadow-sm">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-primary mb-2">Analysis Could Not Complete</h2>
          <p className="text-sm text-secondary mb-6">{analysis.errorMessage || "GitHub API limit reached or invalid user."}</p>
          <Link href="/mentor" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 rounded-sm text-black font-semibold text-sm transition">
            Try Another Username
          </Link>
        </div>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData = Object.values(analysis.dimensions || {}).map((dim) => ({
    dimension: dim.label,
    score: dim.score !== null ? dim.score : 0,
  }));

  const evidence = analysis.evidence || {};
  const repos = evidence.repositories || [];
  const mentorPlan = analysis.mentorPlan || { skillGaps: [], weeklyTasks: [] };
  const completedCount = mentorPlan.weeklyTasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 surface-card border border-amber-500/40 text-primary px-4 py-3 rounded-sm shadow-lg flex items-center gap-2 text-xs font-mono font-medium">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="surface-card border border-subtle rounded-sm p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/mentor" className="p-2 rounded-sm surface-input hover:border-amber-500/40 border border-subtle text-secondary hover:text-primary transition-colors">
            <ArrowLeft className="w-4 h-4 text-amber-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-primary">@{analysis.githubUsername}</h1>
              <span className="px-2 py-0.5 rounded-sm text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                {analysis.tier} TIER
              </span>
            </div>
            <p className="text-xs text-muted font-mono mt-1">
              Analyzed on {new Date(analysis.requestedAt).toLocaleDateString()} • Live GitHub API Evidence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/mentor/privacy"
            className="text-xs text-secondary hover:text-primary transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-sm surface-input border border-subtle font-mono"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" /> Privacy & Policy
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 text-muted hover:text-red-500 surface-input hover:bg-red-500/10 border border-subtle rounded-sm transition-colors"
            title="Delete Analysis"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto p-1 surface-card border border-subtle rounded-sm">
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
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-3.5 rounded-sm text-xs font-mono font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive
                  ? "bg-amber-500 text-black"
                  : "text-secondary hover:text-primary hover:bg-amber-500/10"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.highlight && !isActive ? "text-amber-500" : ""}`} />
              {tab.label}
              {tab.id === "career" && mentorPlan.weeklyTasks?.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-sm text-[10px] font-mono ${
                  isActive ? "bg-black/20 text-black" : "bg-amber-500/15 text-amber-500"
                }`}>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="lg:col-span-1 p-6 rounded-sm surface-card border border-subtle text-center flex flex-col justify-center items-center relative overflow-hidden shadow-sm">
              <div className="text-[11px] uppercase tracking-wider font-mono font-semibold text-muted mb-2">Overall Score</div>
              <div className="text-6xl font-extrabold text-primary mb-2 font-mono tracking-tight">
                {analysis.overallScore !== null ? analysis.overallScore : "N/A"}
              </div>
              <div className="text-xs font-mono font-bold text-amber-500 mb-4">{analysis.tier} TIER</div>
              <div className="w-full surface-input rounded-sm h-2.5 max-w-xs mb-4 overflow-hidden border border-subtle">
                <div
                  className="bg-amber-500 h-full rounded-sm transition-all duration-1000"
                  style={{ width: `${analysis.overallScore || 0}%` }}
                />
              </div>
              <p className="text-xs text-secondary max-w-xs leading-relaxed font-mono">
                Confidence: <span className="font-bold text-primary">{analysis.overallConfidence}%</span> based on public repositories and commit velocity.
              </p>
            </div>

            {/* Radar Chart */}
            <div className="lg:col-span-2 p-5 rounded-sm surface-card border border-subtle shadow-sm flex flex-col justify-between">
              <h3 className="text-sm font-semibold text-primary mb-2 font-mono">8-Dimension Engineering Profile</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(156, 163, 175, 0.2)" />
                    <PolarAngleAxis dataKey="dimension" tick={{ fill: "currentColor", fontSize: 11, fontWeight: 500 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(156, 163, 175, 0.2)" />
                    <Radar name="Developer Score" dataKey="score" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 8 Dimension Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(analysis.dimensions || {}).map((dim) => (
              <div key={dim.dimension} className="p-4 rounded-sm surface-card border border-subtle space-y-2 hover:border-amber-500/30 transition shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-primary">{dim.label}</span>
                  <span className="text-sm font-mono font-bold text-amber-500">
                    {dim.score !== null ? `${dim.score}/100` : "N/A"}
                  </span>
                </div>
                <div className="w-full surface-input rounded-sm h-1.5 overflow-hidden border border-subtle">
                  <div
                    className="bg-amber-500 h-full rounded-sm"
                    style={{ width: `${dim.score || 0}%` }}
                  />
                </div>
                <p className="text-[11px] text-secondary line-clamp-2 pt-1">{dim.reason}</p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined" && window.__openMentorChat) {
                        window.__openMentorChat(
                          `Why did I get ${dim.score !== null ? `${dim.score}/100` : "this score"} in ${dim.label}?`,
                          analysisId
                        );
                      }
                    }}
                    className="text-[11px] font-mono text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Ask AI why →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MENTOR ROADMAP TAB (CORE TAB) */}
      {activeTab === "career" && (
        <div className="space-y-6">
          {/* Skill Gaps */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-primary flex items-center gap-2 font-mono">
              <BookOpen className="w-4 h-4 text-amber-500" />
              Identified Skill Gaps & Diagnosis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mentorPlan.skillGaps.map((gap) => (
                <div key={gap.skill} className="p-4 rounded-sm surface-card border border-subtle space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-primary">{gap.skill}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-sm font-mono font-bold uppercase ${
                      gap.priority === 'HIGH' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                    }`}>
                      {gap.priority}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted font-mono">
                    Current Level: <span className="text-primary font-semibold">{gap.currentLevel}</span> → Target: <span className="text-amber-500 font-semibold">{gap.requiredLevel}</span>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed pt-2 border-t border-subtle">
                    {gap.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Weekly Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-primary flex items-center gap-2 font-mono">
                <CheckSquare className="w-4 h-4 text-amber-500" />
                Actionable Weekly Tasks (Repo-Specific)
              </h3>
              <span className="text-xs text-muted font-mono">
                Completed: {completedCount} / {mentorPlan.weeklyTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {mentorPlan.weeklyTasks.map((task) => {
                const isPending = completingTaskIds[task.id];
                return (
                  <div
                    key={task.id || task.title}
                    className={`p-4 rounded-sm border flex items-start gap-3 transition-all shadow-sm ${
                      task.completed
                        ? "surface-card border-subtle opacity-60"
                        : "surface-card border-subtle hover:border-amber-500/30"
                    }`}
                  >
                    <button
                      onClick={() => !task.completed && handleTaskComplete(task.id)}
                      disabled={task.completed || isPending}
                      className="mt-0.5 text-muted hover:text-amber-500 transition-colors disabled:cursor-not-allowed"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : isPending ? (
                        <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                      ) : (
                        <Square className="w-5 h-5 text-muted hover:text-amber-500" />
                      )}
                    </button>

                    <div className="flex-1 space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <h4 className={`font-semibold text-xs sm:text-sm ${task.completed ? "line-through text-muted" : "text-primary"}`}>
                          {task.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-sm surface-input border border-subtle text-secondary font-mono w-fit">
                          Week {task.weekNumber} • {task.taskType}
                        </span>
                      </div>
                      <p className="text-xs text-amber-500 font-mono">{task.impactDescription}</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-4 rounded-sm surface-card border border-subtle text-center">
              <div className="text-2xl font-bold font-mono text-primary">{evidence.accountAge || 0} mos</div>
              <div className="text-xs text-muted font-mono mt-1">Account Age</div>
            </div>
            <div className="p-4 rounded-sm surface-card border border-subtle text-center">
              <div className="text-2xl font-bold font-mono text-primary">{evidence.totalPublicRepos || 0}</div>
              <div className="text-xs text-muted font-mono mt-1">Original Repos</div>
            </div>
            <div className="p-4 rounded-sm surface-card border border-subtle text-center">
              <div className="text-2xl font-bold font-mono text-amber-500">{evidence.totalContributedRepos || 0}</div>
              <div className="text-xs text-muted font-mono mt-1">Contributed To</div>
            </div>
            <div className="p-4 rounded-sm surface-card border border-subtle text-center">
              <div className="text-2xl font-bold font-mono text-primary">{evidence.totalStars || 0}</div>
              <div className="text-xs text-muted font-mono mt-1">Stars (Owned)</div>
            </div>
            <div className="p-4 rounded-sm surface-card border border-subtle text-center">
              <div className="text-2xl font-bold font-mono text-primary">{evidence.commits?.lastYear || 0}</div>
              <div className="text-xs text-muted font-mono mt-1">Yearly Contributions</div>
            </div>
          </div>

          <div className="p-5 rounded-sm surface-card border border-subtle space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-primary font-mono">Language Distribution</h3>
            <div className="space-y-3">
              {Object.entries(evidence.languages?.distribution || {}).map(([lang, pct]) => (
                <div key={lang}>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-primary font-medium">{lang}</span>
                    <span className="text-muted">{pct}%</span>
                  </div>
                  <div className="w-full surface-input rounded-sm h-2 overflow-hidden border border-subtle">
                    <div className="bg-amber-500 h-full rounded-sm" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PROJECTS TAB */}
      {activeTab === "projects" && (() => {
        const contributions = evidence.contributions || [];
        return (
          <div className="space-y-6">
            {/* MY PROJECTS (Owned Repos) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-primary flex items-center gap-2 font-mono">
                  <Layers className="w-4 h-4 text-amber-500" />
                  My Projects ({repos.length})
                </h3>
                <span className="text-xs text-muted font-mono">Only original repositories • Used for scoring</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {repos.map((repo) => (
                  <div key={repo.name} className="p-4 rounded-sm surface-card border border-subtle space-y-2 shadow-sm hover:border-amber-500/30 transition group">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary text-sm group-hover:text-amber-500 transition">{repo.name}</span>
                      <span className="px-2 py-0.5 rounded-sm text-xs font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                        Grade: {repo.grade}
                      </span>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed line-clamp-2">{repo.description || "No description provided."}</p>
                    <div className="flex flex-wrap gap-1.5 text-[11px] pt-1">
                      <span className={`px-2 py-0.5 rounded-sm font-mono font-medium flex items-center gap-1 ${repo.hasTests ? "bg-green-500/10 text-green-500 border border-green-500/20" : "surface-input text-muted border border-subtle"}`}>
                        {repo.hasTests ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Tests
                      </span>
                      <span className={`px-2 py-0.5 rounded-sm font-mono font-medium flex items-center gap-1 ${repo.hasCI ? "bg-green-500/10 text-green-500 border border-green-500/20" : "surface-input text-muted border border-subtle"}`}>
                        {repo.hasCI ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} CI/CD
                      </span>
                      <span className={`px-2 py-0.5 rounded-sm font-mono font-medium flex items-center gap-1 ${repo.hasDocker ? "bg-green-500/10 text-green-500 border border-green-500/20" : "surface-input text-muted border border-subtle"}`}>
                        {repo.hasDocker ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Docker
                      </span>
                      <span className={`px-2 py-0.5 rounded-sm font-mono font-medium flex items-center gap-1 ${repo.hasReadme ? "bg-green-500/10 text-green-500 border border-green-500/20" : "surface-input text-muted border border-subtle"}`}>
                        {repo.hasReadme ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} README
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {repos.length === 0 && (
                <div className="p-8 rounded-sm surface-card border border-subtle text-center">
                  <p className="text-xs text-muted font-mono">No original repositories found. Create a public repository on GitHub to start building your profile.</p>
                </div>
              )}
            </div>

            {/* OPEN SOURCE CONTRIBUTIONS (Forked Repos) */}
            {contributions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2 font-mono">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Open Source Contributions ({contributions.length})
                  </h3>
                  <span className="text-xs text-muted font-mono">Forked repos • Not counted in reputation score</span>
                </div>

                <div className="p-3 rounded-sm surface-input border border-subtle text-secondary text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>These are projects you forked to contribute to. Only your personal commits and PRs are tracked here. The upstream project&apos;s quality does not affect your reputation score.</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {contributions.map((contrib) => {
                    const gradeColors = {
                      'A': 'bg-green-500/10 text-green-500 border-green-500/20',
                      'A+': 'bg-green-500/10 text-green-500 border-green-500/20',
                      'B+': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                      'B': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                      'C': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
                      'D': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
                      'F': 'bg-red-500/10 text-red-500 border-red-500/20',
                    };
                    const gradeStyle = gradeColors[contrib.contributionGrade] || gradeColors['C'];

                    return (
                      <div key={contrib.name} className="p-4 rounded-sm surface-card border border-subtle space-y-2 hover:border-amber-500/30 transition">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                Contributed
                              </span>
                              <span className="font-semibold text-primary truncate text-xs">{contrib.name}</span>
                            </div>
                            <p className="text-[11px] text-muted mt-1 truncate font-mono">
                              from <span className="text-secondary font-medium">{contrib.parentFullName}</span>
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-sm text-xs font-mono font-bold border shrink-0 ml-2 ${gradeStyle}`}>
                            {contrib.contributionGrade}
                          </span>
                        </div>

                        <p className="text-xs text-secondary line-clamp-2">{contrib.description || "No description."}</p>

                        <div className="flex items-center gap-4 text-xs pt-1 border-t border-subtle font-mono">
                          <div className="flex items-center gap-1.5">
                            <Code className="w-3.5 h-3.5 text-muted" />
                            <span className="text-primary font-semibold">{contrib.userCommits}</span>
                            <span className="text-muted">commits</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-muted" />
                            <span className="text-primary font-semibold">{contrib.userPRs || 0}</span>
                            <span className="text-muted">PRs</span>
                          </div>
                          <div className="flex items-center gap-1.5 ml-auto">
                            <span className="text-muted">{contrib.language}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* REPUTATION TAB */}
      {activeTab === "reputation" && (
        <div className="p-8 rounded-sm surface-card border border-subtle text-center max-w-xl mx-auto space-y-4 shadow-sm">
          <Award className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-xl font-bold text-primary font-mono">Reputation Engine</h3>
          {analysis.reputationScore !== null ? (
            <div>
              <div className="text-5xl font-extrabold text-primary my-4 font-mono tracking-tight">{analysis.reputationScore}</div>
              <p className="text-xs text-secondary leading-relaxed">
                Reputation is calculated purely from engineering quality, contribution velocity, and technical excellence. Vanity metrics are excluded.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-sm bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-mono">
              Insufficient public GitHub activity to generate a reputation score. Make more repositories public or add contributions to unlock your reputation rating.
            </div>
          )}
        </div>
      )}

      {/* PROGRESS HISTORY TAB */}
      {activeTab === "progress" && (
        <div className="p-5 rounded-sm surface-card border border-subtle space-y-4 shadow-sm">
          <h3 className="text-sm font-semibold text-primary font-mono">Historical Score Progression</h3>
          {history.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(156, 163, 175, 0.2)" />
                  <XAxis dataKey="createdAt" stroke="currentColor" tickFormatter={(val) => new Date(val).toLocaleDateString()} />
                  <YAxis domain={[0, 100]} stroke="currentColor" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-subtle)", borderRadius: "4px" }} />
                  <Line type="monotone" dataKey="reputationScore" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="p-6 text-center text-muted text-xs font-mono">
              Baseline analysis recorded. Re-run your analysis over time after completing mentor tasks to see your progress curve.
            </div>
          )}
        </div>
      )}

      {/* RECRUITER INTEL TAB */}
      {activeTab === "recruiter" && (
        <div className="space-y-4 max-w-2xl mx-auto">
          <div className="p-4 rounded-sm surface-input border border-amber-500/30 text-secondary text-xs flex items-start gap-3 shadow-sm">
            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-primary font-mono">Legal Disclaimer:</strong> This report is not an automated hiring decision tool. Reputation scores reflect public GitHub activity and engineering artifacts only, and do not evaluate a candidate's full professional capability.
            </div>
          </div>

          <div className="p-5 rounded-sm surface-card border border-subtle space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-primary font-mono">Hiring & Engineering Readiness</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-sm surface-input border border-subtle">
                <div className="text-xs text-muted font-mono">Technical Fit</div>
                <div className="text-2xl font-bold font-mono text-primary">{analysis.overallScore || 0}/100</div>
              </div>
              <div className="p-4 rounded-sm surface-input border border-subtle">
                <div className="text-xs text-muted font-mono">Estimated Level</div>
                <div className="text-2xl font-bold font-mono text-amber-500">{analysis.tier}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
