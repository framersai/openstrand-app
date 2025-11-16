/* eslint-disable @next/next/no-img-element */
'use client';

/**
 * @module QuizPlayer
 * @description Interactive quiz taking interface with auto-grading
 * 
 * Features:
 * - Multiple question types (MCQ, True/False, Short Answer, etc.)
 * - Progress tracking
 * - Timer support
 * - Immediate feedback
 * - Results with explanations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Clock, ChevronRight, Check, X, AlertCircle, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { quizAPI } from '@/services/openstrand.api';
import { useToast } from '@/hooks/use-toast';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { MathRenderer } from './MathRenderer';

type QuestionImage =
  | string
  | {
      url: string;
      alt?: string;
      prompt?: string;
    };

interface Question {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank' | 'matching' | 'code';
  question: string;
  points: number;
  options?: string[];
  hints?: string[];
  imageUrl?: string;
  images?: QuestionImage[];
}

interface Quiz {
  id: string;
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore: number;
  showCorrectAnswers: boolean;
  questions: Question[];
  totalPoints: number;
}

interface QuizPlayerProps {
  quizId: string;
  onComplete?: (results: QuizResults) => void;
}

interface QuizResults {
  score: number;
  pointsEarned: number;
  pointsTotal: number;
  passed: boolean;
  timeSpentMs: number;
  results: Array<{
    questionId: string;
    correct: boolean;
    points: number;
    correctAnswer?: any;
    explanation?: string;
  }>;
}

export function QuizPlayer({ quizId, onComplete }: QuizPlayerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(Date.now());
  const [generatingQuestionId, setGeneratingQuestionId] = useState<string | null>(null);
  const [autoReadQuestions, setAutoReadQuestions] = useState(false);
  
  const { toast } = useToast();
  const { speak, playing, stop: stopSpeaking } = useTextToSpeech();
  const { 
    transcript, 
    isListening, 
    isSupported: micSupported, 
    start: startListening, 
    stop: stopListening,
    reset: resetTranscript 
  } = useSpeechRecognition({
    onInterim: (text) => {
      // Update answer in real-time for short answer questions
      const currentQuestion = quiz?.questions[currentQuestionIndex];
      if (currentQuestion?.type === 'short_answer' || currentQuestion?.type === 'fill_blank') {
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }));
      }
    },
    onFinalize: (text) => {
      const currentQuestion = quiz?.questions[currentQuestionIndex];
      if (currentQuestion) {
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: text }));
        toast({
          title: 'Answer recorded',
          description: 'Voice answer captured successfully',
        });
      }
    },
  });

  // Load quiz and start attempt
  useEffect(() => {
    startQuiz();
  }, [startQuiz]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || results) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, results, handleSubmit]);

  // Auto-read question when changed
  useEffect(() => {
    if (autoReadQuestions && currentQuestion) {
      speak(currentQuestion.question);
    }
  }, [currentQuestionIndex, autoReadQuestions, currentQuestion, speak]);

  const startQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuiz(data.data.quiz);
        setAttemptId(data.data.attemptId);
        
        if (data.data.quiz.timeLimit) {
          setTimeLeft(data.data.quiz.timeLimit);
        }
      }
    } catch (error) {
      console.error('Failed to start quiz:', error);
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const renderQuestionImages = (images?: QuestionImage[], fallback?: string) => {
    if (images && images.length > 0) {
      return (
        <div className="space-y-2">
          {images.map((img, index) => {
            const src = typeof img === 'string' ? img : img.url;
            if (!src) return null;
            const alt =
              typeof img === 'string' ? 'Question illustration' : img.alt || 'Question illustration';
            return (
              <img
                key={`${src}-${index}`}
                src={src}
                alt={alt}
                className="max-w-full h-auto rounded-lg"
              />
            );
          })}
        </div>
      );
    }

    if (fallback) {
      return (
        <img
          src={fallback}
          alt="Question"
          className="max-w-full h-auto rounded-lg"
        />
      );
    }

    return null;
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!quiz || !attemptId || submitting) return;

    try {
      setSubmitting(true);
      const timeSpentMs = Date.now() - startTime;

      // Build submission
      const submission = quiz.questions.map((q) => ({
        questionId: q.id,
        answer: answers[q.id] || '',
        timeSpentMs: timeSpentMs / quiz.questions.length,
      }));

      const response = await fetch(`/api/v1/quizzes/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          quizId,
          answers: submission,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.data.attempt);
        onComplete?.(data.data.attempt);
      }
    } catch (error) {
      console.error('Failed to submit quiz:', error);
    } finally {
      setSubmitting(false);
    }
  }, [quiz, attemptId, submitting, startTime, answers, quizId, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerateQuestionIllustration = async (questionId: string) => {
    if (!quiz) return;
    try {
      setGeneratingQuestionId(questionId);
      const response = await quizAPI.generateIllustrations(quiz.id, {
        questionIds: [questionId],
        stylePreset: 'flat_pastel',
      });
      const updatedQuiz = response?.data ?? response;
      if (updatedQuiz?.questions) {
        setQuiz(updatedQuiz);
        toast({
          title: 'Illustration added',
          description: 'Question illustration generated successfully.',
        });
      }
    } catch (error) {
      console.error('Failed to generate quiz illustration:', error);
      toast({
        title: 'Generation failed',
        description: 'Unable to generate illustration.',
        variant: 'destructive',
      });
    } finally {
      setGeneratingQuestionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Quiz Not Found</h3>
          <p className="text-muted-foreground">Unable to load quiz.</p>
        </CardContent>
      </Card>
    );
  }

  // Results View
  if (results) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.passed ? (
                <Check className="h-6 w-6 text-green-500" />
              ) : (
                <X className="h-6 w-6 text-red-500" />
              )}
              Quiz {results.passed ? 'Passed' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score */}
            <div className="text-center space-y-2">
              <div className="text-5xl font-bold">
                {Math.round(results.score)}%
              </div>
              <div className="text-muted-foreground">
                {results.pointsEarned} / {results.pointsTotal} points
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-green-600">
                  {results.results.filter((r) => r.correct).length}
                </div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-red-600">
                  {results.results.filter((r) => !r.correct).length}
                </div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">
                  {Math.round(results.timeSpentMs / 60000)}m
                </div>
                <div className="text-sm text-muted-foreground">Time</div>
              </div>
            </div>

            {/* Question Results */}
            {quiz.showCorrectAnswers && (
              <div className="space-y-3">
                <h4 className="font-semibold">Question Results:</h4>
                {results.results.map((result, index) => {
                  const question = quiz.questions[index];
                  return (
                    <Card key={question.id} className={cn(
                      "p-4",
                      result.correct ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"
                    )}>
                      <div className="flex items-start gap-3">
                        {result.correct ? (
                          <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 space-y-2">
                          <div className="font-medium">{question.question}</div>
                          {result.explanation && (
                            <div className="text-sm text-muted-foreground">
                              {result.explanation}
                            </div>
                          )}
                        </div>
                        <Badge variant={result.correct ? "default" : "destructive"}>
                          {result.points}pts
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz Taking View
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <span className="font-medium">{quiz.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Voice Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (playing) {
                stopSpeaking();
              } else {
                speak(currentQuestion.question);
              }
            }}
            title="Read question aloud"
          >
            {playing ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>

          {micSupported && (currentQuestion.type === 'short_answer' || currentQuestion.type === 'fill_blank') && (
            <Button
              variant={isListening ? 'destructive' : 'ghost'}
              size="icon"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  resetTranscript();
                  startListening();
                }
              }}
              title="Voice answer"
            >
              {isListening ? <MicOff className="h-4 w-4 animate-pulse" /> : <Mic className="h-4 w-4" />}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoReadQuestions(!autoReadQuestions)}
            className={cn(autoReadQuestions && 'bg-primary/10')}
          >
            {autoReadQuestions ? 'Auto 🔊' : 'Auto 🔇'}
          </Button>

          {timeLeft !== null && (
            <div className={cn(
              "flex items-center gap-2",
              timeLeft < 60 && "text-destructive"
            )}>
              <Clock className="h-4 w-4" />
              <span className="font-mono">{formatTime(timeLeft)}</span>
            </div>
          )}
          <Badge variant="outline">
            {currentQuestionIndex + 1} / {quiz.questions.length}
          </Badge>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progress} className="h-2" />

      {/* Question Card */}
      <Card>
        <CardContent className="p-8 space-y-6">
          {/* Question */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-semibold flex-1">
                <MathRenderer content={currentQuestion.question} />
              </h3>
              <Badge>{currentQuestion.points}pts</Badge>
            </div>
            {renderQuestionImages(currentQuestion.images, currentQuestion.imageUrl)}
            <div className="flex justify-start">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleGenerateQuestionIllustration(currentQuestion.id)}
                disabled={generatingQuestionId === currentQuestion.id}
              >
                {generatingQuestionId === currentQuestion.id ? 'Generating…' : 'Illustrate Question'}
              </Button>
            </div>
          </div>

          {/* Answer Input */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={answers[currentQuestion.id] === index ? 'default' : 'outline'}
                    className="w-full justify-start text-left h-auto py-4"
                    onClick={() => handleAnswer(currentQuestion.id, index)}
                  >
                    <span className="mr-3 font-semibold">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <MathRenderer content={option} />
                  </Button>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={answers[currentQuestion.id] === 'true' ? 'default' : 'outline'}
                  className="h-16"
                  onClick={() => handleAnswer(currentQuestion.id, 'true')}
                >
                  True
                </Button>
                <Button
                  variant={answers[currentQuestion.id] === 'false' ? 'default' : 'outline'}
                  className="h-16"
                  onClick={() => handleAnswer(currentQuestion.id, 'false')}
                >
                  False
                </Button>
              </div>
            )}

            {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'fill_blank') && (
              <Input
                placeholder="Type your answer..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                className="text-lg"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        {isLastQuestion ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

