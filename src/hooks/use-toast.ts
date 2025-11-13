import { toast, ToastOptions } from 'react-hot-toast';

/**
 * Simple wrapper to match the `useToast` API expected by legacy code.
 * Returns an object with a `toast` function that forwards options to `react-hot-toast`.
 */
export const useToast = () => {
  return {
    toast: (opts: ToastOptions & {
      title?: string;
      description?: string;
      action?: { label: string; onClick: () => void };
    }) => {
      // For richer objects (title/description), map to unified string.
      if (opts.title || opts.description) {
        const combined = [opts.title, opts.description].filter(Boolean).join(' - ');
        toast(combined, opts);
      } else {
        toast(opts as any);
      }
    },
  };
};

export { toast } from 'react-hot-toast';
