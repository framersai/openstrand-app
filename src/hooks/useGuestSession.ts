/**
 * React hook for managing guest sessions
 */

import { useState, useEffect, useCallback } from 'react';
import { guestSessionService } from '@/services/guest-session.service';
import type {
  GuestSession,
  GuestCredits,
  GuestPreferences,
  GuestFavorites,
  GuestUsage,
} from '@/services/guest-session.service';

interface UseGuestSessionReturn {
  session: GuestSession | null;
  credits: GuestCredits | null;
  preferences: GuestPreferences;
  favorites: GuestFavorites;
  usage: GuestUsage | null;
  isGuest: boolean;
  hasCredits: (type: 'openai' | 'visualizations' | 'datasets') => boolean;
  spendCredits: (type: 'openai' | 'visualizations' | 'datasets', amount?: number) => boolean;
  getRemainingCredits: (type: 'openai' | 'visualizations' | 'datasets') => number;
  updatePreferences: (preferences: Partial<GuestPreferences>) => void;
  addFavorite: (type: keyof GuestFavorites, id: string) => void;
  removeFavorite: (type: keyof GuestFavorites, id: string) => void;
  isFavorite: (type: keyof GuestFavorites, id: string) => boolean;
}

export function useGuestSession(): UseGuestSessionReturn {
  const [session, setSession] = useState<GuestSession | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Load initial session
    const loadSession = () => {
      const currentSession = guestSessionService.getSessionForMigration();
      setSession(currentSession);
    };

    loadSession();

    // Set up interval to check for credit resets
    const interval = setInterval(() => {
      loadSession();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [refreshTrigger]);

  const hasCredits = useCallback(
    (type: 'openai' | 'visualizations' | 'datasets') => {
      return guestSessionService.hasCredits(type);
    },
    []
  );

  const spendCredits = useCallback(
    (type: 'openai' | 'visualizations' | 'datasets', amount: number = 1) => {
      const success = guestSessionService.useCredits(type, amount);
      if (success) {
        setRefreshTrigger(prev => prev + 1); // Trigger refresh
      }
      return success;
    },
    []
  );

  const getRemainingCredits = useCallback(
    (type: 'openai' | 'visualizations' | 'datasets') => {
      return guestSessionService.getRemainingCredits(type);
    },
    []
  );

  const updatePreferences = useCallback((preferences: Partial<GuestPreferences>) => {
    guestSessionService.updatePreferences(preferences);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const addFavorite = useCallback((type: keyof GuestFavorites, id: string) => {
    guestSessionService.addFavorite(type, id);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const removeFavorite = useCallback((type: keyof GuestFavorites, id: string) => {
    guestSessionService.removeFavorite(type, id);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const isFavorite = useCallback((type: keyof GuestFavorites, id: string) => {
    return guestSessionService.isFavorite(type, id);
  }, []);

  return {
    session,
    credits: session?.credits || null,
    preferences: session?.preferences || guestSessionService.getPreferences(),
    favorites: session?.favorites || guestSessionService.getFavorites(),
    usage: session?.usage || null,
    isGuest: session !== null,
    hasCredits,
    spendCredits,
    getRemainingCredits,
    updatePreferences,
    addFavorite,
    removeFavorite,
    isFavorite,
  };
}
