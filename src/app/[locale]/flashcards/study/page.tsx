'use client';

export const dynamic = 'force-dynamic';

/**
 * @module FlashcardsStudyPage
 * @description Flashcard study session page
 * 
 * Features:
 * - Interactive flashcard player
 * - Spaced repetition ratings
 * - Progress tracking
 * - Session summary
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlashcardPlayer } from '@/components/learning/FlashcardPlayer';
import { flashcardAPI } from '@/services/openstrand.api';
import { Loader2 } from 'lucide-react';

export default function FlashcardsStudyPage() {
  const searchParams = useSearchParams();
  const deck = searchParams?.get('deck') || undefined;

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDueFlashcards();
  }, [deck]);

  const loadDueFlashcards = async () => {
    try {
      setLoading(true);
      const data = await flashcardAPI.getDue({ deck, limit: 20 });
      setFlashcards(data);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudyComplete = () => {
    // Refresh due cards after study session
    loadDueFlashcards();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <FlashcardPlayer
        flashcards={flashcards}
        onComplete={handleStudyComplete}
      />
    </div>
  );
}


