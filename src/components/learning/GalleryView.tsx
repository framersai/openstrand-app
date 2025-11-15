'use client';

/**
 * @module GalleryView
 * @description Public gallery for discovering flashcards and quizzes
 * 
 * Features:
 * - Browse public content
 * - Vote (thumbs up/down only - NO comments per spec)
 * - Filter by category, difficulty, tags
 * - Sort by trending, top, newest, popular
 * - Masonry grid layout
 */

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  TrendingUp, 
  Clock, 
  Brain,
  ClipboardCheck,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface GalleryItem {
  id: string;
  type: 'flashcard' | 'quiz';
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  netVotes: number;
  wilsonScore: number;
  created: Date;
  ownerId: string;
  ownerName?: string;
  attempts?: number; // For quizzes
  reviews?: number; // For flashcards
  userVote?: 1 | -1;
}

interface GalleryViewProps {
  initialType?: 'flashcard' | 'quiz';
}

export function GalleryView({ initialType = 'flashcard' }: GalleryViewProps) {
  const [contentType, setContentType] = useState<'flashcard' | 'quiz'>(initialType);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'top' | 'trending' | 'newest' | 'popular'>('top');
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGallery();
  }, [contentType, sortBy, category, difficulty]);

  const loadGallery = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: contentType,
        sortBy,
        ...(category && { category }),
        ...(difficulty && { difficulty }),
        ...(searchQuery && { search: searchQuery }),
        take: '20',
      });

      const response = await fetch(`/api/v1/gallery?${params}`, {
        headers: {
          ...(localStorage.getItem('token') && {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.data);
      }
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (itemId: string, value: 1 | -1) => {
    try {
      const response = await fetch('/api/v1/gallery/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          contentType,
          contentId: itemId,
          value,
        }),
      });

      if (response.ok) {
        // Update local state
        setItems((prev) =>
          prev.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  upvotes: value === 1 ? item.upvotes + 1 : item.upvotes,
                  downvotes: value === -1 ? item.downvotes + 1 : item.downvotes,
                  userVote: value,
                }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleRemoveVote = async (itemId: string) => {
    try {
      await fetch(`/api/v1/gallery/vote?contentType=${contentType}&contentId=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                upvotes: item.userVote === 1 ? item.upvotes - 1 : item.upvotes,
                downvotes: item.userVote === -1 ? item.downvotes - 1 : item.downvotes,
                userVote: undefined,
              }
            : item
        )
      );
    } catch (error) {
      console.error('Failed to remove vote:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Learning Gallery</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Eye className="h-3 w-3" />
              Public Content
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground">
          Discover and vote on community flashcards and quizzes
        </p>
      </div>

      {/* Type Tabs */}
      <Tabs value={contentType} onValueChange={(v) => setContentType(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="flashcard" className="gap-2">
            <Brain className="h-4 w-4" />
            Flashcards
          </TabsTrigger>
          <TabsTrigger value="quiz" className="gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Quizzes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Top Rated
              </div>
            </SelectItem>
            <SelectItem value="trending">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending
              </div>
            </SelectItem>
            <SelectItem value="newest">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Newest
              </div>
            </SelectItem>
            <SelectItem value="popular">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Most Used
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Difficulty */}
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
            <SelectItem value="expert">Expert</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadGallery()}
            className="w-full"
          />
        </div>

        <Button onClick={loadGallery} variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-64 animate-pulse">
              <CardContent className="p-6">
                <div className="h-full bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Filter className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Content Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or check back later!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">
                    {item.title}
                  </CardTitle>
                  {item.type === 'flashcard' ? (
                    <Brain className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <ClipboardCheck className="h-5 w-5 text-primary shrink-0" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Description */}
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.description}
                  </p>
                )}

                {/* Tags */}
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.difficulty && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.difficulty}
                    </Badge>
                  )}
                  {item.type === 'quiz' && item.attempts !== undefined && (
                    <span>{item.attempts} attempts</span>
                  )}
                  {item.type === 'flashcard' && item.reviews !== undefined && (
                    <span>{item.reviews} reviews</span>
                  )}
                </div>

                {/* Voting */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={item.userVote === 1 ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() =>
                        item.userVote === 1
                          ? handleRemoveVote(item.id)
                          : handleVote(item.id, 1)
                      }
                      className="gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {item.upvotes}
                    </Button>
                    <Button
                      variant={item.userVote === -1 ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={() =>
                        item.userVote === -1
                          ? handleRemoveVote(item.id)
                          : handleVote(item.id, -1)
                      }
                      className="gap-1"
                    >
                      <ThumbsDown className="h-4 w-4" />
                      {item.downvotes}
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Navigate to content
                      if (item.type === 'flashcard') {
                        window.location.href = `/flashcards/${item.id}`;
                      } else {
                        window.location.href = `/quizzes/${item.id}`;
                      }
                    }}
                  >
                    {item.type === 'flashcard' ? 'Study' : 'Take Quiz'}
                  </Button>
                </div>

                {/* Author */}
                <div className="text-xs text-muted-foreground">
                  by {item.ownerName || 'Anonymous'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

