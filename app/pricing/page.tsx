import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PricingTable } from '@/components/PricingTable';

export default function PricingPage() {
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
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/login">
            <Button>Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="container mx-auto px-6 pt-20 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Start free. Upgrade when you need more projects, history, and export formats.
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
            <AccordionTrigger>What&apos;s included in the Free plan?</AccordionTrigger>
            <AccordionContent>
              The Free plan includes up to 3 projects, 50 tasks per project,
              5 context history entries, and Markdown export. The CLI tool is
              always free and open source.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pro">
            <AccordionTrigger>When will Pro and Team plans be available?</AccordionTrigger>
            <AccordionContent>
              Pro and Team plans are coming soon. We&apos;re building the payment
              infrastructure now. Sign up for the Free plan to be notified when
              paid plans launch.
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
          <AccordionItem value="cancel">
            <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
            <AccordionContent>
              Yes. When paid plans launch, you can cancel anytime and your account
              will revert to the Free plan at the end of the billing cycle.
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
