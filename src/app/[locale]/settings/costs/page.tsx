import { CostUsagePanel } from '@/components/settings/CostUsagePanel';

export default function CostsSettingsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Usage & Costs</h1>
        <p className="text-muted-foreground">
          Track your AI spending, view usage analytics, and export records for billing.
        </p>
      </div>

      <CostUsagePanel />
    </div>
  );
}

