'use client';

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Trash2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Comment, addComment, updateComment, deleteComment } from '@/app/actions/comment';
import { useTranslations } from 'next-intl';

// Native relative time formatter with i18n support
function formatRelativeTime(date: Date, locale: string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (locale === 'en') {
    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  
  if (diffSeconds < 60) return 'たった今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
}

interface CommentSectionProps {
  taskId: string;
  initialComments: Comment[];
  currentUserEmail: string;
}

export function CommentSection({ taskId, initialComments, currentUserEmail }: CommentSectionProps) {
  const t = useTranslations('comments');
  const tCommon = useTranslations('common');
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const [showAllComments, setShowAllComments] = useState(false);

  // Detect locale from translation
  const locale = t('title') === 'Comments' ? 'en' : 'ja';

  const VISIBLE_COUNT = 3;
  const hasMoreComments = comments.length > VISIBLE_COUNT;
  const visibleComments = showAllComments ? comments : comments.slice(-VISIBLE_COUNT);
  const hiddenCount = hasMoreComments ? comments.length - VISIBLE_COUNT : 0;

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    startTransition(async () => {
      try {
        const comment = await addComment(taskId, newComment);
        if (comment) {
          setComments(prev => [...prev, comment]);
          setNewComment('');
          toast.success(t('addSuccess'));
        }
      } catch {
        toast.error(t('addError'));
      }
    });
  };

  const handleUpdateComment = (commentId: string) => {
    if (!editContent.trim()) return;

    startTransition(async () => {
      try {
        const updated = await updateComment(commentId, editContent);
        if (updated) {
          setComments(prev => prev.map(c => c.id === commentId ? { ...c, ...updated } : c));
          setEditingId(null);
          setEditContent('');
          toast.success(t('updateSuccess'));
        }
      } catch {
        toast.error(t('updateError'));
      }
    });
  };

  const handleDeleteComment = (commentId: string) => {
    startTransition(async () => {
      try {
        await deleteComment(commentId);
        setComments(prev => prev.filter(c => c.id !== commentId));
        toast.success(t('deleteSuccess'));
      } catch {
        toast.error(t('deleteError'));
      }
    });
  };

  const startEditing = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  const getInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleAddComment();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <h3 className="font-medium">{t('count', { count: comments.length })}</h3>
      </div>

      <Separator />

      {/* Comment List */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('noComments')}
          </p>
        ) : (
          <>
            {hasMoreComments && !showAllComments && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllComments(true)}
              >
                {t('showOlder', { count: hiddenCount })}
              </Button>
            )}
            {showAllComments && hasMoreComments && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-foreground"
                onClick={() => setShowAllComments(false)}
              >
                {t('showRecent', { count: VISIBLE_COUNT })}
              </Button>
            )}
            {visibleComments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(comment.user_email || 'UN')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{comment.user_email}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(comment.created_at), locale)}
                    </span>
                    {comment.created_at !== comment.updated_at && (
                      <span className="text-xs text-muted-foreground">({t('edited')})</span>
                    )}
                  </div>
                  {comment.user_email === currentUserEmail && editingId !== comment.id && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => startEditing(comment)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {editingId === comment.id ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[60px]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={isPending || !editContent.trim()}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        {tCommon('save')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={cancelEditing}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {tCommon('cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            </div>
          ))}
          </>
        )}
      </div>

      {/* Add Comment Form */}
      <div className="space-y-2 pt-2 border-t">
        <Textarea
          placeholder={t('placeholder')}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[80px]"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAddComment}
            disabled={isPending || !newComment.trim()}
          >
            <Send className="h-3 w-3 mr-1" />
            {isPending ? t('submitting') : t('submit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
