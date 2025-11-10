import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

interface ResponsiveVisualizationWrapperProps {
  children: React.ReactNode;
  className?: string;
  minHeight?: number;
  aspectRatio?: number;
  fullscreenEnabled?: boolean;
  onResize?: (width: number, height: number) => void;
}

export function ResponsiveVisualizationWrapper({
  children,
  className,
  minHeight = 300,
  aspectRatio,
  fullscreenEnabled = true,
  onResize
}: ResponsiveVisualizationWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { device, utils } = useResponsiveLayout();

  // Calculate responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let width = rect.width;
      let height = rect.height;

      // Apply aspect ratio if specified
      if (aspectRatio && !isFullscreen) {
        height = width / aspectRatio;
      }

      // Apply minimum height
      height = Math.max(height, minHeight);

      // Device-specific adjustments
      if (device.isPhone) {
        // Full width on phones
        width = window.innerWidth - utils.spacing(16);
        height = Math.max(height, 250);
      } else if (device.isTablet) {
        // Slightly reduced on tablets
        width = width * 0.95;
        height = Math.max(height, 350);
      }

      setDimensions({ width, height });
      onResize?.(width, height);
    };

    updateDimensions();

    // Create ResizeObserver for container
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen to window resize
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [aspectRatio, device.isPhone, device.isTablet, isFullscreen, minHeight, onResize, utils]);

  // Fullscreen handling
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border/50 bg-background/50",
        isFullscreen && "fixed inset-0 z-50 border-0 rounded-none bg-background",
        className
      )}
      style={{
        minHeight: isFullscreen ? '100vh' : `${minHeight}px`,
        height: aspectRatio && !isFullscreen ? `${dimensions.height}px` : undefined
      }}
    >
      {/* Fullscreen button */}
      {fullscreenEnabled && (
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            "absolute top-2 right-2 z-10 h-8 w-8",
            "bg-background/80 backdrop-blur-sm hover:bg-background/90",
            isFullscreen && "top-4 right-4 h-10 w-10"
          )}
          onClick={toggleFullscreen}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Render children with dimensions */}
      <div className="h-full w-full">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              width: dimensions.width,
              height: dimensions.height,
              isFullscreen
            });
          }
          return child;
        })}
      </div>
    </div>
  );
}
