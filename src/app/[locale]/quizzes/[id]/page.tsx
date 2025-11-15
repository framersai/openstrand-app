'use client';

/**
 * @module QuizTakePage
 * @description Page for taking a quiz
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { QuizPlayer } from '@/components/learning/QuizPlayer';
import { quizAPI } from '@/services/openstrand.api';
import { Loader2 } from 'lucide-react';

export default function QuizTakePage() {
  const params = useParams();
  const quizId = params?.id as string;

  const [quiz, setQuiz] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const data = await quizAPI.get(quizId);
      setQuiz(data);
    } catch (error) {
      console.error('Failed to load quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Quiz not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <QuizPlayer quiz={quiz} />
    </div>
  );
}


