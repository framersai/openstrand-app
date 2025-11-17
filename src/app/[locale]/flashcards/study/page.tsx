import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FlashcardsStudyClient = dynamicImport(() => import('./FlashcardsStudyClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

export default function FlashcardsStudyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <FlashcardsStudyClient />
    </Suspense>
  );
}
