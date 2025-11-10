import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResponsiveTableProps {
  data: any[];
  columns: {
    key: string;
    header: string;
    width?: number;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  className?: string;
  stickyHeader?: boolean;
  compactMode?: boolean;
}

export function ResponsiveTable({
  data,
  columns,
  className,
  stickyHeader = true,
  compactMode: propCompactMode
}: ResponsiveTableProps) {
  const { device, orientation } = useResponsiveLayout();
  const [currentPage, setCurrentPage] = useState(0);
  
  // Determine compact mode based on device
  const compactMode = propCompactMode ?? (device.isPhone || (device.isTablet && orientation.isPortrait));
  
  // Pagination for mobile
  const itemsPerPage = device.isPhone ? 5 : device.isTablet ? 10 : 20;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginatedData = compactMode 
    ? data.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
    : data;

  // Mobile card view
  if (device.isPhone) {
    return (
      <div className={cn("space-y-4", className)}>
        {paginatedData.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="rounded-lg border border-border/50 bg-card p-4 space-y-2"
          >
            {columns.map((column) => (
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
                key={rowIndex}
                className={cn(
                  "border-b border-border/30 transition-colors",
                  "hover:bg-muted/30"
                )}
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
