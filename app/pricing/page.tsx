import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PricingTable } from '@/components/PricingTable';

export default async function PricingPage() {
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
        <div className="flex items-center gap-4">
          <Link href="/pricing">
            <Button variant="ghost">Pricing</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Dashboard</Button>
          </Link>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Everything is free
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            All features. No limits. No credit card required. Star us on GitHub to support development.
          </p>
        </div>

        <PricingTable />
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-20 max-w-3xl">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="free">
            <AccordionTrigger>Is Orbit really free?</AccordionTrigger>
            <AccordionContent>
              Yes! All features are completely free — unlimited projects, tasks,
              export formats, and team collaboration. We believe in building a
              great tool first and earning community support through value.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="cli">
            <AccordionTrigger>Is the CLI free to use?</AccordionTrigger>
            <AccordionContent>
              Yes! The Orbit CLI is free and open source. Run{' '}
              <code className="bg-muted px-1 rounded">npx @orbit-cli/core scan</code>{' '}
              in any project — no account needed. The dashboard provides extra features
              like history and visual diffs.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="support">
            <AccordionTrigger>How can I support Orbit?</AccordionTrigger>
            <AccordionContent>
              The best way to support us is to star the{' '}
              <a href="https://github.com/s4kuraN4gi/orbit-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                GitHub repository
              </a>{' '}
              and spread the word. You can also support development directly via{' '}
              <a href="https://github.com/sponsors/s4kuraN4gi" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                GitHub Sponsors
              </a>.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="future">
            <AccordionTrigger>Will there be paid plans in the future?</AccordionTrigger>
            <AccordionContent>
              We follow a Sponsorware model — features are built in the open and
              released free to everyone. Premium plans may be introduced in the
              future for advanced enterprise needs, but the core product will
              always remain free.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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
