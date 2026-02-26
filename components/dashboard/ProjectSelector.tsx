'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, FolderKanban, Trash2, Users } from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { deleteProject } from '@/app/actions/project';
import { toast } from 'sonner';

import { useTranslations } from 'next-intl';
import type { PlanTier } from '@/types';

interface Project {
  id: string;
  name: string;
  key: string;
  organizationId?: string | null;
}

interface OrgOption {
  id: string;
  name: string;
}

interface ProjectSelectorProps {
  projects: Project[];
  currentProjectId: string;
  onProjectChange: (projectId: string) => void;
  planTier?: PlanTier;
  organizations?: OrgOption[];
}

export function ProjectSelector({ projects, currentProjectId, onProjectChange, planTier, organizations }: ProjectSelectorProps) {
  const router = useRouter();
  const t = useTranslations('project');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleProjectCreated = (projectId: string) => {
    onProjectChange(projectId);
  };

  const handleDeleteProject = async () => {
    if (!currentProjectId) return;

    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject) return;

    const confirmed = confirm(
      t('deleteConfirm', { name: currentProject.name })
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteProject(currentProjectId);
      toast.success(t('deleteSuccess'));
      // Navigate to dashboard without specific project
      router.push('/dashboard');
    } catch (error) {
      toast.error(t('deleteError'));
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <FolderKanban className="h-5 w-5 text-muted-foreground" />
      <Select value={currentProjectId} onValueChange={onProjectChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder={t('selectPlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              <span className="flex items-center gap-1.5">
                [{project.key}] {project.name}
                {project.organizationId && (
                  <Users className="h-3 w-3 text-muted-foreground" />
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsCreateModalOpen(true)}
        title={t('createTooltip')}
      >
        <Plus className="h-4 w-4" />
      </Button>
      {currentProjectId && (
        <Button
          variant="outline"
          size="icon"
          onClick={handleDeleteProject}
          disabled={isDeleting}
          title={t('deleteTooltip')}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
        planTier={planTier}
        currentProjectCount={projects.length}
        organizations={organizations}
      />
    </div>
  );
}
