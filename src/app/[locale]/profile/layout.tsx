import { UnifiedHeader } from '@/components/navigation/UnifiedHeader';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <UnifiedHeader />
      <div className="flex-1">{children}</div>
    </div>
  );
}
