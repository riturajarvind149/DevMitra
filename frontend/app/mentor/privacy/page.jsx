"use client";

import Link from "next/link";
import { Shield, Lock, Eye, Trash2, ArrowLeft } from "lucide-react";

export default function MentorPrivacyPage() {
  return (
    <div className="min-h-screen surface-base text-primary px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/mentor"
          className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary mb-8 transition-colors font-mono"
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" /> Back to Mentor
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-7 h-7 text-amber-500" />
          <h1 className="text-2xl font-bold tracking-tight text-primary">Data Privacy & Retention Policy</h1>
        </div>

        <div className="space-y-6 text-secondary">
          <section className="p-6 rounded-sm surface-card border border-subtle">
            <div className="flex items-center gap-2 text-base font-semibold text-primary mb-2">
              <Eye className="w-4 h-4 text-amber-500" />
              What Data We Collect
            </div>
            <p className="text-sm leading-relaxed text-secondary">
              When an analysis is requested, the DevMitra AI Mentor Engine fetches public GitHub data via the official GitHub REST & GraphQL APIs. This includes repository metadata (stars, forks, languages, presence of README/CI/Docker files), commit activity counts, public PRs, public issues, and public contribution graph statistics.
            </p>
          </section>

          <section className="p-6 rounded-sm surface-card border border-subtle">
            <div className="flex items-center gap-2 text-base font-semibold text-primary mb-2">
              <Lock className="w-4 h-4 text-amber-500" />
              Token Security & Storage
            </div>
            <p className="text-sm leading-relaxed text-secondary">
              Your GitHub OAuth access token is encrypted at rest using industry-standard <strong className="text-primary font-mono">AES-256-GCM</strong> encryption. Access tokens are used strictly to perform server-to-server API calls to analyze your repositories and are never exposed to the client or shared with third parties.
            </p>
          </section>

          <section className="p-6 rounded-sm surface-card border border-subtle">
            <div className="flex items-center gap-2 text-base font-semibold text-primary mb-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Right to Delete (GDPR Data Removal)
            </div>
            <p className="text-sm leading-relaxed text-secondary">
              You retain full control over your analysis data. You can permanently delete any of your mentor analysis reports at any time directly from the report dashboard or history view. Deleting an analysis cascades to permanently remove all associated dimension scores, skill gaps, mentor tasks, and historical snapshots from our database.
            </p>
          </section>

          <div className="p-4 rounded-sm surface-input border border-subtle text-xs text-muted">
            <span className="font-semibold text-primary">Disclaimers:</span> DevMitra AI Mentor scores reflect public GitHub activity and engineering artifacts only. Scores are intended for self-improvement and mentorship and should not be used as automated hiring filters.
          </div>
        </div>
      </div>
    </div>
  );
}
