'use client';

/**
 * @module TableDisplay
 * @description Tier 1 visualization component for data tables
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Visualization } from '@/types';

interface TableDisplayProps {
  /** Full visualization object */
  visualization: Visualization;
  /** Additional styling */
  className?: string;
  /** Max height for scrollable tables */
  maxHeight?: string;
}

/**
 * TableDisplay component for rendering data tables
 * This is the Tier 1 visualization component for tabular data
 */
export default function TableDisplay({
  visualization,
  className,
  maxHeight = '500px'
}: TableDisplayProps) {
  const data = visualization.data as {
    columns?: Array<{
      key: string;
      header?: string;
      align?: 'left' | 'center' | 'right';
      format?: (value: any) => string;
    }>;
    rows?: Array<Record<string, any>>;
  };

  const { columns = [], rows = [] } = data;

  if (columns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No columns defined for table</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-auto scrollbar-thin",
        className
      )}
      style={{ maxHeight }}
    >
      <table className="w-full data-table">
        <thead className="sticky top-0 bg-background border-b">
          <tr>
            {columns.map((col, index) => (
              <th
                key={`${col.key}-${index}`}
                className={cn(
                  'px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right'
                )}
              >
                {col.header || col.key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No data available
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="hover:bg-muted/50 transition-colors"
              >
                {columns.map((col, colIndex) => (
                  <td
                    key={`${rowIndex}-${col.key}-${colIndex}`}
                    className={cn(
                      'px-4 py-2 text-sm',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.format
                      ? col.format(row[col.key])
                      : row[col.key] ?? '-'
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}