'use client';

import { useMemo } from 'react';
import { FileText, NotebookPen, Rocket, Sparkles } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

type NoteTypeOption = 'main' | 'reference' | 'structure' | 'project' | 'index';

export interface StrandTemplate {
  id: string;
  name: string;
  description: string;
  noteType: NoteTypeOption;
  tags?: string[];
  difficulty?: string;
  initialTitle?: string;
  initialSummary?: string;
  initialContentHtml?: string;
}

interface TemplatesGalleryProps {
  className?: string;
  onUseTemplate: (template: StrandTemplate) => void;
}

export function TemplatesGallery({ className, onUseTemplate }: TemplatesGalleryProps) {
  const t = useTranslations('pkms');
  const templates = useMemo<StrandTemplate[]>(
    () => [
      {
        id: 'zettelkasten-note',
        name: t('templates.items.zettelkasten.name'),
        description: t('templates.items.zettelkasten.description'),
        noteType: 'reference',
        tags: ['zettelkasten', 'atomic', 'knowledge'],
        initialTitle: 'Untitled Zettel',
        initialSummary: 'A concise, self-contained idea note.',
        initialContentHtml:
          '<h2>Idea</h2><p></p><h2>Context</h2><p></p><h2>References</h2><ul><li></li></ul><h2>Related</h2><p></p>',
      },
      {
        id: 'research-summary',
        name: t('templates.items.researchSummary.name'),
        description: t('templates.items.researchSummary.description'),
        noteType: 'main',
        tags: ['research', 'summary'],
        initialTitle: 'Untitled Research Summary',
        initialSummary: 'Key findings, insights, and follow-ups.',
        initialContentHtml:
          '<h2>Summary</h2><p></p><h2>Highlights</h2><ul><li></li></ul><h2>Open Questions</h2><ul><li></li></ul><h2>Next Steps</h2><ul><li></li></ul>',
      },
      {
        id: 'project-brief',
        name: t('templates.items.projectBrief.name'),
        description: t('templates.items.projectBrief.description'),
        noteType: 'project',
        tags: ['project', 'planning', 'brief'],
        initialTitle: 'Untitled Project Brief',
        initialSummary: 'Scope, objectives, deliverables, and timeline.',
        initialContentHtml:
          '<h2>Overview</h2><p></p><h2>Objectives</h2><ul><li></li></ul><h2>Deliverables</h2><ul><li></li></ul><h2>Timeline</h2><p></p><h2>Stakeholders</h2><ul><li></li></ul>',
      },
      {
        id: 'meeting-notes',
        name: t('templates.items.meetingNotes.name'),
        description: t('templates.items.meetingNotes.description'),
        noteType: 'structure',
        tags: ['meeting', 'notes', 'actions'],
        initialTitle: 'Meeting Notes',
        initialSummary: 'Attendees, agenda, decisions, and actions.',
        initialContentHtml:
          '<h2>Attendees</h2><ul><li></li></ul><h2>Agenda</h2><ul><li></li></ul><h2>Notes</h2><p></p><h2>Decisions</h2><ul><li></li></ul><h2>Action Items</h2><ul><li></li></ul>',
      },
    ],
    [t],
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('templates.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('templates.subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((tpl) => (
          <Card key={tpl.id} className="group flex flex-col justify-between p-4">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  {t('templates.badge')}
                </div>
              </div>
              <h4 className="mb-1 font-semibold">{tpl.name}</h4>
              <p className="mb-3 text-sm text-muted-foreground">{tpl.description}</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {(tpl.tags ?? []).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="mt-auto">
              <Button className="w-full" onClick={() => onUseTemplate(tpl)}>
                {t('templates.use')}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


