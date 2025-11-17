import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DailyClient = dynamicImport(() => import('./DailyClient'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  ),
});

export default function DailyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <DailyClient />
    </Suspense>
  );
}
