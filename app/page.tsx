import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Terminal,
  FileText,
  Zap,
  Check,
  X,
} from 'lucide-react';
import { CopyCommandButton } from '@/components/landing/CopyCommandButton';
import { getTranslations } from 'next-intl/server';

export default async function Home() {
  const t = await getTranslations('landing');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-bold text-xl">Orbit</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pricing">
            <Button variant="ghost">{t('nav.pricing')}</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost">{t('nav.signIn')}</Button>
          </Link>
          <Link href="/login">
            <Button>{t('nav.getStarted')}</Button>
          </Link>
        </div>
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
          <div className="max-w-lg mx-auto bg-slate-900 dark:bg-slate-800 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-center gap-2 mb-3 text-sm text-slate-400">
              <Terminal className="h-4 w-4" />
              <span>{t('terminal')}</span>
            </div>
            <code className="text-green-400 text-sm block">
              <span className="text-slate-500">$</span> npx @orbit-cli/core scan -g
            </code>
            <code className="text-slate-400 text-sm block mt-2">
              Scanning project...
            </code>
            <code className="text-slate-400 text-sm block">
              <span className="text-green-400">Generated: CLAUDE.md</span>
            </code>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="px-8 h-12 text-base">
                {t('cta.openDashboard')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <CopyCommandButton />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">{t('features.title')}</h2>
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
            title={t('features.context')}
            description={t('features.contextDesc')}
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title={t('features.taskAware')}
            description={t('features.taskAwareDesc')}
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
          <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 aspect-square flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-16 w-16 mx-auto mb-4 text-blue-500" />
              <p className="text-lg font-medium">{t('whatScans.tagline')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section — Orbit vs Repomix */}
      <section className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t('comparison.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              {t('comparison.subtitle')}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
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
                <ComparisonRow label="Approach" orbit="Structured context" other="Full code dump" />
                <ComparisonRow label="Output size (100-file project)" orbit="~200 lines" other="~10,000+ lines" />
                <ComparisonRow label="Route & API detection" orbit={true} other={false} />
                <ComparisonRow label="DB schema extraction" orbit={true} other={false} />
                <ComparisonRow label="Import graph analysis" orbit={true} other={false} />
                <ComparisonRow label="Export signatures" orbit={true} other={false} />
                <ComparisonRow label="Task-aware context" orbit={true} other={false} />
                <ComparisonRow label="Smart Context scoring" orbit="Pro" other={false} />
                <ComparisonRow label="Implementation Plans" orbit={true} other={false} />
                <ComparisonRow label="Watch mode (auto-regen)" orbit={true} other={false} />
                <ComparisonRow label="Web dashboard & history" orbit={true} other={false} />
                <ComparisonRow label="MCP Server" orbit="4 tools" other="1 tool" />
                <ComparisonRow label="Multi-format output" orbit="CLAUDE.md, .cursorrules, copilot, windsurf" other="XML, Markdown" />
                <ComparisonRow label="Tree-sitter parsing" other={true} orbit="Regex (fast)" />
                <ComparisonRow label="Full source inclusion" other={true} orbit={false} />
                <ComparisonRow label="Free & open source" orbit="CLI is OSS" other={true} />
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
            <Link href="/login">
              <Button size="lg" variant="secondary" className="px-8 h-12 text-base">
                {t('cta.getStartedFree')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <div className="bg-white/10 rounded-lg px-4 py-2 text-sm">
              <code className="text-white">npx @orbit-cli/core scan -g</code>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-8 border-t">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">O</span>
            </div>
            <span>Orbit</span>
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
