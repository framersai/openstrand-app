import { Suspense, useMemo } from 'react';
import { VisualizationConfig, VisualizationTier } from '@/lib/visualization/types';
import { loadVisualizationComponent } from '@/lib/visualization/loader';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  config: VisualizationConfig;
  onError?: (error: Error) => void;
}

export function VisualizationRouter({ config, onError }: Props) {
  const Component = useMemo(() => {
    try {
      return loadVisualizationComponent(config.tier, config.type);
    } catch (error) {
      onError?.(error as Error);
      // Fallback to static chart
      return loadVisualizationComponent(VisualizationTier.Static, 'chart');
    }
  }, [config.tier, config.type, onError]);

  return (
    <Suspense fallback={<VisualizationSkeleton />}>
      <Component {...config} />
    </Suspense>
  );
}

function VisualizationSkeleton() {
  return (
    <div className="w-full h-[400px] p-4">
      <Skeleton className="w-full h-full rounded-lg" />
      <div className="mt-2 flex justify-center">
        <span className="text-sm text-muted-foreground animate-pulse">
          Loading visualization...
        </span>
      </div>
    </div>
  );
}