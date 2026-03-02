'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Lightbulb, Plus, Trash2, ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getIdeas, createIdea, deleteIdea, updateIdea, convertIdeaToTask, Idea } from '@/app/actions/idea';

interface IdeaBoxProps {
  projectId: string;
  onTaskCreated?: () => void;
}

export function IdeaBox({ projectId, onTaskCreated }: IdeaBoxProps) {
  const t = useTranslations('ideas');
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState('');
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string>('');

  useEffect(() => {
    loadIdeas();
  }, [projectId]);

  const loadIdeas = async () => {
    setIsLoading(true);
    const data = await getIdeas(projectId);
    setIdeas(data);
    setIsLoading(false);
  };

  const handleAddIdea = () => {
    if (!newIdea.trim()) return;
    
    startTransition(async () => {
      const idea = await createIdea(projectId, newIdea.trim());
      if (idea) {
        setIdeas(prev => [idea, ...prev]);
        setNewIdea('');
      } else {
        toast.error(t('addError'));
      }
    });
  };

  const handleDeleteIdea = (ideaId: string) => {
    startTransition(async () => {
      const success = await deleteIdea(ideaId);
      if (success) {
        setIdeas(prev => prev.filter(i => i.id !== ideaId));
        if (expandedIdeaId === ideaId) {
          setExpandedIdeaId(null);
        }
      } else {
        toast.error(t('deleteError'));
      }
    });
  };

  const handleConvertToTask = (ideaId: string) => {
    startTransition(async () => {
      const taskId = await convertIdeaToTask(ideaId);
      if (taskId) {
        setIdeas(prev => prev.map(i => 
          i.id === ideaId ? { ...i, converted_task_id: taskId } : i
        ));
        toast.success(t('converted'));
        onTaskCreated?.();
      } else {
        toast.error(t('convertError'));
      }
    });
  };

  const handleExpandIdea = (idea: Idea) => {
    if (expandedIdeaId === idea.id) {
      // Collapse and save
      handleSaveNotes(idea.id);
      setExpandedIdeaId(null);
    } else {
      // Expand and load notes
      setExpandedIdeaId(idea.id);
      setEditingNotes(idea.notes || '');
    }
  };

  const handleSaveNotes = (ideaId: string) => {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea || idea.notes === editingNotes) return;
    
    startTransition(async () => {
      const updated = await updateIdea(ideaId, { notes: editingNotes || null });
      if (updated) {
        setIdeas(prev => prev.map(i => i.id === ideaId ? updated : i));
      }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ignore Enter during IME composition (e.g., Japanese input conversion)
    if (e.nativeEvent.isComposing) return;
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddIdea();
    }
  };

  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        <h2 className="font-semibold">{t('title')}</h2>
      </div>

      {/* Input */}
      <div className="p-3 border-b">
        <div className="flex gap-2">
          <Input
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('placeholder')}
            disabled={isPending}
            className="flex-1"
          />
          <Button 
            size="sm" 
            onClick={handleAddIdea} 
            disabled={isPending || !newIdea.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Ideas List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            {t('loading')}
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t('empty')}
          </div>
        ) : (
          ideas.map((idea) => (
            <div 
              key={idea.id}
              className={`
                rounded-lg border bg-background transition-all
                ${idea.converted_task_id ? 'opacity-60' : ''}
              `}
            >
              {/* Idea Header - Clickable */}
              <div 
                className="p-3 cursor-pointer hover:bg-muted/50 rounded-t-lg"
                onClick={() => !idea.converted_task_id && handleExpandIdea(idea)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1 whitespace-pre-wrap break-words">
                    {idea.content}
                  </p>
                  {!idea.converted_task_id && (
                    expandedIdeaId === idea.id ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    )
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {new Date(idea.created_at).toLocaleDateString()}
                  </span>
                  {idea.notes && !expandedIdeaId && (
                    <span className="text-xs text-blue-500">{t('hasNotes')}</span>
                  )}
                </div>
              </div>

              {/* Notes Section - Expanded */}
              {expandedIdeaId === idea.id && !idea.converted_task_id && (
                <div className="px-3 pb-3 border-t">
                  <Textarea
                    value={editingNotes}
                    onChange={(e) => setEditingNotes(e.target.value)}
                    onBlur={() => handleSaveNotes(idea.id)}
                    placeholder={t('notesPlaceholder')}
                    className="mt-2 text-sm min-h-[80px] resize-none"
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {editingNotes.length} / 5000
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="px-3 pb-3 flex items-center justify-end gap-1">
                {idea.converted_task_id ? (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    {t('convertedLabel')}
                  </span>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleConvertToTask(idea.id)}
                      disabled={isPending}
                      className="h-7 px-2 text-xs"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      {t('convertToTask')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteIdea(idea.id)}
                      disabled={isPending}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
