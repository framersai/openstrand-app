/**
 * Shared formatting utilities for display in the dashboard.
 */

export function formatBytes(bytes: number | undefined | null): string {
  if (!Number.isFinite(bytes ?? Number.NaN) || (bytes ?? 0) <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'] as const;
  let value = bytes as number;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  const precision = value >= 10 || index === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[index]}`;
}

export function formatDate(isoString: string | undefined | null): string {
  if (!isoString) {
    return 'Unknown';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return date.toLocaleDateString();
}

