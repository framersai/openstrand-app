'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { openstrandAPI } from '@/services/openstrand.api';
import { toast } from 'sonner';

const MOODS = [
  { emoji: '😊', label: 'happy', value: 'happy' },
  { emoji: '😐', label: 'neutral', value: 'neutral' },
  { emoji: '😢', label: 'sad', value: 'sad' },
  { emoji: '😤', label: 'frustrated', value: 'frustrated' },
  { emoji: '😴', label: 'tired', value: 'tired' },
  { emoji: '😎', label: 'confident', value: 'confident' },
  { emoji: '😰', label: 'anxious', value: 'anxious' },
  { emoji: '🤗', label: 'grateful', value: 'grateful' },
];

interface DailyCheckInProps {
  date: Date;
}

export function DailyCheckIn({ date }: DailyCheckInProps) {
  const t = useTranslations('daily.checkIn');
  const queryClient = useQueryClient();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  const dateString = date.toISOString().split('T')[0];

  // Fetch existing daily note
  const { data: dailyNote } = useQuery({
    queryKey: ['dailyNote', dateString],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/v1/journal/daily-notes/${dateString}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch daily note');
        }
        return response.json();
      } catch (error) {
        return null;
      }
    },
  });

  // Update mood when daily note loads
  useEffect(() => {
    if (dailyNote?.mood) {
      setSelectedMood(dailyNote.mood);
    } else {
      setSelectedMood(null);
    }
  }, [dailyNote]);

  // Create or update daily note with mood
  const updateMoodMutation = useMutation({
    mutationFn: async (mood: string) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      if (dailyNote) {
        // Update existing note
        const response = await fetch(`/api/v1/journal/daily-notes/${dateString}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mood }),
        });
        if (!response.ok) throw new Error('Failed to update mood');
        return response.json();
      } else {
        // Create new note
        const response = await fetch('/api/v1/journal/daily-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            noteDate: date.toISOString(),
            mood,
          }),
        });
        if (!response.ok) throw new Error('Failed to create daily note');
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNote', dateString] });
      toast.success(t('moodSaved'));
    },
    onError: (error: Error) => {
      toast.error(t('moodError', { error: error.message }));
    },
  });

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    updateMoodMutation.mutate(mood);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">☀️</span>
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{t('question')}</p>
        <div className="grid grid-cols-4 gap-2">
          {MOODS.map((mood) => (
            <Button
              key={mood.value}
              variant={selectedMood === mood.value ? 'default' : 'outline'}
              className={`h-16 text-3xl transition-all ${
                selectedMood === mood.value ? 'scale-110 shadow-lg' : 'hover:scale-105'
              }`}
              onClick={() => handleMoodSelect(mood.value)}
              aria-label={t(`moods.${mood.label}`)}
              title={t(`moods.${mood.label}`)}
            >
              {mood.emoji}
            </Button>
          ))}
        </div>
        {selectedMood && (
          <p className="text-sm text-center mt-4 text-muted-foreground">
            {t('selected', { mood: t(`moods.${selectedMood}`) })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

