'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

interface MobileNavProps {
  pricingLabel: string;
  signInLabel: string;
  getStartedLabel: string;
}

export function MobileNav({ pricingLabel, signInLabel, getStartedLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-4">
        <Link href="/pricing">
          <Button variant="ghost">{pricingLabel}</Button>
        </Link>
        <Link href="/login">
          <Button variant="ghost">{signInLabel}</Button>
        </Link>
        <Link href="/login">
          <Button>{getStartedLabel}</Button>
        </Link>
      </div>

      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile dropdown */}
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg md:hidden z-50">
          <div className="flex flex-col p-4 gap-2">
            <Link href="/pricing" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{pricingLabel}</Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">{signInLabel}</Button>
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              <Button className="w-full">{getStartedLabel}</Button>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
