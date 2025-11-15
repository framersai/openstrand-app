'use client';

/**
 * @module QuizzesPage
 * @description Quiz browser and management page
 * 
 * Features:
 * - Browse user's quizzes
 * - Filter by difficulty/category
 * - View attempt history
 * - Create/generate quizzes
 */

import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Plus, Play, Filter, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { quizAPI } from '@/services/openstrand.api';
import Link from 'next/link';

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  useEffect(() => {
    loadQuizzes();
  }, [difficulty, sortBy]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const filters: any = { limit: 50 };
      if (difficulty !== 'all') filters.difficulty = difficulty;
      
      const data = await quizAPI.list(filters);
      setQuizzes(data.data || []);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Quizzes
          </h1>
          <p className="text-muted-foreground mt-1">
            Test your knowledge with auto-graded assessments
          </p>
        </div>

        <Button asChild>
          <Link href="/pkms/strands">
            <Plus className="h-4 w-4 mr-2" />
            Generate from Strands
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulty</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="expert">Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <p className="text-muted-foreground">Loading quizzes...</p>
      ) : quizzes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">No quizzes yet</p>
            <p className="text-muted-foreground mb-4">
              Generate quizzes from your strands to test your understanding
            </p>
            <Button asChild>
              <Link href="/pkms/strands">
                <TrendingUp className="h-4 w-4 mr-2" />
                Browse Strands
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{quiz.title}</CardTitle>
                {quiz.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {quiz.description}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  {quiz.difficulty && (
                    <Badge variant="secondary" className="capitalize">
                      {quiz.difficulty}
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {quiz.questions?.length || 0} questions
                  </Badge>
                  {quiz.timeLimit && (
                    <Badge variant="outline">
                      {Math.floor(quiz.timeLimit / 60)}min
                    </Badge>
                  )}
                </div>

                {quiz.avgScore > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Your avg score</span>
                      <span className="font-semibold">{quiz.avgScore.toFixed(1)}%</span>
                    </div>
                    <Progress value={quiz.avgScore} className="h-2" />
                  </div>
                )}

                <Button asChild className="w-full">
                  <Link href={`/quizzes/${quiz.id}`}>
                    <Play className="h-4 w-4 mr-2" />
                    Take Quiz
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


