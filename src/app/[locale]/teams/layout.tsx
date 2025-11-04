import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
      <UnifiedHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}

