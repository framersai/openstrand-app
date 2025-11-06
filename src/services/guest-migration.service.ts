/**
 * Guest to User Migration Service
 * Handles the migration of guest session data when a user registers
 */

import { guestSessionService } from './guest-session.service';
import type { GuestSession } from './guest-session.service';
import type { User } from '@supabase/supabase-js';

export interface MigrationResult {
  success: boolean;
  migratedItems: {
    preferences: boolean;
    favorites: boolean;
    usage: boolean;
    credits: boolean;
  };
  errors: string[];
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  defaultProvider: string;
  defaultModel: string;
  useHeuristics: boolean;
  autoInsights: boolean;
  expandedSections: Record<string, boolean>;
  tourCompleted: boolean;
  emailNotifications?: boolean;
  publicProfile?: boolean;
  shareUsageData?: boolean;
}

export interface UserFavorites {
  datasets: Array<{
    id: string;
    addedAt: string;
  }>;
  visualizations: Array<{
    id: string;
    addedAt: string;
  }>;
  prompts: Array<{
    id: string;
    text: string;
    addedAt: string;
  }>;
  tags: string[];
}

export interface UserUsageStats {
  totalVisualizations: number;
  totalDatasets: number;
  totalPrompts: number;
  totalCreditsUsed: number;
  firstUsedAt: string;
  lastUsedAt: string;
  dailyStats: Array<{
    date: string;
    visualizations: number;
    datasets: number;
    openaiCredits: number;
  }>;
  migrationData?: {
    migratedFrom: 'guest';
    migratedAt: string;
    guestSessionId: string;
  };
}

