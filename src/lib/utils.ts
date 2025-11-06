/**
 * @module lib/utils
 * @description Utility functions for the application.
 * Includes classname merging, formatting helpers, and data transformations.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge classnames with tailwind-merge and clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as currency
 */
export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format number with abbreviation (1.2K, 3.4M, etc)
 */
export function formatCompactNumber(value: number): string {
  if (value < 1000) return value.toString();
  if (value < 1000000) return `${(value / 1000).toFixed(1)}K`;
  if (value < 1000000000) return `${(value / 1000000).toFixed(1)}M`;
  return `${(value / 1000000000).toFixed(1)}B`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  
  return formatDate(date);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Generate unique ID
 */
export function generateId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Parse CSV string to array of objects
 */
export function parseCSV(csvString: string): Record<string, any>[] {
  const lines = csvString.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      // Try to parse numbers
      const numValue = Number(value);
      row[header] = isNaN(numValue) ? value : numValue;
    });
    
    data.push(row);
  }
  
  return data;
}

/**
 * Download data as file
 */
export function downloadFile(data: string, filename: string, type = 'text/plain'): void {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Infer data type from values
 */
export function inferDataType(values: any[]): 'number' | 'date' | 'category' | 'string' {
  const sample = values.filter(v => v != null).slice(0, 100);
  
  // Check if all are numbers
  if (sample.every(v => typeof v === 'number' || !isNaN(Number(v)))) {
    return 'number';
  }
  
  // Check if dates
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{2}\/\d{2}\/\d{4}$/,
    /^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/,
  ];
  
  if (sample.every(v => datePatterns.some(p => p.test(String(v))))) {
    return 'date';
  }
  
  // Check if categorical (limited unique values)
  const uniqueValues = new Set(sample);
  if (uniqueValues.size < sample.length * 0.5 && uniqueValues.size < 20) {
    return 'category';
  }
  
  return 'string';
}

/**
 * Generate chart colors
 */
export function generateChartColors(count: number): string[] {
  const colors = [
    'rgba(54, 162, 235, 0.8)',   // Blue
    'rgba(255, 99, 132, 0.8)',   // Red
    'rgba(75, 192, 192, 0.8)',   // Teal
    'rgba(255, 206, 86, 0.8)',   // Yellow
    'rgba(153, 102, 255, 0.8)',  // Purple
    'rgba(255, 159, 64, 0.8)',   // Orange
    'rgba(46, 204, 113, 0.8)',   // Green
    'rgba(231, 76, 60, 0.8)',    // Dark Red
    'rgba(52, 152, 219, 0.8)',   // Light Blue
    'rgba(155, 89, 182, 0.8)',   // Violet
  ];
  
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length]);
  }
  return result;
}
