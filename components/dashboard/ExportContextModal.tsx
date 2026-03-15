'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { FileDown, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Task, PlanTier } from '@/types';
import { generateProjectContext, ContextOptions } from '@/lib/contextGenerator';

interface ExportContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  projectName: string;
  planTier?: PlanTier;
}

export function ExportContextModal({ isOpen, onClose, tasks, projectName, planTier = 'free' }: ExportContextModalProps) {
  const t = useTranslations('dashboard.export');
  const [format, setFormat] = useState<'markdown' | 'json'>('markdown');
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [maxDepth, setMaxDepth] = useState(3);
  const [copied, setCopied] = useState(false);

  const options: ContextOptions = useMemo(() => ({
    projectName,
    includeCompleted,
    includeDescription,
    format,
    maxDepth,
  }), [projectName, includeCompleted, includeDescription, format, maxDepth]);

  const generatedContext = useMemo(() => {
    return generateProjectContext(tasks, options);
  }, [tasks, options]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedContext);
      setCopied(true);
      toast.success(t('copied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('copyError'));
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!w-[90vw] !max-w-[1000px] h-[80vh] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            {t('contextTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('contextDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left: Options */}
          <div className="w-64 shrink-0 space-y-4">
            <div className="space-y-2">
              <Label>{t('format')}</Label>
              <Select value={format} onValueChange={(v: 'markdown' | 'json') => setFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">{t('markdownFormat')}</SelectItem>
                  {planTier !== 'free' && (
                    <SelectItem value="json">{t('jsonFormat')}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {planTier === 'free' && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {t('jsonFormat')} <Badge variant="secondary" className="text-[10px] px-1 py-0">{t('proBadge')}</Badge>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>{t('depth')}</Label>
              <Select value={String(maxDepth)} onValueChange={(v) => setMaxDepth(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ({t('depthShallow')})</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3 ({t('depthDefault')})</SelectItem>
                  <SelectItem value="5">5 ({t('depthDeep')})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeCompleted">{t('includeCompleted')}</Label>
              <Switch
                id="includeCompleted"
                checked={includeCompleted}
                onCheckedChange={setIncludeCompleted}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="includeDescription">{t('includeDescription')}</Label>
              <Switch
                id="includeDescription"
                checked={includeDescription}
                onCheckedChange={setIncludeDescription}
              />
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            <Label className="mb-2">{t('preview')}</Label>
            <pre className="flex-1 border rounded-md p-3 overflow-auto bg-muted/30 text-sm font-mono whitespace-pre-wrap break-words">
              {generatedContext}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('close')}
          </Button>
          <Button onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                {t('copied')}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                {t('copy')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
