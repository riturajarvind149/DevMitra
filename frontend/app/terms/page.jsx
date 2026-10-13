import Link from "next/link";
import { TerminalIcon, ShieldIcon } from "@/components/icons";

export const metadata = {
  title: "Terms of Service : DevMitra",
  description: "Terms and conditions for using DevMitra developer platform.",
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 space-y-8 font-sans text-gray-200">
      <div className="border-b border-[#20293b] pb-6 space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
          <TerminalIcon className="h-4 w-4" />
          <span>LEGAL PROTOCOL : TERMS OF SERVICE</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-100 font-mono">Terms of Service</h1>
        <p className="text-xs text-gray-400">Effective Date: October 2026</p>
      </div>

      <div className="space-y-6 text-xs leading-relaxed text-gray-300">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">1. Platform Purpose</h2>
          <p>
            DevMitra is an open collaboration network built for developers to showcase repositories,
            collaborate on software bugs, review pull requests, and connect with other engineers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">2. User Accounts & GitHub Auth</h2>
          <p>
            Users authenticate via GitHub OAuth. By authenticating, you authorize DevMitra to retrieve
            public repository metadata and profile metrics solely for engineering audit and collaboration
            purposes. You are responsible for safeguarding your credentials and access permissions.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">3. Code of Conduct & Intellectual Property</h2>
          <p>
            You retain all rights to any code, repositories, and media you submit. You agree not to post
            malicious code, secrets, unauthorized copyrighted material, or engage in abusive conduct
            towards other community members.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">4. AI Audit & Reputation Engine</h2>
          <p>
            AI Mentor reputation scores are algorithmic approximations based on factual static analysis
            and evidence collected from public GitHub repositories. Scores are indicative tools for
            growth and do not constitute formal employment certifications.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-gray-100 font-mono uppercase">5. Contact & Inquiries</h2>
          <p>
            For legal inquiries, terms clarification, or platform issues, please file an issue or contact
            support through the official DevMitra repository.
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
