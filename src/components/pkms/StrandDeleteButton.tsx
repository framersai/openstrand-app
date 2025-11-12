'use client';

import { useState, useRef, useEffect } from 'react';
import { Trash2, Shield, Link2, SquareDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslations } from 'next-intl';
import { toast } from 'react-hot-toast';
import { openstrandAPI } from '@/services/openstrand.api';

interface StrandDeleteButtonProps {
  strandId: string;
  onDeleted?: () => void;
}

export function StrandDeleteButton({ strandId, onDeleted }: StrandDeleteButtonProps) {
  const t = useTranslations('pkms');
  const [open, setOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState(true);
  const [removeDerivatives, setRemoveDerivatives] = useState(false);
  const [removeIncoming, setRemoveIncoming] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const startDeferredDelete = () => {
    setPending(true);
    const toastId = toast(
      (tProps) => (
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">{t('delete.toast')}</div>
          <Button variant="secondary" size="sm" onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); toast.dismiss(tProps.id); setPending(false); }}>
            {t('delete.undo')}
          </Button>
        </div>
      ),
      { duration: 3000, id: `delete-${strandId}` }
    );

    timerRef.current = setTimeout(async () => {
      toast.dismiss(toastId);
      // Execute server-side delete
      try {
        // If placeholder selected, we could do an update to leave a tombstone; for now we perform hard delete per spec after timer.
        await openstrandAPI.strands.delete(strandId);
        toast.success(t('delete.done'));
        onDeleted?.();
      } catch (e) {
        toast.error(t('delete.error'));
      } finally {
        setPending(false);
      }
    }, 3000);
  };

  return (
    <>
      <Button variant="destructive" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" /> {t('delete.action')}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delete.title')}</DialogTitle>
            <DialogDescription>{t('delete.subtitle')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={placeholder} onCheckedChange={(v) => setPlaceholder(Boolean(v))} />
              <span className="inline-flex items-center gap-1"><SquareDashed className="h-4 w-4" /> {t('delete.placeholder')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={removeDerivatives} onCheckedChange={(v) => setRemoveDerivatives(Boolean(v))} />
              <span className="inline-flex items-center gap-1"><Shield className="h-4 w-4" /> {t('delete.derived')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={removeIncoming} onCheckedChange={(v) => setRemoveIncoming(Boolean(v))} />
              <span className="inline-flex items-center gap-1"><Link2 className="h-4 w-4" /> {t('delete.incoming')}</span>
            </label>
            <p className="text-xs text-muted-foreground">{t('delete.warning')}</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>{t('actions.close')}</Button>
            <Button variant="destructive" onClick={() => { setOpen(false); startDeferredDelete(); }} disabled={pending}>
              {pending ? t('delete.pending') : t('delete.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


