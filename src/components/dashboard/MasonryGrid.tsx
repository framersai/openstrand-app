'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Grip, Move, X, Maximize2, Download, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasonryItem {
  id: string;
  content: ReactNode;
  height?: 'small' | 'medium' | 'large' | 'auto';
  width?: 1 | 2; // Column span
  order?: number;
}

interface MasonryGridProps {
  items: MasonryItem[];
  columns?: number;
  gap?: number;
  className?: string;
  onReorder?: (items: MasonryItem[]) => void;
  onRemove?: (id: string) => void;
  onEdit?: (id: string) => void;
  onMaximize?: (id: string) => void;
  editable?: boolean;
}

export function MasonryGrid({
  items: initialItems,
  columns = 3,
  gap = 16,
  className,
  onReorder,
  onRemove,
  onEdit,
  onMaximize,
  editable = true
}: MasonryGridProps) {
  const [items, setItems] = useState(initialItems);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [columnHeights, setColumnHeights] = useState<number[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);

  // Update items when props change
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  // Calculate column heights for optimal placement
  useEffect(() => {
    setColumnHeights(new Array(columns).fill(0));
  }, [columns]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setHoveredId(id);
  };

  const handleDragLeave = () => {
    setHoveredId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();

    if (!draggingId || draggingId === targetId) {
      setDraggingId(null);
      setHoveredId(null);
      return;
    }

    const newItems = [...items];
    const dragIndex = newItems.findIndex(item => item.id === draggingId);
    const dropIndex = newItems.findIndex(item => item.id === targetId);

    if (dragIndex !== -1 && dropIndex !== -1) {
      const [draggedItem] = newItems.splice(dragIndex, 1);
      newItems.splice(dropIndex, 0, draggedItem);
      setItems(newItems);
      onReorder?.(newItems);
    }

    setDraggingId(null);
    setHoveredId(null);
  };

  const getItemHeight = (height?: string) => {
    switch (height) {
      case 'small': return 'h-48';
      case 'medium': return 'h-64';
      case 'large': return 'h-96';
      case 'auto':
      default: return 'h-auto';
    }
  };

  const getItemWidth = (width?: number) => {
    switch (width) {
      case 2: return 'col-span-2';
      case 1:
      default: return 'col-span-1';
    }
  };

  return (
    <div
      ref={gridRef}
      className={cn(
        'grid gap-4 auto-rows-auto',
        `grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns}`,
        className
      )}
      style={{ gap: `${gap}px` }}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'relative group rounded-lg border bg-background/80 backdrop-blur transition-all duration-300',
            getItemHeight(item.height),
            getItemWidth(item.width),
            draggingId === item.id && 'opacity-50 scale-95',
            hoveredId === item.id && 'ring-2 ring-primary ring-offset-2',
            editable && 'cursor-move hover:shadow-lg hover:border-primary/50',
            'overflow-hidden'
          )}
          draggable={editable}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, item.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, item.id)}
        >
          {/* Drag handle */}
          {editable && (
            <div className="absolute top-2 left-2 right-2 z-10 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-background/80 backdrop-blur"
              >
                <Grip className="h-3 w-3" />
              </Button>

              <div className="flex gap-1">
                {onEdit && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 bg-background/80 backdrop-blur"
                    onClick={() => onEdit(item.id)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                )}
                {onMaximize && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 bg-background/80 backdrop-blur"
                    onClick={() => onMaximize(item.id)}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                )}
                {onRemove && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 bg-background/80 backdrop-blur hover:bg-destructive/20"
                    onClick={() => onRemove(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="h-full w-full p-4">
            {item.content}
          </div>
        </div>
      ))}
    </div>
  );
}

// Preset layouts for quick switching
export const masonryLayouts = {
  default: {
    columns: 3,
    gap: 16
  },
  compact: {
    columns: 4,
    gap: 8
  },
  wide: {
    columns: 2,
    gap: 24
  },
  single: {
    columns: 1,
    gap: 16
  }
} as const;

// Helper component for empty state
export function MasonryEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="mb-4 p-6 rounded-full bg-muted/30">
        <Move className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No visualizations yet</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm">
        Create your first visualization or upload a dataset to get started
      </p>
      {onAction && (
        <Button onClick={onAction} size="sm">
          Create Visualization
        </Button>
      )}
    </div>
  );
}