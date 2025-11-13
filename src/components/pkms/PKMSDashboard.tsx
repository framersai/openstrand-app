'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FilePlus2,
  Grid,
  Info,
  HelpCircle,
  Settings2,
  Layers3,
  List,
  Plus,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TemplatesGallery, type StrandTemplate } from '@/components/pkms/TemplatesGallery';
import { PKMSWelcomeModal } from '@/components/pkms/PKMSWelcomeModal';
import { StrandComposer } from '@/features/composer/components/StrandComposer';
import { openstrandAPI } from '@/services/openstrand.api';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Strand } from '@/types/openstrand';
import { useTranslations } from 'next-intl';
import { PKMSHelpModal } from '@/components/pkms/PKMSHelpModal';
import { PKMSPreferencesModal } from '@/components/pkms/PKMSPreferencesModal';
import { QuickCapturePanel } from '@/components/pkms/QuickCapturePanel';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { WeavePreviewCard } from '@/components/pkms/WeavePreviewCard';
import { LoomsPanel } from '@/components/pkms/LoomsPanel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StrandDeleteButton } from '@/components/pkms/StrandDeleteButton';

type ViewMode = 'grid' | 'list';

export function PKMSDashboard() {
  const localizePath = useLocalizedPath();
  const t = useTranslations('pkms');
  const [aboutOpen, setAboutOpen] = useState<boolean | undefined>(undefined);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);
  const [prefsOpen, setPrefsOpen] = useState<boolean>(false);
  const [teamId, setTeamId] = useState<string | ''>('');
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([]);

  // Quick create / templates
  const [showComposer, setShowComposer] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [composeKey, setComposeKey] = useState<number>(0);
  const [templatePrefill, setTemplatePrefill] = useState<{
    title?: string;
    summary?: string;
    noteType?: 'main' | 'reference' | 'structure' | 'project' | 'index';
    tags?: string[];
    difficulty?: string;
    initialContentHtml?: string;
  }>({});

  // Content list
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [strands, setStrands] = useState<Strand[]>([]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { strands: items } = await openstrandAPI.strands.list({ limit: 24, teamId: teamId || undefined });
      setStrands(items);
    } catch (err) {
      console.debug('[PKMSDashboard] Falling back to empty list', err);
      setError(null);
      setStrands([]);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      try {
        const res = await openstrandAPI.team.list();
        setTeams(res.teams ?? []);
      } catch {
        setTeams([]);
      }
    })();
  }, []);

  const filteredStrands = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return strands;
    return strands.filter((s) => {
      const hay =
        `${s.title ?? ''} ${s.summary ?? ''} ${(Array.isArray((s.metadata as any)?.tags) ? (s.metadata as any)?.tags : []).join(' ')}`.toLowerCase();
      return hay.includes(query);
    });
  }, [searchQuery, strands]);

  const handleUseTemplate = (tpl: StrandTemplate) => {
    setTemplatePrefill({
      title: tpl.initialTitle,
      summary: tpl.initialSummary,
      noteType: tpl.noteType,
      tags: tpl.tags,
      difficulty: tpl.difficulty,
      initialContentHtml: tpl.initialContentHtml,
    });
    setShowComposer(true);
    setShowTemplates(false);
    setComposeKey((k) => k + 1); // force re-mount with new defaults
  };

  return (
    <div className="relative">
      <PKMSWelcomeModal triggerOpen={aboutOpen} onOpenChange={setAboutOpen} />
      <PKMSHelpModal open={helpOpen} onOpenChange={setHelpOpen} />
      <PKMSPreferencesModal open={prefsOpen} onOpenChange={setPrefsOpen} />

      <section className="border-b border-border/40 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="mb-1 text-3xl font-bold tracking-tight">{t('header.title')}</h1>
              <p className="text-muted-foreground">{t('header.subtitle')}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <TooltipProvider>
                  <BadgeWithInfo label={t('help.glossary.strands.name')} desc={t('help.glossary.strands.desc')} />
                  <BadgeWithInfo label={t('help.glossary.weave.name')} desc={t('help.glossary.weave.desc')} />
                  <BadgeWithInfo label={t('help.glossary.looms.name')} desc={t('help.glossary.looms.desc')} />
                  <BadgeWithInfo label={t('help.glossary.datasets.name')} desc={t('help.glossary.datasets.desc')} />
                  <BadgeWithInfo label={t('help.glossary.entities.name')} desc={t('help.glossary.entities.desc')} />
                  <BadgeWithInfo label={t('help.glossary.relationships.name')} desc={t('help.glossary.relationships.desc')} />
                </TooltipProvider>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setAboutOpen(true)}>
                <Info className="h-4 w-4" />
                {t('actions.about')}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setHelpOpen(true)}>
                <HelpCircle className="h-4 w-4" />
                {t('help.titleShort')}
              </Button>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setPrefsOpen(true)}>
                <Settings2 className="h-4 w-4" />
                {t('actions.preferences')}
              </Button>
              {teams.length > 0 ? (
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={t('teams.placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('teams.none')}</SelectItem>
                    {teams.map((tm) => (
                      <SelectItem key={tm.id} value={tm.id}>{tm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Button asChild size="sm" className="gap-2">
                <Link href={localizePath('/pkms/import')}>
                  <Plus className="h-4 w-4" />
                  {t('actions.import')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {/* Quick actions */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <QuickCapturePanel />
          </div>
          <WeavePreviewCard />
          <LoomsPanel />
          <Card className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <FilePlus2 className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{t('quick.newNote.title')}</div>
                <div className="text-sm text-muted-foreground">{t('quick.newNote.description')}</div>
              </div>
            </div>
            <Button onClick={() => { setShowComposer(true); setShowTemplates(false); }} className="gap-2">
              <BookOpen className="h-4 w-4" />
              {t('quick.newNote.button')}
            </Button>
          </Card>

          <Card className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{t('quick.useTemplate.title')}</div>
                <div className="text-sm text-muted-foreground">{t('quick.useTemplate.description')}</div>
              </div>
            </div>
            <Button variant="secondary" onClick={() => { setShowTemplates(true); setShowComposer(true); }} className="gap-2">
              <Sparkles className="h-4 w-4" />
              {t('quick.useTemplate.button')}
            </Button>
          </Card>

          <Card className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <Tag className="h-5 w-5 text-primary" />
              <div>
                <div className="font-medium">{t('quick.import.title')}</div>
                <div className="text-sm text-muted-foreground">{t('quick.import.description')}</div>
              </div>
            </div>
            <Button asChild variant="outline" className="gap-2">
              <Link href={localizePath('/pkms/import')}>
                <Plus className="h-4 w-4" />
                {t('quick.import.button')}
              </Link>
            </Button>
          </Card>
        </div>

        {/* Creator area */}
        {showComposer ? (
          <Card className="mb-6 p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-medium">{t('creator.title')}</span>
                {showTemplates ? (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {t('creator.templateMode')}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates((v) => !v)}>
                  {showTemplates ? t('actions.hideTemplates') : t('actions.showTemplates')}
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setShowComposer(false); setShowTemplates(false); }}>
                  {t('actions.close')}
                </Button>
              </div>
            </div>

            {showTemplates ? (
              <div className="mb-5">
                <TemplatesGallery onUseTemplate={handleUseTemplate} />
              </div>
            ) : null}

            <div className="rounded-lg border border-border/60 bg-card p-3 sm:p-4">
              <StrandComposer
                key={composeKey}
                title={templatePrefill.title}
                summary={templatePrefill.summary}
                noteType={(templatePrefill.noteType as any) ?? 'main'}
                tags={templatePrefill.tags ?? []}
                difficulty={templatePrefill.difficulty ?? 'beginner'}
                initialContentHtml={templatePrefill.initialContentHtml}
              />
            </div>
          </Card>
        ) : null}

        {/* Finder and list */}
        <Card className="mb-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder={t('list.searchPlaceholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md border border-input">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => void refresh()}>
                {t('actions.refresh')}
              </Button>
            </div>
          </div>
        </Card>

        {loading ? (
          <Card className="p-6 text-sm text-muted-foreground">{t('list.loading')}</Card>
        ) : filteredStrands.length === 0 ? (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
              <BookOpen className="h-6 w-6 text-primary" />
              <div className="text-lg font-medium">{t('empty.title')}</div>
              <div className="max-w-md text-sm text-muted-foreground">{t('empty.description')}</div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => setShowComposer(true)}>{t('empty.create')}</Button>
                <Button variant="secondary" onClick={() => { setShowComposer(true); setShowTemplates(true); }}>
                  {t('empty.browseTemplates')}
                </Button>
                <Button asChild variant="outline">
                  <Link href={localizePath('/pkms/import')}>{t('empty.openImporter')}</Link>
                </Button>
              </div>
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStrands.map((s) => (
              <Card key={s.id} className="group p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {(s.noteType ?? s.strandType ?? 'note').toString()}
                  </span>
                </div>
                <h3 className="mb-1 line-clamp-1 font-semibold">{s.title ?? 'Untitled strand'}</h3>
                {s.summary ? (
                  <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{s.summary}</p>
                ) : null}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {Array.isArray((s.metadata as any)?.tags)
                    ? ((s.metadata as any)?.tags as string[]).slice(0, 6).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))
                    : null}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatRelativeTime(s.created ?? s.updated ?? new Date().toISOString())}</span>
                  <div className="flex items-center gap-2">
                    <Link className="text-primary underline-offset-4 hover:underline" href={localizePath(`/pkms/strands`)}>
                      {t('actions.manage')}
                    </Link>
                    <StrandDeleteButton strandId={s.id} onDeleted={() => void refresh()} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <ScrollArea className="h-[560px]">
              <div className="divide-y">
                {filteredStrands.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="rounded-md bg-muted px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                        {(s.noteType ?? s.strandType ?? 'note').toString()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{s.title ?? 'Untitled strand'}</div>
                        {s.summary ? (
                          <div className="truncate text-sm text-muted-foreground">{s.summary}</div>
                        ) : null}
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {Array.isArray((s.metadata as any)?.tags)
                            ? ((s.metadata as any)?.tags as string[]).slice(0, 6).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))
                            : null}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatRelativeTime(s.created ?? s.updated ?? new Date().toISOString())}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={localizePath(`/pkms/strands`)}>{t('actions.open')}</Link>
                      </Button>
                      <StrandDeleteButton strandId={s.id} onDeleted={() => void refresh()} />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </section>
    </div>
  );
}

function BadgeWithInfo({ label, desc }: { label: string; desc: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground">{label}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs">{desc}</TooltipContent>
    </Tooltip>
  );
}


