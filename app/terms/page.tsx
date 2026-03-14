import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Orbit',
  description: 'Orbit Terms of Service',
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-12">
            Last updated: March 15, 2026
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              1. Acceptance of Terms
            </h2>
            <p className="leading-relaxed mb-4">
              By accessing or using the Orbit service (&quot;Service&quot;), including the
              Orbit web dashboard, CLI tool, and API, you agree to be bound by
              these Terms of Service (&quot;Terms&quot;). If you do not agree to these
              Terms, do not use the Service.
            </p>
            <p className="leading-relaxed">
              Orbit is operated by [Your Company] (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). We
              reserve the right to update these Terms at any time. We will notify
              registered users of material changes via email or an in-app notice.
              Continued use of the Service after changes constitutes acceptance of
              the revised Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              2. Description of Service
            </h2>
            <p className="leading-relaxed mb-4">
              Orbit is an AI context engine that scans your codebase structure and
              generates structured context files (e.g., CLAUDE.md) for AI-assisted
              development. The Service consists of:
            </p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed">
              <li>
                <strong className="text-slate-900 dark:text-white">Orbit CLI</strong> — a free, open-source command-line tool
                for scanning projects locally.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Orbit Web Dashboard</strong> — a paid web application for
                managing projects, viewing context history, and collaborating with
                teams.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Orbit API</strong> — programmatic access to Orbit features.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              3. Accounts
            </h2>
            <p className="leading-relaxed mb-4">
              To access certain features, you must create an account by providing
              accurate and complete information. You are responsible for
              maintaining the confidentiality of your account credentials and for
              all activities that occur under your account.
            </p>
            <p className="leading-relaxed">
              You must be at least 16 years old to use the Service. By creating an
              account, you represent that you meet this age requirement.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              4. Subscription Plans and Billing
            </h2>
            <p className="leading-relaxed mb-4">Orbit offers the following plans:</p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
              <li>
                <strong className="text-slate-900 dark:text-white">Free</strong> — Up to 3 projects, 50 tasks per project,
                limited context history. No payment required.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Pro</strong> — $9/month. Unlimited projects, tasks, and
                context history. JSON and custom export formats.
              </li>
              <li>
                <strong className="text-slate-900 dark:text-white">Team</strong> — $19/user/month. Everything in Pro plus
                organization management, role-based access, and team
                collaboration.
              </li>
            </ul>
            <p className="leading-relaxed">
              All paid subscriptions are billed monthly in advance through Stripe.
              Prices are in USD and do not include applicable taxes.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              5. Cancellation and Refunds
            </h2>
            <p className="leading-relaxed mb-4">
              You may cancel your subscription at any time from your Settings
              page. Upon cancellation:
            </p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed mb-4">
              <li>
                Your subscription remains active until the end of the current
                billing cycle.
              </li>
              <li>
                Your account reverts to the Free plan after the billing period
                ends.
              </li>
              <li>
                No partial refunds are provided for unused time within a billing
                cycle.
              </li>
            </ul>
            <p className="leading-relaxed">
              If you believe you were charged in error, contact us within 30 days
              and we will review your request.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              6. Intellectual Property
            </h2>
            <p className="leading-relaxed mb-4">
              <strong className="text-slate-900 dark:text-white">Your Content:</strong> You retain all rights to your code
              and data. Orbit does not claim ownership of any content you upload or
              scan. The structured context files generated by the CLI are derived
              from your codebase metadata (file names, imports, exports, etc.) and
              belong to you.
            </p>
            <p className="leading-relaxed">
              <strong className="text-slate-900 dark:text-white">Our Service:</strong> The Orbit platform, including its
              design, code, and documentation, is owned by [Your Company] and
              protected by intellectual property laws. The Orbit CLI is licensed
              under the MIT License.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              7. Acceptable Use
            </h2>
            <p className="leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed">
              <li>
                Use the Service for any unlawful purpose or in violation of any
                applicable law.
              </li>
              <li>
                Attempt to gain unauthorized access to the Service, other
                accounts, or related systems.
              </li>
              <li>
                Interfere with or disrupt the Service or its infrastructure.
              </li>
              <li>
                Reverse engineer, decompile, or disassemble any part of the
                Service (except the open-source CLI).
              </li>
              <li>
                Use the Service to transmit malware or malicious content.
              </li>
              <li>
                Resell or redistribute the Service without our written permission.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              8. Limitation of Liability
            </h2>
            <p className="leading-relaxed mb-4 uppercase text-sm">
              To the maximum extent permitted by law, Orbit and [Your Company]
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including loss of profits, data,
              or business opportunities, arising out of or related to your use of
              the Service.
            </p>
            <p className="leading-relaxed uppercase text-sm">
              Our total aggregate liability shall not exceed the amount you paid
              to us in the twelve (12) months preceding the event giving rise to
              the claim.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              9. Disclaimer of Warranties
            </h2>
            <p className="leading-relaxed mb-4 uppercase text-sm">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without
              warranties of any kind, whether express or implied, including but not
              limited to implied warranties of merchantability, fitness for a
              particular purpose, and non-infringement.
            </p>
            <p className="leading-relaxed">
              We do not warrant that the Service will be uninterrupted,
              error-free, or secure, or that any defects will be corrected.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              10. Termination
            </h2>
            <p className="leading-relaxed mb-4">
              We may suspend or terminate your access to the Service at any time
              if you violate these Terms or for any other reason at our sole
              discretion, with or without notice. Upon termination:
            </p>
            <ul className="list-disc pl-6 space-y-2 leading-relaxed">
              <li>Your right to use the Service ceases immediately.</li>
              <li>
                We may delete your account data after a reasonable retention period
                (see our{' '}
                <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Privacy Policy
                </Link>
                ).
              </li>
              <li>
                Provisions that by their nature should survive termination will
                survive, including Sections 6, 8, 9, and 11.
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              11. Governing Law and Disputes
            </h2>
            <p className="leading-relaxed">
              These Terms shall be governed by and construed in accordance with the
              laws of Japan, without regard to conflict of law principles. Any
              disputes arising under these Terms shall be subject to the exclusive
              jurisdiction of the courts located in Tokyo, Japan.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              12. Contact
            </h2>
            <p className="leading-relaxed">
              If you have questions about these Terms, please contact us at:{' '}
              <a href="mailto:support@orbit-cli.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                support@orbit-cli.com
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
