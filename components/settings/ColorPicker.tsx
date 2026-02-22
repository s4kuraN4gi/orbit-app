'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer shadow-sm"
        style={{ backgroundColor: value }}
        onClick={() => document.getElementById(`color-${label}`)?.click()}
      />
      <input
        id={`color-${label}`}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
      <div className="flex-1 space-y-1">
        <Label className="text-sm font-medium">{label}</Label>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-xs font-mono uppercase"
          placeholder="#000000"
        />
      </div>
    </div>
  );
}
