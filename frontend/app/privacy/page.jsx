import Link from "next/link";
import { TerminalIcon, ShieldIcon } from "@/components/icons";

export const metadata = {
  title: "Privacy Policy : DevMitra",
  description: "Privacy policy and data governance practices for DevMitra.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 font-sans text-gray-200">
      <div className="border-b border-[#20293b] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
          <ShieldIcon className="h-4 w-4" />
          <span>DATA GOVERNANCE : PRIVACY POLICY</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 font-mono">Privacy Policy</h1>
        <p className="text-xs text-gray-400">Effective Date: October 2026</p>
      </div>

      <div className="space-y-6 text-xs leading-relaxed text-gray-300">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">1. Information We Collect</h2>
          <p>
            When you authenticate with GitHub, we collect your GitHub user ID, username, email address,
            avatar URL, and public repository metadata required for profile generation and AI Mentor
            scoring. We encrypt OAuth access tokens securely on the server.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">2. Use of Your Data</h2>
          <p>
            Your information is used solely to provide platform services, maintain collaboration history,
            calculate streak activity, route notifications, and provide AI mentoring. We do not sell your
            personal data or repository code to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">3. Cookies & Local Storage</h2>
          <p>
            We use secure HTTP-only cookies for session authentication and browser local storage for
            ephemeral story view tracking and user UI preferences (such as dark or technical light theme).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">4. Data Deletion & Privacy Rights</h2>
          <p>
            You can delete your DevMitra account and all associated records at any time from your account
            Settings page. Deleting your account purges your profile, stories, and activity logs.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-[#20293b]">
        <Link
          href="/"
          className="text-xs font-mono text-amber-400 hover:underline"
        >
          &larr; Return to Workstation Feed
        </Link>
      </div>
    </div>
  );
}
