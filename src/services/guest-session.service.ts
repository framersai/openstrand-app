/**
 * Guest Session Service
 * Manages guest users, credits, preferences, and data persistence
 */

import { v4 as uuidv4 } from 'uuid';

function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export interface GuestSession {
  id: string;
  createdAt: string;
  lastActiveAt: string;
  ipAddress?: string;
  credits: GuestCredits;
  preferences: GuestPreferences;
  favorites: GuestFavorites;
  usage: GuestUsage;
  metadata: Record<string, any>;
}

export interface GuestCredits {
  openai: {
    daily: number;
    used: number;
    resetAt: string;
  };
  visualizations: {
    daily: number;
    used: number;
    resetAt: string;
  };
  datasets: {
    daily: number;
    used: number;
    resetAt: string;
  };
}

export interface GuestPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultProvider: string;
  defaultModel: string;
  useHeuristics: boolean;
  autoInsights: boolean;
  expandedSections: Record<string, boolean>;
  tourCompleted: boolean;
}

export interface GuestFavorites {
  datasets: string[];
  visualizations: string[];
  prompts: string[];
  tags: string[];
}

export interface GuestUsage {
  totalVisualizations: number;
  totalDatasets: number;
  totalPrompts: number;
  firstUsedAt: string;
  lastUsedAt: string;
  dailyStats: DailyUsageStat[];
}

export interface DailyUsageStat {
  date: string;
  visualizations: number;
  datasets: number;
  openaiCredits: number;
}

const STORAGE_KEYS = {
  SESSION: 'guest_session',
  CREDITS: 'guest_credits',
  PREFERENCES: 'guest_preferences',
  FAVORITES: 'guest_favorites',
  USAGE: 'guest_usage',
} as const;

const DEFAULT_CREDITS = {
  openai: { daily: 100, used: 0 },
  visualizations: { daily: 999999, used: 0 }, // Unlimited for guests
  datasets: { daily: 50, used: 0 },
};

const DEFAULT_PREFERENCES: GuestPreferences = {
  theme: 'system',
  language: 'en',
  defaultProvider: 'openrouter',
  defaultModel: 'gpt-3.5-turbo',
  useHeuristics: true,
  autoInsights: false,
  expandedSections: {},
  tourCompleted: false,
};

class GuestSessionService {
  private session: GuestSession | null = null;
  private ipAddress: string | null = null;

  constructor() {
    this.initializeSession();
    this.fetchIpAddress();
  }

  /**
   * Initialize or restore guest session
   */
  private initializeSession(): void {
    const storedSession = this.getStoredSession();

    if (storedSession && this.isSessionValid(storedSession)) {
      this.session = storedSession;
      this.checkAndResetDailyLimits();
    } else {
      this.createNewSession();
    }

    this.updateLastActive();
  }

  /**
   * Create a new guest session
   */
  private createNewSession(): void {
    const now = new Date().toISOString();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    this.session = {
      id: `guest_${uuidv4()}`,
      createdAt: now,
      lastActiveAt: now,
      ipAddress: this.ipAddress ?? undefined,
      credits: {
        openai: {
          ...DEFAULT_CREDITS.openai,
          resetAt: tomorrow.toISOString(),
        },
        visualizations: {
          ...DEFAULT_CREDITS.visualizations,
          resetAt: tomorrow.toISOString(),
        },
        datasets: {
          ...DEFAULT_CREDITS.datasets,
          resetAt: tomorrow.toISOString(),
        },
      },
      preferences: { ...DEFAULT_PREFERENCES },
      favorites: {
        datasets: [],
        visualizations: [],
        prompts: [],
        tags: [],
      },
      usage: {
        totalVisualizations: 0,
        totalDatasets: 0,
        totalPrompts: 0,
        firstUsedAt: now,
        lastUsedAt: now,
        dailyStats: [],
      },
      metadata: {},
    };

    this.persistSession();
  }

  /**
   * Check if session is valid (not expired)
   */
  private isSessionValid(session: GuestSession): boolean {
    const lastActive = new Date(session.lastActiveAt);
    const now = new Date();
    const daysSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    // Session expires after 30 days of inactivity
    return daysSinceActive < 30;
  }

  /**
   * Check and reset daily limits if needed
   */
  private checkAndResetDailyLimits(): void {
    if (!this.session) return;

    const now = new Date();
    const credits = this.session.credits;

    // Reset OpenAI credits
    if (new Date(credits.openai.resetAt) <= now) {
      credits.openai.used = 0;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      credits.openai.resetAt = tomorrow.toISOString();
    }

    // Reset visualization credits
    if (new Date(credits.visualizations.resetAt) <= now) {
      credits.visualizations.used = 0;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      credits.visualizations.resetAt = tomorrow.toISOString();
    }

    // Reset dataset credits
    if (new Date(credits.datasets.resetAt) <= now) {
      credits.datasets.used = 0;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      credits.datasets.resetAt = tomorrow.toISOString();
    }

    this.persistSession();
  }

