'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';

import { ProductTourOverlay } from '@/components/help/ProductTourOverlay';

interface ProductTourSection {
  id: string;
  title: string;
  content: string;
}

type TourMode = 'modal' | 'docked';

interface OpenOptions {
  sectionId?: string;
  dock?: boolean;
}

interface ProductTourContextValue {
  isOpen: boolean;
  mode: TourMode;
  sections: ProductTourSection[];
  currentSectionId: string | null;
  loading: boolean;
  error: string | null;
  openTour: (options?: OpenOptions) => Promise<void>;
  closeTour: () => void;
  selectSection: (id: string) => void;
  goNext: () => void;
  goPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  setDocked: (docked: boolean) => void;
  retry: () => void;
}

const ProductTourContext = createContext<ProductTourContextValue | undefined>(undefined);

const SECTION_STORAGE_KEY = 'openstrand:tour:section';
const MODE_STORAGE_KEY = 'openstrand:tour:mode';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Splits the product tour markdown into top-level sections based on H2 headers.
 */
function parseSections(markdown: string): ProductTourSection[] {
  const normalized = markdown.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');

  const sections: ProductTourSection[] = [];
  let currentTitle: string | null = null;
  let buffer: string[] = [];

  const pushCurrent = () => {
    if (!currentTitle) {
      return;
    }
    const content = buffer.join('\n').trim();
    sections.push({
      id: slugify(currentTitle),
      title: currentTitle,
      content,
    });
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (line.startsWith('# ')) {
      // Ignore top-level heading (document title).
      continue;
    }

    if (line.startsWith('## ')) {
      // Starting a new section.
      if (buffer.length > 0 || currentTitle) {
        pushCurrent();
      }
      currentTitle = line.replace(/^##\s+/, '').trim();
      buffer = [];
      continue;
    }

    // Accumulate introduction copy before the first heading.
    if (!currentTitle) {
      currentTitle = 'Overview';
    }

    buffer.push(line);
  }

  if (currentTitle) {
    pushCurrent();
  }

  return sections.filter((section) => section.content.length > 0);
}

/**
 * Provides state and helpers for the dockable product tour overlay.
 * Renders the overlay once so any consumer can open it without prop drilling.
 */
export function ProductTourProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<TourMode>('modal');
  const [sections, setSections] = useState<ProductTourSection[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSectionId, setPendingSectionId] = useState<string | null>(null);
  const initialSectionAppliedRef = useRef(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/docs/product-tour');
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to load product tour content.');
      }
      const parsed = parseSections(String(payload.content ?? ''));
      setSections(parsed);
      setCurrentIndex((prev) => (parsed.length > 0 ? Math.min(prev, parsed.length - 1) : 0));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load product tour content.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedSection = window.localStorage.getItem(SECTION_STORAGE_KEY);
    if (storedSection) {
      setPendingSectionId(storedSection);
    }
    const storedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
    if (storedMode === 'docked' || storedMode === 'modal') {
      setMode(storedMode);
    }
  }, []);

  const ensureLoaded = useCallback(async () => {
    if (sections.length > 0 || loading) {
      return;
    }
    await fetchContent();
  }, [sections.length, loading, fetchContent]);

  const openTour = useCallback(
    async (options?: OpenOptions) => {
      await ensureLoaded();

      if (options?.sectionId) {
        setPendingSectionId(options.sectionId);
        const targetIndex = sections.findIndex((section) => section.id === options.sectionId);
        if (targetIndex >= 0) {
          setCurrentIndex(targetIndex);
        }
      }

      const desiredMode =
        options?.dock === true
          ? 'docked'
          : options?.dock === false
          ? 'modal'
          : (() => {
              if (typeof window === 'undefined') return mode;
              const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
              if (stored === 'docked' || stored === 'modal') {
                return stored;
              }
              return 'modal';
            })();

      setMode(desiredMode);

      setIsOpen(true);

      // If content failed to load earlier we retry.
      if (!loading && sections.length === 0 && !error) {
        await fetchContent();
      }
    },
    [ensureLoaded, sections, loading, error, fetchContent, mode],
  );

  const closeTour = useCallback(() => {
    setIsOpen(false);
  }, []);

  const selectSection = useCallback(
    (id: string) => {
      const targetIndex = sections.findIndex((section) => section.id === id);
      if (targetIndex >= 0) {
        setCurrentIndex(targetIndex);
      }
    },
    [sections],
  );

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, sections.length - 1));
  }, [sections.length]);

  const goPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const retry = useCallback(() => {
    void fetchContent();
  }, [fetchContent]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const current = sections[currentIndex];
    if (current) {
      window.localStorage.setItem(SECTION_STORAGE_KEY, current.id);
    }
  }, [currentIndex, sections]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (!pendingSectionId || sections.length === 0) {
      return;
    }
    const targetIndex = sections.findIndex((section) => section.id === pendingSectionId);
    if (targetIndex >= 0) {
      setCurrentIndex(targetIndex);
      setPendingSectionId(null);
      return;
    }
  }, [pendingSectionId, sections]);

  useEffect(() => {
    if (initialSectionAppliedRef.current || sections.length === 0) {
      return;
    }
    initialSectionAppliedRef.current = true;

    if (pendingSectionId) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }
    const storedSection = window.localStorage.getItem(SECTION_STORAGE_KEY);
    if (storedSection) {
      const targetIndex = sections.findIndex((section) => section.id === storedSection);
      if (targetIndex >= 0) {
        setCurrentIndex(targetIndex);
      }
    }
  }, [sections, pendingSectionId]);

  const value = useMemo<ProductTourContextValue>(() => {
    const current = sections[currentIndex];

    return {
      isOpen,
      mode,
      sections,
      currentSectionId: current?.id ?? null,
      loading,
      error,
      openTour,
      closeTour,
      selectSection,
      goNext,
      goPrevious,
      canGoNext: currentIndex < sections.length - 1,
      canGoPrevious: currentIndex > 0,
      setDocked: (docked) => setMode(docked ? 'docked' : 'modal'),
      retry,
    };
  }, [
    closeTour,
    currentIndex,
    error,
    goNext,
    goPrevious,
    isOpen,
    loading,
    mode,
    openTour,
    sections,
    selectSection,
    retry,
  ]);

  return (
    <ProductTourContext.Provider value={value}>
      {children}
      <ProductTourOverlay />
    </ProductTourContext.Provider>
  );
}

/**
 * Access the product tour context. Throws when used outside of the provider
 * to make misconfiguration evident during development.
 */
export function useProductTour(): ProductTourContextValue {
  const context = useContext(ProductTourContext);
  if (!context) {
    throw new Error('useProductTour must be used within a ProductTourProvider');
  }
  return context;
}
