/**
 * Haptic Feedback Utilities
 * 
 * Provides cross-platform haptic feedback for mobile devices.
 * Gracefully degrades on unsupported browsers.
 * 
 * @example
 * ```typescript
 * import { haptic } from '@/lib/haptics';
 * 
 * haptic.light(); // Quick tap
 * haptic.medium(); // Button press
 * haptic.heavy(); // Success/error
 * haptic.success(); // Achievement unlocked
 * ```
 */

type HapticIntensity = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type HapticPattern = 'success' | 'warning' | 'error' | 'selection';

class HapticService {
  private isSupported: boolean;
  private isEnabled: boolean;

  constructor() {
    this.isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
    
    // Check user preferences
    const savedPref = typeof window !== 'undefined' 
      ? localStorage.getItem('hapticsEnabled')
      : null;
    
    this.isEnabled = savedPref === null ? true : savedPref === 'true';
  }

  /**
   * Light tap (selection, hover)
   */
  light(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate(10);
  }

  /**
   * Medium tap (button press, toggle)
   */
  medium(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate(20);
  }

  /**
   * Heavy tap (important action, error)
   */
  heavy(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate(50);
  }

  /**
   * Rigid feedback (start recording, lock)
   */
  rigid(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate([10, 10, 10]);
  }

  /**
   * Soft feedback (notification, hint)
   */
  soft(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate([5, 10, 5]);
  }

  /**
   * Success pattern (achievement, completion)
   */
  success(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate([30, 20, 30, 20, 50]);
  }

  /**
   * Warning pattern (quota warning, validation error)
   */
  warning(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate([20, 10, 20]);
  }

  /**
   * Error pattern (failure, critical alert)
   */
  error(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate([50, 30, 50, 30, 100]);
  }

  /**
   * Selection pattern (menu item, card flip)
   */
  selection(): void {
    if (!this.canVibrate()) return;
    navigator.vibrate(5);
  }

  /**
   * Custom pattern
   */
  pattern(pattern: number | number[]): void {
    if (!this.canVibrate()) return;
    navigator.vibrate(pattern);
  }

  /**
   * Enable/disable haptics
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('hapticsEnabled', String(enabled));
    }
  }

  /**
   * Check if haptics are enabled and supported
   */
  canVibrate(): boolean {
    return this.isSupported && this.isEnabled;
  }

  /**
   * Check if device supports haptics
   */
  isDeviceSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get enabled status
   */
  isHapticsEnabled(): boolean {
    return this.isEnabled;
  }
}

// Singleton instance
export const haptic = new HapticService();

/**
 * React hook for haptic feedback
 */
export function useHaptic() {
  return {
    haptic,
    light: () => haptic.light(),
    medium: () => haptic.medium(),
    heavy: () => haptic.heavy(),
    success: () => haptic.success(),
    warning: () => haptic.warning(),
    error: () => haptic.error(),
    selection: () => haptic.selection(),
    pattern: (pattern: number | number[]) => haptic.pattern(pattern),
    setEnabled: (enabled: boolean) => haptic.setEnabled(enabled),
    isSupported: haptic.isDeviceSupported(),
    isEnabled: haptic.isHapticsEnabled(),
  };
}

