'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { getTemplates, deleteTemplate } from '@/app/actions/template'

interface Template {
  id: string
  name: string
  title: string
  description: string
  priority: string
  created_at: string
}

interface TemplateManagerProps {
  isOpen: boolean
  projectId: string
  onClose: () => void
}

export function TemplateManager({
  isOpen,
  projectId,
  onClose,
}: TemplateManagerProps) {
  const t = useTranslations('templates')
  const tCommon = useTranslations('common')
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTemplates = async () => {
    if (!projectId) return
    setLoading(true)
    const result = await getTemplates(projectId)
    if (result.success && result.data) {
      setTemplates(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, projectId])

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return

    setDeletingId(id)
    const result = await deleteTemplate(id)
    
    if (result.success) {
      setTemplates(templates.filter((t) => t.id !== id))
    } else {
      alert(tCommon('error'))
    }
    setDeletingId(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>
            {t('manageDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground">{tCommon('loading')}</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('noTemplates')}
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="grid gap-1">
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {template.title}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {tCommon('close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
