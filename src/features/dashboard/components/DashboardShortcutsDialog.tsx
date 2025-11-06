'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ShortcutItem {
  keys: string;
  label: string;
}

interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

export interface DashboardShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardShortcutsDialog({ open, onOpenChange }: DashboardShortcutsDialogProps) {
  const groups: ShortcutGroup[] = [
    {
      title: 'Global',
      items: [
        { keys: 'Ctrl/Cmd+K', label: 'Open Command Palette' },
        { keys: 'Shift+/', label: 'Open this Shortcuts dialog' },
      ],
    },
    {
      title: 'Dashboard',
      items: [
        { keys: 'Shift+U', label: 'Open Upload panel' },
        { keys: 'Shift+A', label: 'Run Auto Insights' },
        { keys: 'Shift+V', label: 'Open Visualize panel' },
        { keys: 'Shift+C', label: 'Clear all visualizations' },
        { keys: 'Shift+S', label: 'Open Settings' },
      ],
    },
    {
      title: 'Layout',
      items: [
        { keys: 'Ctrl/Cmd+B', label: 'Toggle Sidebar' },
        { keys: 'Ctrl/Cmd+S', label: 'Toggle Status Bar' },
        { keys: 'Alt+1/2/3/0', label: 'Layout Presets (Focused/Balanced/Overview/Zen)' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Boost your productivity with quick actions.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 pt-2">
          {groups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{group.title}</h4>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={`${group.title}-${item.keys}`} className="flex items-center justify-between rounded-md border border-border/60 bg-background/70 px-3 py-2">
                    <span className="text-sm text-foreground/90">{item.label}</span>
                    <span className="rounded border border-border/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">{item.keys}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}


