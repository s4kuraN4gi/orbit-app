import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Terminal,
  FileText,
  Check,
  X,
  GitBranch,
  Search,
} from 'lucide-react';
import { CopyCommandButton } from '@/components/landing/CopyCommandButton';
import { MobileNav } from '@/components/landing/MobileNav';
import { getTranslations } from 'next-intl/server';

export default async function Home() {
  const t = await getTranslations('landing');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-bold text-xl">Orbit</span>
        </div>
        <MobileNav
          pricingLabel={t('nav.pricing')}
          signInLabel={t('nav.signIn')}
          getStartedLabel={t('nav.getStarted')}
        />
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            {t('badge')}
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-300 dark:to-white bg-clip-text text-transparent">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto">
            {t('hero.subtitle')}
          </p>

          {/* Primary CTA: npx command */}
          <div className="flex justify-center mb-6">
            <CopyCommandButton />
          </div>

          {/* Terminal mockup */}
          <div className="max-w-lg mx-auto bg-slate-900 dark:bg-slate-800 rounded-xl p-6 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
              <Terminal className="h-4 w-4" />
              <span>{t('terminal')}</span>
            </div>
            <code className="text-green-400 text-sm block">
              <span className="text-slate-500">$</span> npx @orbit-cli/core scan -g
            </code>
            <code className="text-slate-400 text-sm block mt-2">
              {t('terminalScanning')}
            </code>
            <code className="text-slate-400 text-sm block">
              <span className="text-green-400">{t('terminalGenerated')}</span>
            </code>
          </div>

          {/* Demo GIF — served from npm README via GitHub raw URL */}

          {/* Secondary CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8 h-12 text-base">
                {t('cta.openDashboard')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20" aria-labelledby="features-heading">
        <div className="text-center mb-16">
          <h2 id="features-heading" className="text-3xl font-bold mb-4">{t('features.title')}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {t('features.subtitle')}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<Terminal className="h-8 w-8" />}
            title={t('features.scan')}
            description={t('features.scanDesc')}
          />
          <FeatureCard
            icon={<FileText className="h-8 w-8" />}
            title={t('features.multiFormat')}
            description={t('features.multiFormatDesc')}
          />
          <FeatureCard
            icon={<Search className="h-8 w-8" />}
            title={t('features.impact')}
            description={t('features.impactDesc')}
          />
        </div>
      </section>

      {/* What's included Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">{t('whatScans.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              {t('whatScans.subtitle')}
            </p>
            <ul className="space-y-4">
              <BenefitItem text={t('whatScans.item1')} />
              <BenefitItem text={t('whatScans.item2')} />
              <BenefitItem text={t('whatScans.item3')} />
              <BenefitItem text={t('whatScans.item4')} />
              <BenefitItem text={t('whatScans.item5')} />
              <BenefitItem text={t('whatScans.item6')} />
            </ul>
          </div>
          <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-sm font-mono overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-slate-500 text-xs ml-2">CLAUDE.md</span>
            </div>
            <div className="space-y-1 text-slate-400 text-xs leading-relaxed">
              <p className="text-slate-500"># Project: my-app</p>
              <p className="text-slate-500 mt-2">## Tech Stack</p>
              <p>Next.js / React / TypeScript / Tailwind</p>
              <p className="text-slate-500 mt-2">## Project Structure</p>
              <p>- <span className="text-blue-400">Pages (12):</span> /dashboard /settings ...</p>
              <p>- <span className="text-blue-400">API Routes (8):</span> GET, POST, PATCH</p>
              <p>- <span className="text-blue-400">DB Tables (6):</span> users, posts, ...</p>
              <p className="text-slate-500 mt-2">## Import Graph</p>
              <p>45 files, 128 local imports</p>
              <p className="text-slate-500 mt-2">## Environment Variables</p>
              <p>DATABASE_URL, AUTH_SECRET</p>
            </div>
            <p className="text-slate-600 text-xs mt-4 italic">{t('whatScans.tagline')}</p>
          </div>
        </div>
      </section>

      {/* GitHub Action Section */}
      <section className="container mx-auto px-6 py-20 bg-slate-50 dark:bg-slate-900/50" aria-labelledby="github-action-heading">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="github-action-heading" className="text-3xl font-bold mb-4">{t('githubAction.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              {t('githubAction.subtitle')}
            </p>
          </div>
          <div className="max-w-2xl mx-auto bg-slate-900 dark:bg-slate-800 rounded-xl p-6 text-left">
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
              <GitBranch className="h-4 w-4" />
              <span>.github/workflows/orbit.yml</span>
            </div>
            <pre className="text-sm text-slate-300 leading-relaxed overflow-x-auto">
              <code>{`name: Update AI Context
on:
  pull_request:

jobs:
  orbit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: s4kuraN4gi/orbit-action@v1`}</code>
            </pre>
          </div>
          <p className="text-center text-slate-500 mt-6 text-sm">
            {t('githubAction.description')}
          </p>
        </div>
      </section>

      {/* Comparison Section — Orbit vs Repomix */}
      <section className="container mx-auto px-6 py-20" aria-labelledby="comparison-heading">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 id="comparison-heading" className="text-3xl font-bold mb-4">{t('comparison.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              {t('comparison.subtitle')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" aria-label={t('comparison.title')}>
              <thead>
                <tr>
                  <th className="text-left p-4 border-b-2 dark:border-slate-700 w-[40%]"></th>
                  <th className="p-4 border-b-2 border-blue-500 text-center w-[30%]">
                    <span className="inline-flex items-center gap-2 font-bold text-lg">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">O</span>
                      </div>
                      Orbit
                    </span>
                  </th>
                  <th className="p-4 border-b-2 dark:border-slate-700 text-center text-slate-500 font-medium w-[30%]">
                    Repomix
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <ComparisonRow label={t('comparison.rows.approach')} orbit={t('comparison.values.structured')} other={t('comparison.values.codeDump')} />
                <ComparisonRow label={t('comparison.rows.outputSize')} orbit={t('comparison.values.orbitOutput')} other={t('comparison.values.repomixOutput')} />
                <ComparisonRow label={t('comparison.rows.routeDetection')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.dbSchema')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.importGraph')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.exportSignatures')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.impactAnalysis')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.githubAction')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.taskAware')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.watchMode')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.webDashboard')} orbit={true} other={false} />
                <ComparisonRow label={t('comparison.rows.mcpServer')} orbit={t('comparison.values.orbitTools')} other={t('comparison.values.repomixTools')} />
                <ComparisonRow label={t('comparison.rows.multiFormat')} orbit={t('comparison.values.orbitFormats')} other={t('comparison.values.repomixFormats')} />
                <ComparisonRow label={t('comparison.rows.treeSitter')} other={true} orbit={t('comparison.values.regexFast')} />
                <ComparisonRow label={t('comparison.rows.fullSource')} other={true} orbit={false} />
                <ComparisonRow label={t('comparison.rows.freeOss')} orbit={true} other={true} />
              </tbody>
            </table>
          </div>
          <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">{t('comparison.whenRepomix')}</span> {t('comparison.whenRepomixDesc')}{' '}
              <span className="font-semibold">{t('comparison.whenOrbit')}</span> {t('comparison.whenOrbitDesc')}
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{t('social.cliInstalls')}</p>
              <p className="text-sm text-slate-500 mt-1">{t('social.cliInstallsLabel')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{t('social.formats')}</p>
              <p className="text-sm text-slate-500 mt-1">{t('social.formatsLabel')}</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{t('social.openSource')}</p>
              <p className="text-sm text-slate-500 mt-1">{t('social.openSourceLabel')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('ctaSection.title')}
          </h2>
          <p className="text-blue-100 mb-8">
            {t('ctaSection.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-white/10 rounded-lg px-6 py-3 text-base">
              <code className="text-white font-mono">npx @orbit-cli/core scan -g</code>
            </div>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="px-8 h-12 text-base">
                {t('cta.openDashboard')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
            <a href="https://github.com/s4kuraN4gi/orbit-app" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              GitHub
            </a>
            <Link href="/pricing" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              {t('nav.pricing')}
            </Link>
            <Link href="/terms" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              {t('nav.terms')}
            </Link>
            <Link href="/privacy" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              {t('nav.privacy')}
            </Link>
          </div>
          <p>&copy; 2026 Orbit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 rounded-2xl border bg-white dark:bg-slate-900 hover:shadow-lg transition-shadow">
      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400">{description}</p>
    </div>
  );
}

function ComparisonRow({ label, orbit, other }: { label: string; orbit: boolean | string; other: boolean | string }) {
  return (
    <tr className="border-b dark:border-slate-800 last:border-0">
      <td className="p-4 font-medium">{label}</td>
      <td className="p-4 text-center">
        {orbit === true ? (
          <Check className="h-5 w-5 text-green-500 mx-auto" />
        ) : (
          <span className="text-sm text-slate-600 dark:text-slate-400">{orbit}</span>
        )}
      </td>
      <td className="p-4 text-center">
        {other === true ? (
          <Check className="h-5 w-5 text-green-500 mx-auto" />
        ) : other === false ? (
          <X className="h-5 w-5 text-slate-300 dark:text-slate-600 mx-auto" />
        ) : (
          <span className="text-sm text-slate-500">{other}</span>
        )}
      </td>
    </tr>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </li>
  );
}
