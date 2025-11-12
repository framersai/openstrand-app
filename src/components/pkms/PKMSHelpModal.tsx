'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface PKMSHelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PKMSHelpModal({ open, onOpenChange }: PKMSHelpModalProps) {
  const t = useTranslations('pkms');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl ring-1 ring-primary/30 border-primary/30">
        <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-primary/40 via-accent/30 to-transparent" />
        <DialogHeader>
          <DialogTitle>{t('help.title')}</DialogTitle>
          <DialogDescription>{t('help.subtitle')}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="overview">
          <TabsList className="mb-3">
            <TabsTrigger value="overview">{t('help.tabs.overview')}</TabsTrigger>
            <TabsTrigger value="creator">{t('help.tabs.creator')}</TabsTrigger>
            <TabsTrigger value="templates">{t('help.tabs.templates')}</TabsTrigger>
            <TabsTrigger value="import">{t('help.tabs.import')}</TabsTrigger>
            <TabsTrigger value="tips">{t('help.tabs.tips')}</TabsTrigger>
            <TabsTrigger value="glossary">{t('help.tabs.glossary')}</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">{t('help.content.overview')}</p>
            </div>
          </TabsContent>
          <TabsContent value="creator">
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">{t('help.content.creator')}</p>
            </div>
          </TabsContent>
          <TabsContent value="templates">
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">{t('help.content.templates')}</p>
            </div>
          </TabsContent>
          <TabsContent value="import">
            <div className="max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-muted-foreground">{t('help.content.import')}</p>
            </div>
          </TabsContent>
          <TabsContent value="tips">
            <div className="max-h-[60vh] overflow-y-auto space-y-2 text-sm text-muted-foreground">
              <p>{t('help.content.tips')}</p>
              <ul className="list-inside list-disc">
                <li>
                  <Link href="/docs/PKMS_DASHBOARD.md" className="text-primary underline-offset-4 hover:underline">
                    {t('help.links.dashboard')}
                  </Link>
                </li>
                <li>
                  <Link href="/docs/README.md" className="text-primary underline-offset-4 hover:underline">
                    {t('help.links.hub')}
                  </Link>
                </li>
                <li>
                  <Link href="/docs/tutorials/README.md" className="text-primary underline-offset-4 hover:underline">
                    {t('help.links.tutorials')}
                  </Link>
                </li>
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="glossary">
            <div className="max-h-[60vh] overflow-y-auto grid gap-3 sm:grid-cols-2">
              <GlossaryItem label={t('help.glossary.strands.name')} desc={t('help.glossary.strands.desc')} />
              <GlossaryItem label={t('help.glossary.weave.name')} desc={t('help.glossary.weave.desc')} />
              <GlossaryItem label={t('help.glossary.looms.name')} desc={t('help.glossary.looms.desc')} />
              <GlossaryItem label={t('help.glossary.datasets.name')} desc={t('help.glossary.datasets.desc')} />
              <GlossaryItem label={t('help.glossary.entities.name')} desc={t('help.glossary.entities.desc')} />
              <GlossaryItem label={t('help.glossary.relationships.name')} desc={t('help.glossary.relationships.desc')} />
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('actions.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GlossaryItem({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/30 p-3">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}