  /**
   * Fetch IP address for tracking
   */
  private async fetchIpAddress(): Promise<void> {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      this.ipAddress = data.ip;

      if (this.session) {
        this.session.ipAddress = this.ipAddress ?? undefined;
        this.persistSession();
      }
    } catch (error) {
      console.warn('Failed to fetch IP address:', error);
    }
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): GuestSession | null {
    const storage = getLocalStorage();
    if (!storage) {
      return null;
    }
    try {
      const stored = storage.getItem(STORAGE_KEYS.SESSION);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Persist session to localStorage
   */
  private persistSession(): void {
    if (!this.session) return;
    const storage = getLocalStorage();
    if (!storage) return;

    try {
      storage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(this.session));
      storage.setItem(STORAGE_KEYS.CREDITS, JSON.stringify(this.session.credits));
      storage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.session.preferences));
      storage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(this.session.favorites));
      storage.setItem(STORAGE_KEYS.USAGE, JSON.stringify(this.session.usage));
    } catch (error) {
      console.error('Failed to persist guest session:', error);
    }
  }

  /**
   * Update last active timestamp
   */
  private updateLastActive(): void {
    if (!this.session) return;

    this.session.lastActiveAt = new Date().toISOString();
    this.session.usage.lastUsedAt = this.session.lastActiveAt;
    this.persistSession();
  }

  /**
   * Check if credits are available
   */
  public hasCredits(type: 'openai' | 'visualizations' | 'datasets'): boolean {
    if (!this.session) return false;

    this.checkAndResetDailyLimits();
    const credit = this.session.credits[type];
    return credit.used < credit.daily;
  }

  /**
   * Use credits
   */
  public useCredits(type: 'openai' | 'visualizations' | 'datasets', amount: number = 1): boolean {
    if (!this.session) return false;

    this.checkAndResetDailyLimits();
    const credit = this.session.credits[type];

    if (credit.used + amount > credit.daily) {
      return false;
    }

    credit.used += amount;
    this.updateUsageStats(type, amount);
    this.persistSession();
    return true;
  }

  /**
   * Update usage statistics
   */
  private updateUsageStats(type: string, amount: number): void {
    if (!this.session) return;

    const today = new Date().toISOString().split('T')[0];
    let todayStats = this.session.usage.dailyStats.find(s => s.date === today);

    if (!todayStats) {
      todayStats = {
        date: today,
        visualizations: 0,
        datasets: 0,
        openaiCredits: 0,
      };
      this.session.usage.dailyStats.push(todayStats);
    }

    switch (type) {
      case 'visualizations':
        todayStats.visualizations += amount;
        this.session.usage.totalVisualizations += amount;
        break;
      case 'datasets':
        todayStats.datasets += amount;
        this.session.usage.totalDatasets += amount;
        break;
      case 'openai':
        todayStats.openaiCredits += amount;
        break;
    }

    this.session.usage.totalPrompts += amount;
  }

  /**
   * Get remaining credits
   */
  public getRemainingCredits(type: 'openai' | 'visualizations' | 'datasets'): number {
    if (!this.session) return 0;

    this.checkAndResetDailyLimits();
    const credit = this.session.credits[type];
    return Math.max(0, credit.daily - credit.used);
  }

  /**
   * Get all credits info
   */
  public getCredits(): GuestCredits | null {
    this.checkAndResetDailyLimits();
    return this.session?.credits || null;
  }

  /**
   * Update preferences
   */
  public updatePreferences(preferences: Partial<GuestPreferences>): void {
    if (!this.session) return;

    this.session.preferences = {
      ...this.session.preferences,
      ...preferences,
    };
    this.updateLastActive();
    this.persistSession();
  }

  /**
   * Get preferences
   */
  public getPreferences(): GuestPreferences {
    return this.session?.preferences || DEFAULT_PREFERENCES;
  }

  /**
   * Add favorite
   */
  public addFavorite(type: keyof GuestFavorites, id: string): void {
    if (!this.session) return;

    if (!this.session.favorites[type].includes(id)) {
      this.session.favorites[type].push(id);
      this.updateLastActive();
      this.persistSession();
    }
  }

  /**
   * Remove favorite
   */
  public removeFavorite(type: keyof GuestFavorites, id: string): void {
    if (!this.session) return;

    const index = this.session.favorites[type].indexOf(id);
    if (index > -1) {
      this.session.favorites[type].splice(index, 1);
      this.updateLastActive();
      this.persistSession();
    }
  }

  /**
   * Check if item is favorited
   */
  public isFavorite(type: keyof GuestFavorites, id: string): boolean {
    if (!this.session) return false;
    return this.session.favorites[type].includes(id);
  }

  /**
   * Get all favorites
   */
  public getFavorites(): GuestFavorites {
    return this.session?.favorites || {
      datasets: [],
      visualizations: [],
      prompts: [],
      tags: [],
    };
  }

  /**
   * Get session for migration to registered user
   */
  public getSessionForMigration(): GuestSession | null {
    return this.session;
  }

  /**
   * Clear session after migration
   */
  public clearSessionAfterMigration(): void {
    this.session = null;
    Object.values(STORAGE_KEYS).forEach(key => {
      const storage = getLocalStorage();
      if (!storage) {
        return;
      }
      storage.removeItem(key);
    });

    // Create new guest session
    this.createNewSession();
  }

  /**
   * Get session ID
   */
  public getSessionId(): string | null {
    return this.session?.id || null;
  }

  /**
   * Get usage stats
   */
  public getUsageStats(): GuestUsage | null {
    return this.session?.usage || null;
  }

  /**
   * Check if user is guest
   */
  public isGuest(): boolean {
    return this.session !== null;
  }
}

// Export singleton instance
export const guestSessionService = new GuestSessionService();