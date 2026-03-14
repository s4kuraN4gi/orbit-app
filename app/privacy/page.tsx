import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Orbit',
  description: 'Orbit Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-bold text-xl">Orbit</span>
        </Link>
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-6 pt-16 pb-20">
        <div className="max-w-3xl mx-auto text-slate-700 dark:text-slate-300">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-12">
            Last updated: March 15, 2026
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              1. Introduction
            </h2>
            <p className="leading-relaxed mb-4">
              This Privacy Policy describes how [Your Company] (&quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;) collects, uses, and protects your information when you use the
              Orbit service (&quot;Service&quot;), including the web dashboard, CLI tool, and
              API.
            </p>
            <p className="leading-relaxed">
              By using the Service, you consent to the practices described in this
              policy. If you do not agree, please discontinue use of the Service.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              2. Information We Collect
            </h2>

            <h3 className="text-lg font-semibold mt-6 mb-3 text-slate-900 dark:text-white">
              2.1 Account Information
            </h3>
            <p className="leading-relaxed mb-4">
              When you create an account, we collect your email address and
              password (hashed). If you sign up via a third-party provider, we
              receive your name, email, and profile image from that provider.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3 text-slate-900 dark:text-white">
              2.2 Project Metadata
            </h3>
            <p className="leading-relaxed mb-4">
              When you use the Orbit CLI with the{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm">-g</code>{' '}
              flag to sync scan results, we store project metadata including: file
              names, directory structure, import/export relationships, route
              definitions, database table names, and task summaries.{' '}
              <strong className="text-slate-900 dark:text-white">
                We do not store your source code.
              </strong>
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3 text-slate-900 dark:text-white">
              2.3 Usage Data
            </h3>
            <p className="leading-relaxed mb-4">
              We collect anonymous usage analytics to improve the Service,
              including pages visited, features used, browser type, and device
              information. This data is collected via PostHog and is not linked to
              your account unless you are logged in.
            </p>

            <h3 className="text-lg font-semibold mt-6 mb-3 text-slate-900 dark:text-white">
              2.4 Payment Information
            </h3>
            <p className="leading-relaxed">
              Payment processing is handled entirely by Stripe. We do not store
              your credit card number or bank details. We retain your Stripe
              customer ID and subscription status to manage your plan.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              3. How We Use Your Information
            </h2>
            <p className="leading-relaxed mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
              <li>Provide, maintain, and improve the Service.</li>
              <li>
                Authenticate your identity and manage your account (via Better
                Auth).
              </li>
              <li>Process payments and manage subscriptions (via Stripe).</li>
              <li>
                Send transactional communications (account verification, billing
                receipts, security alerts).
              </li>
              <li>
                Analyze usage patterns to improve performance and user experience
                (via PostHog).
              </li>
              <li>Detect and prevent fraud or abuse.</li>
            </ul>
            <p className="leading-relaxed">
              We do <strong className="text-slate-900 dark:text-white">not</strong> sell
              your personal information to third parties. We do{' '}
              <strong className="text-slate-900 dark:text-white">not</strong> use your
              project data to train AI models.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              4. Cookies and Tracking
            </h2>
            <p className="leading-relaxed mb-4">
              The Service uses the following cookies and tracking technologies:
            </p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed">
              <li>
                <strong className="text-slate-900 dark:text-white">Session cookies</strong> — Essential
                for authentication. Managed by Better Auth. These expire when you
                log out or after the session timeout.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Theme preference</strong> — A local
                storage item (&quot;orbit-theme&quot;) to remember your dark/light mode
                preference.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Analytics</strong> — PostHog may set
                cookies or use local storage for anonymous usage analytics. You can
                opt out of PostHog tracking in your browser settings or by using a
                Do Not Track header.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              5. Third-Party Services
            </h2>
            <p className="leading-relaxed mb-4">
              We share limited data with the following third-party services, each
              governed by their own privacy policies:
            </p>
            <ul className="list-disc pl-6 space-y-3 leading-relaxed">
              <li>
                <strong className="text-slate-900 dark:text-white">Stripe</strong> (
                <a
                  href="https://stripe.com/privacy"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  stripe.com/privacy
                </a>
                ) — Payment processing. Receives your email and payment details.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">PostHog</strong> (
                <a
                  href="https://posthog.com/privacy"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  posthog.com/privacy
                </a>
                ) — Product analytics. Receives anonymous usage data.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Vercel</strong> (
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vercel.com/legal/privacy-policy
                </a>
                ) — Hosting platform. Processes your requests and may log IP
                addresses.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Neon</strong> (
                <a
                  href="https://neon.tech/privacy"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  neon.tech/privacy
                </a>
                ) — Database hosting. Stores your account and project data.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              6. Data Retention
            </h2>
            <p className="leading-relaxed mb-4">We retain your data as follows:</p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed">
              <li>
                <strong className="text-slate-900 dark:text-white">Account data</strong> — Retained
                while your account is active. After account deletion, we remove
                your personal data within 30 days.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Project metadata</strong> — Retained
                while your account is active. Deleted when you delete a project or
                your account.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Context history</strong> — Retained
                according to your plan limits (Free: 5 entries, Pro/Team:
                unlimited). Older entries may be pruned automatically on the Free
                plan.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Usage analytics</strong> —
                Anonymized data may be retained indefinitely for aggregate
                analysis.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Payment records</strong> — Retained
                as required by applicable tax and financial regulations.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              7. Data Security
            </h2>
            <p className="leading-relaxed mb-4">
              We implement industry-standard security measures to protect your
              data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
              <li>Encrypted connections (HTTPS/TLS) for all data in transit.</li>
              <li>Hashed passwords (never stored in plain text).</li>
              <li>
                Server-side authentication and authorization checks on all API
                routes.
              </li>
              <li>Rate limiting to prevent abuse.</li>
            </ul>
            <p className="leading-relaxed">
              While we take reasonable precautions, no method of transmission or
              storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              8. Your Rights
            </h2>
            <p className="leading-relaxed mb-4">
              Depending on your jurisdiction, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
              <li>
                <strong className="text-slate-900 dark:text-white">Access</strong> — Request a copy of
                the personal data we hold about you.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Correction</strong> — Request
                correction of inaccurate data.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Deletion</strong> — Request deletion
                of your account and associated data.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Export</strong> — Request an export
                of your data in a portable format.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Objection</strong> — Object to
                processing of your data for certain purposes.
              </li>
            </ul>
            <p className="leading-relaxed">
              To exercise any of these rights, contact us at the email address
              below. We will respond within 30 days.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              9. Children&apos;s Privacy
            </h2>
            <p className="leading-relaxed">
              The Service is not intended for children under 16. We do not
              knowingly collect personal information from children. If you believe
              a child has provided us with personal data, please contact us and we
              will delete it promptly.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              10. International Data Transfers
            </h2>
            <p className="leading-relaxed">
              Your data may be processed and stored in countries other than your
              own, including the United States and Japan. By using the Service, you
              consent to such transfers. We ensure appropriate safeguards are in
              place for international transfers in compliance with applicable data
              protection laws.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              11. Changes to This Policy
            </h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify
              registered users of material changes via email or an in-app notice.
              The &quot;Last updated&quot; date at the top of this page reflects the most
              recent revision.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              12. Contact
            </h2>
            <p className="leading-relaxed">
              If you have questions or concerns about this Privacy Policy, please
              contact us at:{' '}
              <a
                href="mailto:privacy@orbit-cli.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                privacy@orbit-cli.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">O</span>
            </div>
            <span>Orbit</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/s4kuraN4gi/orbit-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              GitHub
            </a>
            <Link
              href="/pricing"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Privacy
            </Link>
          </div>
          <p>&copy; 2026 Orbit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
