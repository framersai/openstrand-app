'use client';

/**
 * @module ChartDisplay
 * @description Tier 1 visualization component for Chart.js charts
 * Handles bar, line, pie, doughnut, scatter, and radar charts
 */

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter, Radar } from 'react-chartjs-2';
import { Visualization } from '@/types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

interface ChartDisplayProps {
  /** Full visualization object */
  visualization: Visualization;
  /** Additional chart options */
  options?: ChartOptions;
  /** Class name for styling */
  className?: string;
}

export interface ChartDisplayRef {
  exportAsImage: () => string | undefined;
}

/**
 * ChartDisplay component for rendering Chart.js visualizations
 * This is the Tier 1 visualization component for static charts
 */
const ChartDisplay = forwardRef<ChartDisplayRef, ChartDisplayProps>(
  ({ visualization, options: additionalOptions, className }, ref) => {
    const chartRef = useRef<any>(null);

    /**
     * Get chart options based on visualization config
     */
    const getChartOptions = (): ChartOptions => {
      const defaultOptions: ChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top' as const,
            labels: {
              boxWidth: 12,
              padding: 15,
              font: {
                size: 11,
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            cornerRadius: 8,
            titleFont: {
              size: 13,
              weight: 'bold',
            },
            bodyFont: {
              size: 12,
            },
          },
          title: visualization.title ? {
            display: true,
            text: visualization.title,
            font: {
              size: 16,
              weight: 'bold',
            },
            padding: {
              top: 10,
              bottom: 20,
            },
          } : undefined,
        },
      };

      // Merge with custom config and additional options
      return {
        ...defaultOptions,
        ...visualization.config?.chartOptions,
        ...additionalOptions,
      };
    };

    /**
     * Export chart as base64 image
     */
    const exportAsImage = (): string | undefined => {
      if (chartRef.current) {
        return chartRef.current.toBase64Image();
      }
      return undefined;
    };

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      exportAsImage,
    }));

    /**
     * Get chart component based on visualization type
     * Handles multiple data formats from the backend:
     * - visualization.type directly (e.g., 'bar', 'line')
     * - visualization.config?.chartType (e.g., 'bar', 'line')
     * - visualization.data?.type === 'chart' with data.chartType
     */
    const getChartComponent = () => {
      // Determine the actual chart type from various possible locations
      const vizData = visualization.data as any;
      const chartType = 
        // Direct type on visualization
        (visualization.type !== 'chart' && visualization.type) ||
        // From config
        (visualization.config as any)?.chartType ||
        // From data object (backend format)
        vizData?.chartType ||
        // Fallback to visualization.type even if it's 'chart'
        visualization.type;

      // Get the actual chart data - it might be nested
      const chartData = vizData?.data || vizData;

      const chartProps = {
        ref: chartRef,
        data: chartData as any,
        options: getChartOptions() as ChartOptions<any>,
      };

      switch (chartType) {
        case 'bar':
          return <Bar {...chartProps} />;
        case 'line':
          return <Line {...chartProps} />;
        case 'pie':
          return <Pie {...chartProps} />;
        case 'doughnut':
          return <Doughnut {...chartProps} />;
        case 'scatter':
          return <Scatter {...chartProps} />;
        case 'radar':
          return <Radar {...chartProps} />;
        case 'chart':
          // If type is still 'chart', try to infer from data structure
          if (chartData?.datasets?.[0]?.data?.[0]?.x !== undefined) {
            return <Scatter {...chartProps} />;
          }
          // Default to bar chart
          return <Bar {...chartProps} />;
        default:
          return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Unsupported chart type: {chartType}</p>
            </div>
          );
      }
    };

    return (
      <div className={className || 'w-full h-full'}>
        {getChartComponent()}
      </div>
    );
  }
);

ChartDisplay.displayName = 'ChartDisplay';

export default ChartDisplay;
