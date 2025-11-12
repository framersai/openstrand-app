'use client';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useComposerPreferences } from '@/features/composer/hooks/useComposerPreferences';
import { useTranslations } from 'next-intl';

interface PKMSPreferencesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PKMSPreferencesModal({ open, onOpenChange }: PKMSPreferencesModalProps) {
  const [prefs, updatePrefs] = useComposerPreferences();
  const t = useTranslations('pkms');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg ring-1 ring-primary/30 border-primary/30">
        <div className="h-1 w-full rounded-t-3xl bg-gradient-to-r from-primary/40 via-accent/30 to-transparent" />
        <DialogHeader>
          <DialogTitle>{t('preferences.title')}</DialogTitle>
          <DialogDescription>{t('preferences.subtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="space-y-2">
            <div className="text-sm font-medium">{t('preferences.sections.metadata')}</div>
            <div className="grid gap-3">
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">{t('preferences.fields.autosave')}</span>
                <Switch checked={prefs.autosave} onCheckedChange={(v) => updatePrefs({ autosave: Boolean(v) })} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">{t('preferences.fields.autoTag')}</span>
                <Switch checked={prefs.autoTag} onCheckedChange={(v) => updatePrefs({ autoTag: Boolean(v) })} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">{t('preferences.fields.autoBacklinks')}</span>
                <Switch checked={prefs.autoBacklinks} onCheckedChange={(v) => updatePrefs({ autoBacklinks: Boolean(v) })} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">{t('preferences.fields.reviewBeforeApply')}</span>
                <Switch checked={prefs.reviewBeforeApply} onCheckedChange={(v) => updatePrefs({ reviewBeforeApply: Boolean(v) })} />
              </label>
              <label className="flex items-center justify-between gap-3">
                <span className="text-sm">{t('preferences.fields.maxBacklinks')}</span>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  className="w-24"
                  value={prefs.maxBacklinks}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) updatePrefs({ maxBacklinks: Math.max(0, Math.min(10, n)) });
                  }}
                />
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>{t('actions.close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


