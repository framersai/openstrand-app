import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FolderOpen } from 'lucide-react';

/**
 * Hook that listens for first-time mirror completion and shows a toast
 * with a link to open the content root in Finder/Explorer.
 */
export function useMirrorToast() {
  const { toast } = useToast();

  useEffect(() => {
    // Check if we've already shown the first mirror toast
    const hasShownToast = localStorage.getItem('first_mirror_toast_shown');
    if (hasShownToast) {
      return;
    }

    // Listen for mirror completion events
    const handleMirrorComplete = (event: CustomEvent) => {
      const { contentRootPath, isFirstMirror } = event.detail;

      if (!isFirstMirror) {
        return;
      }

      // Mark as shown
      localStorage.setItem('first_mirror_toast_shown', 'true');

      // Show toast with action
      toast({
        title: 'Backup Complete! 🎉',
        description: `Your notes are now mirrored to ${contentRootPath}`,
        duration: 10000,
        action: {
          label: 'Open Folder',
          onClick: () => {
            handleOpenFolder(contentRootPath);
          },
        },
      });
    };

    window.addEventListener('mirror:complete', handleMirrorComplete as EventListener);

    return () => {
      window.removeEventListener('mirror:complete', handleMirrorComplete as EventListener);
    };
  }, [toast]);

  const handleOpenFolder = (path: string) => {
    // For Electron/desktop apps, we'd use IPC to open the folder
    // For web, show a helpful message
    if (typeof (window as any).electron !== 'undefined') {
      // Electron IPC call
      (window as any).electron.shell.openPath(path);
    } else {
      // Web fallback: copy path to clipboard
      navigator.clipboard.writeText(path).then(() => {
        toast({
          title: 'Path Copied',
          description: 'Content root path copied to clipboard. Open it in your file manager.',
        });
      });
    }
  };
}

/**
 * Utility function to emit mirror completion events.
 * Call this from your mirror service after successful sync.
 */
export function emitMirrorComplete(contentRootPath: string, isFirstMirror: boolean) {
  const event = new CustomEvent('mirror:complete', {
    detail: { contentRootPath, isFirstMirror },
  });
  window.dispatchEvent(event);
}

