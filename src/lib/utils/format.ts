/**
 * Formatting utilities for consistent text display
 */

/**
 * Convert a string to Title Case
 * Handles snake_case, camelCase, and kebab-case
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  // Split on common separators and case boundaries
  const words = str
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase
    .replace(/[_-]/g, ' ') // snake_case and kebab-case
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
  
  // Capitalize first letter of each word
  return words
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a string to Sentence case
 * Only capitalizes the first word
 */
export function toSentenceCase(str: string): string {
  if (!str) return '';
  
  const normalized = str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .toLowerCase();
  
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

/**
 * Format a column name for display
 * e.g., "user_id" -> "User ID", "firstName" -> "First Name"
 */
export function formatColumnName(name: string): string {
  if (!name) return '';
  
  // Common abbreviations that should be uppercase
  const abbreviations = ['id', 'url', 'api', 'ui', 'ip', 'uuid', 'sql', 'html', 'css', 'js'];
  
  const words = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean);
  
  return words
    .map(word => {
      if (abbreviations.includes(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Format a chart type for display
 * e.g., "bar" -> "Bar Chart", "scatter" -> "Scatter Plot"
 */
export function formatChartType(type: string): string {
  if (!type) return 'Chart';
  
  const chartTypeMap: Record<string, string> = {
    bar: 'Bar Chart',
    line: 'Line Chart',
    pie: 'Pie Chart',
    doughnut: 'Doughnut Chart',
    scatter: 'Scatter Plot',
    radar: 'Radar Chart',
    table: 'Data Table',
    'force-graph': 'Force Graph',
    'd3-force': 'Force Graph',
    '3d-scatter': '3D Scatter',
    'three-scatter': '3D Scatter',
    heatmap: 'Heatmap',
    treemap: 'Treemap',
    sankey: 'Sankey Diagram',
  };
  
  return chartTypeMap[type.toLowerCase()] || toTitleCase(type);
}

/**
 * Format aggregation type for display
 */
export function formatAggregation(agg: string): string {
  if (!agg || agg === 'none') return '';
  
  const aggMap: Record<string, string> = {
    sum: 'Sum',
    avg: 'Average',
    count: 'Count',
    min: 'Minimum',
    max: 'Maximum',
    median: 'Median',
  };
  
  return aggMap[agg.toLowerCase()] || toTitleCase(agg);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Format a number with appropriate precision
 */
export function formatNumber(num: number, precision: number = 2): string {
  if (Number.isInteger(num)) return num.toLocaleString();
  return num.toLocaleString(undefined, { 
    minimumFractionDigits: 0,
    maximumFractionDigits: precision 
  });
}

/**
 * Format percentage
 */
export function formatPercent(value: number, precision: number = 0): string {
  return `${(value * 100).toFixed(precision)}%`;
}

