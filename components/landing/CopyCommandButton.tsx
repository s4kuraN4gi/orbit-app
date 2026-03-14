'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Terminal, Copy, Check } from 'lucide-react';

export function CopyCommandButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('npx @orbit-cli/core scan -g');
    } catch {
      // Silently handle clipboard errors (e.g. insecure contexts)
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button size="lg" variant="outline" className="px-8 h-12 text-base font-mono" onClick={handleCopy}>
      <Terminal className="mr-2 h-4 w-4" />
      npx @orbit-cli/core scan -g
      {copied ? <Check className="ml-2 h-4 w-4" /> : <Copy className="ml-2 h-4 w-4" />}
    </Button>
  );
}
