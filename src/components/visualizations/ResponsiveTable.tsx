import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponsiveTableColumn {
  key: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
  /** Hide column in card/mobile view */
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps {
  data: any[];
  columns: ResponsiveTableColumn[];
  className?: string;
  stickyHeader?: boolean;
  compactMode?: boolean;
  /** Force view mode */
  view?: 'auto' | 'cards' | 'table';
  /** Called when a row is clicked */
  onRowClick?: (row: any) => void;
  /** Custom row key generator */
  rowKey?: (row: any, index: number) => React.Key;
  /** Empty state message */
  emptyMessage?: string;
}

export function ResponsiveTable({
  data,
  columns,
  className,
  stickyHeader = true,
  compactMode: propCompactMode,
  view = 'auto',
  onRowClick,
  rowKey,
  emptyMessage = 'No data available'
}: ResponsiveTableProps) {
  const { device, orientation } = useResponsiveLayout();
  const [currentPage, setCurrentPage] = useState(0);
  
  // Determine compact mode based on device
  const derivedCompactMode = propCompactMode ?? (device.isPhone || (device.isTablet && orientation.isPortrait));
  const isCardView = view === 'cards' || (view === 'auto' && derivedCompactMode);
  const isTableView = view === 'table' || (view === 'auto' && !derivedCompactMode);
  
  // Pagination for mobile
  const itemsPerPage = device.isPhone ? 5 : device.isTablet ? 10 : 20;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const shouldPaginate = isCardView;
  const paginatedData = shouldPaginate 
    ? data.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    : data;

  if (!data.length) {
    return (
      <div className={cn('rounded-lg border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground', className)}>
        {emptyMessage}
      </div>
    );
  }
  
  const getRowKey = (row: any, index: number) =>
    rowKey ? rowKey(row, index) : index;

  // Mobile card view
  if (isCardView) {
    return (
      <div className={cn("space-y-4", className)}>
        {paginatedData.map((row, rowIndex) => (
          <div
            key={getRowKey(row, rowIndex)}
            className={cn(
              "rounded-lg border border-border/50 bg-card p-4 space-y-2 transition-all",
              onRowClick && "cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
            )}
            onClick={() => onRowClick?.(row)}
          >
            {columns
              .filter((column) => !column.hideOnMobile)
              .map((column) => (
                <div key={column.key} className="flex justify-between items-start gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {column.header}:
                  </span>
                  <span className="text-sm text-right">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </span>
                </div>
              ))}
          </div>
        ))}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Tablet and desktop table view
  if (!isTableView) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full">
          <thead className={cn(
            "border-b border-border/50 bg-muted/50",
            stickyHeader && "sticky top-0 z-10"
          )}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left font-medium",
                    device.isTablet && "px-3 py-2 text-sm",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right"
                  )}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={cn(
                  "border-b border-border/30 transition-colors",
                  "hover:bg-muted/30",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3",
                      device.isTablet && "px-3 py-2 text-sm",
                      column.align === 'center' && "text-center",
                      column.align === 'right' && "text-right"
                    )}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination for tablets */}
      {device.isTablet && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentPage + 1} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