class GuestMigrationService {
  /**
   * Migrate guest session data to user account
   */
  async migrateGuestToUser(
    user: User,
    supabaseClient: any
  ): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedItems: {
        preferences: false,
        favorites: false,
        usage: false,
        credits: false,
      },
      errors: [],
    };

    try {
      // Get guest session
      const guestSession = guestSessionService.getSessionForMigration();
      if (!guestSession) {
        result.errors.push('No guest session found to migrate');
        return result;
      }

      // Migrate preferences
      const preferencesResult = await this.migratePreferences(
        user.id,
        guestSession,
        supabaseClient
      );
      result.migratedItems.preferences = preferencesResult.success;
      if (!preferencesResult.success && preferencesResult.error) {
        result.errors.push(preferencesResult.error);
      }

      // Migrate favorites
      const favoritesResult = await this.migrateFavorites(
        user.id,
        guestSession,
        supabaseClient
      );
      result.migratedItems.favorites = favoritesResult.success;
      if (!favoritesResult.success && favoritesResult.error) {
        result.errors.push(favoritesResult.error);
      }

      // Migrate usage stats
      const usageResult = await this.migrateUsageStats(
        user.id,
        guestSession,
        supabaseClient
      );
      result.migratedItems.usage = usageResult.success;
      if (!usageResult.success && usageResult.error) {
        result.errors.push(usageResult.error);
      }

      // Migrate remaining credits
      const creditsResult = await this.migrateCredits(
        user.id,
        guestSession,
        supabaseClient
      );
      result.migratedItems.credits = creditsResult.success;
      if (!creditsResult.success && creditsResult.error) {
        result.errors.push(creditsResult.error);
      }

      // Clear guest session if migration successful
      const allMigrated = Object.values(result.migratedItems).every(v => v);
      if (allMigrated) {
        guestSessionService.clearSessionAfterMigration();
        result.success = true;
      }

      return result;
    } catch (error) {
      console.error('Migration failed:', error);
      result.errors.push(error instanceof Error ? error.message : 'Unknown migration error');
      return result;
    }
  }

  /**
   * Migrate user preferences
   */
  private async migratePreferences(
    userId: string,
    guestSession: GuestSession,
    supabaseClient: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const preferences: UserPreferences = {
        ...guestSession.preferences,
        emailNotifications: false,
        publicProfile: false,
        shareUsageData: false,
      };

      const { error } = await supabaseClient
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to migrate preferences:', error);
      return {
        success: false,
        error: 'Failed to migrate preferences',
      };
    }
  }

  /**
   * Migrate favorites
   */
  private async migrateFavorites(
    userId: string,
    guestSession: GuestSession,
    supabaseClient: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();

      // Prepare favorites data
      const favorites: UserFavorites = {
        datasets: guestSession.favorites.datasets.map(id => ({
          id,
          addedAt: now,
        })),
        visualizations: guestSession.favorites.visualizations.map(id => ({
          id,
          addedAt: now,
        })),
        prompts: guestSession.favorites.prompts.map((text, index) => ({
          id: `prompt_${index}`,
          text,
          addedAt: now,
        })),
        tags: guestSession.favorites.tags,
      };

      // Insert dataset favorites
      if (favorites.datasets.length > 0) {
        const { error } = await supabaseClient
          .from('user_favorite_datasets')
          .insert(
            favorites.datasets.map(fav => ({
              user_id: userId,
              dataset_id: fav.id,
              added_at: fav.addedAt,
            }))
          );
        if (error) console.warn('Failed to migrate dataset favorites:', error);
      }

      // Insert visualization favorites
      if (favorites.visualizations.length > 0) {
        const { error } = await supabaseClient
          .from('user_favorite_visualizations')
          .insert(
            favorites.visualizations.map(fav => ({
              user_id: userId,
              visualization_id: fav.id,
              added_at: fav.addedAt,
            }))
          );
        if (error) console.warn('Failed to migrate visualization favorites:', error);
      }

      // Store prompts and tags in user metadata
      const { error } = await supabaseClient
        .from('user_metadata')
        .upsert({
          user_id: userId,
          favorite_prompts: favorites.prompts,
          favorite_tags: favorites.tags,
          updated_at: now,
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to migrate favorites:', error);
      return {
        success: false,
        error: 'Failed to migrate favorites',
      };
    }
  }

  /**
   * Migrate usage statistics
   */
  private async migrateUsageStats(
    userId: string,
    guestSession: GuestSession,
    supabaseClient: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const usageStats: UserUsageStats = {
        ...guestSession.usage,
        totalCreditsUsed: guestSession.credits.openai.used,
        migrationData: {
          migratedFrom: 'guest',
          migratedAt: new Date().toISOString(),
          guestSessionId: guestSession.id,
        },
      };

      const { error } = await supabaseClient
        .from('user_usage_stats')
        .upsert({
          user_id: userId,
          ...usageStats,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Also insert daily stats
      if (usageStats.dailyStats.length > 0) {
        const { error: dailyError } = await supabaseClient
          .from('user_daily_stats')
          .insert(
            usageStats.dailyStats.map(stat => ({
              user_id: userId,
              date: stat.date,
              visualizations: stat.visualizations,
              datasets: stat.datasets,
              openai_credits: stat.openaiCredits,
            }))
          );

        if (dailyError) console.warn('Failed to migrate daily stats:', dailyError);
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to migrate usage stats:', error);
      return {
        success: false,
        error: 'Failed to migrate usage statistics',
      };
    }
  }

  /**
   * Migrate remaining credits
   */
  private async migrateCredits(
    userId: string,
    guestSession: GuestSession,
    supabaseClient: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Calculate bonus credits for registering
      const bonusCredits = {
        openai: Math.max(20, guestSession.credits.openai.daily - guestSession.credits.openai.used),
        visualizations: Math.max(10, guestSession.credits.visualizations.daily - guestSession.credits.visualizations.used),
        datasets: Math.max(5, guestSession.credits.datasets.daily - guestSession.credits.datasets.used),
      };

      const { error } = await supabaseClient
        .from('user_credits')
        .upsert({
          user_id: userId,
          openai_credits: bonusCredits.openai,
          visualization_credits: bonusCredits.visualizations,
          dataset_credits: bonusCredits.datasets,
          reset_at: guestSession.credits.openai.resetAt,
          bonus_reason: 'guest_migration',
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to migrate credits:', error);
      return {
        success: false,
        error: 'Failed to migrate credits',
      };
    }
  }

  /**
   * Check if user was previously a guest
   */
  async checkPreviousGuestSession(
    userId: string,
    supabaseClient: any
  ): Promise<boolean> {
    try {
      const { data, error } = await supabaseClient
        .from('user_usage_stats')
        .select('migrationData')
        .eq('user_id', userId)
        .single();

      if (error) return false;

      return data?.migrationData?.migratedFrom === 'guest';
    } catch {
      return false;
    }
  }
}

export const guestMigrationService = new GuestMigrationService();