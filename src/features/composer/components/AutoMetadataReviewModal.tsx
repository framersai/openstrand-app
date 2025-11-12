'use client';

import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface AutoMetadataReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: string[];
  related: Array<{ id: string; title?: string; summary?: string }>;
  onApply: (selection: { tags: string[]; relatedIds: string[] }) => Promise<void> | void;
}

export function AutoMetadataReviewModal({
  open,
  onOpenChange,
  tags,
  related,
  onApply,
}: AutoMetadataReviewModalProps) {
  const t = useTranslations('pkms');
  const [selectedTags, setSelectedTags] = useState<Record<string, boolean>>({});
  const [selectedRelated, setSelectedRelated] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState(false);

  const allTagsSelected = useMemo(
    () => tags.length > 0 && tags.every((tag) => selectedTags[tag]),
    [tags, selectedTags],
  );
  const allRelatedSelected = useMemo(
    () => related.length > 0 && related.every((r) => selectedRelated[r.id]),
    [related, selectedRelated],
  );

  const toggleAllTags = (value: boolean) => {
    const next: Record<string, boolean> = {};
    if (value) tags.forEach((t) => (next[t] = true));
    setSelectedTags(next);
  };
  const toggleAllRelated = (value: boolean) => {
    const next: Record<string, boolean> = {};
    if (value) related.forEach((r) => (next[r.id] = true));
    setSelectedRelated(next);
  };

  const apply = async () => {
    setApplying(true);
    try {
      const tagsChosen = tags.filter((t) => selectedTags[t]);
      const relatedChosen = related.filter((r) => selectedRelated[r.id]).map((r) => r.id);
      await onApply({ tags: tagsChosen, relatedIds: relatedChosen });
      onOpenChange(false);
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('review.title')}</DialogTitle>
          <DialogDescription>{t('review.subtitle')}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="tags">
          <TabsList className="mb-3">
            <TabsTrigger value="tags">{t('review.tabs.tags')}</TabsTrigger>
            <TabsTrigger value="backlinks">{t('review.tabs.backlinks')}</TabsTrigger>
          </TabsList>

          <TabsContent value="tags">
            {tags.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t('review.empty.tags')}</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Checkbox checked={allTagsSelected} onCheckedChange={(v) => toggleAllTags(Boolean(v))} />
                  <span>{t('review.selectAll')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <label key={tag} className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-2.5 py-1">
                      <Checkbox checked={Boolean(selectedTags[tag])} onCheckedChange={(v) => setSelectedTags((s) => ({ ...s, [tag]: Boolean(v) }))} />
                      <Badge variant="secondary" className="text-xs">{tag}</Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="backlinks">
            {related.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t('review.empty.backlinks')}</div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Checkbox checked={allRelatedSelected} onCheckedChange={(v) => toggleAllRelated(Boolean(v))} />
                  <span>{t('review.selectAll')}</span>
                </div>
                <div className="divide-y rounded-md border">
                  {related.map((r) => (
                    <label key={r.id} className="flex cursor-pointer items-center gap-3 p-3">
                      <Checkbox checked={Boolean(selectedRelated[r.id])} onCheckedChange={(v) => setSelectedRelated((s) => ({ ...s, [r.id]: Boolean(v) }))} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.title ?? r.id}</div>
                        {r.summary ? <div className="truncate text-sm text-muted-foreground">{r.summary}</div> : null}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>{t('actions.close')}</Button>
          <Button onClick={apply} disabled={applying}>{applying ? t('review.applying') : t('review.apply')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


