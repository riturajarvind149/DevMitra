"use client";

import Link from "next/link";
import { Shield, Lock, Eye, Trash2, ArrowLeft } from "lucide-react";

export default function MentorPrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/mentor"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Mentor
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-indigo-400" />
          <h1 className="text-3xl font-extrabold">Data Privacy & Retention Policy</h1>
        </div>

        <div className="space-y-6 text-neutral-300">
          <section className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-2 text-lg font-bold text-white mb-2">
              <Eye className="w-5 h-5 text-indigo-400" />
              What Data We Collect
            </div>
            <p className="text-sm leading-relaxed text-neutral-400">
              When an analysis is requested, the DevMitra AI Mentor Engine fetches public GitHub data via the official GitHub REST & GraphQL APIs. This includes repository metadata (stars, forks, languages, presence of README/CI/Docker files), commit activity counts, public PRs, public issues, and public contribution graph statistics.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-2 text-lg font-bold text-white mb-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Token Security & Storage
            </div>
            <p className="text-sm leading-relaxed text-neutral-400">
              Your GitHub OAuth access token is encrypted at rest using industry-standard **AES-256-GCM** encryption. Access tokens are used strictly to perform server-to-server API calls to analyze your repositories and are never exposed to the client or shared with third parties.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800">
            <div className="flex items-center gap-2 text-lg font-bold text-white mb-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              Right to Delete (GDPR Data Removal)
            </div>
            <p className="text-sm leading-relaxed text-neutral-400">
              You retain full control over your analysis data. You can permanently delete any of your mentor analysis reports at any time directly from the report dashboard or history view. Deleting an analysis cascades to permanently remove all associated dimension scores, skill gaps, mentor tasks, and historical snapshots from our database.
            </p>
          </section>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300">
            Disclaimers: DevMitra AI Mentor scores reflect public GitHub activity and engineering artifacts only. Scores are intended for self-improvement and mentorship and should not be used as automated hiring filters.
          </div>
        </div>
      </div>
    </div>
  );
}
