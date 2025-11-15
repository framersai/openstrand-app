'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Trophy } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Accomplishment {
  id: string;
  text: string;
  timestamp: string;
}

interface AccomplishmentsCardProps {
  date: Date;
}

export function AccomplishmentsCard({ date }: AccomplishmentsCardProps) {
  const t = useTranslations('daily.accomplishments');
  const queryClient = useQueryClient();
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>([]);
  const [newAccomplishmentText, setNewAccomplishmentText] = useState('');

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

  // Load accomplishments from daily note metadata
  useEffect(() => {
    if (dailyNote?.metadata?.accomplishments) {
      setAccomplishments(dailyNote.metadata.accomplishments);
    } else {
      setAccomplishments([]);
    }
  }, [dailyNote]);

  // Save accomplishments mutation
  const saveAccomplishmentsMutation = useMutation({
    mutationFn: async (updatedAccomplishments: Accomplishment[]) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = {
        metadata: {
          ...(dailyNote?.metadata || {}),
          accomplishments: updatedAccomplishments,
        },
      };

      if (dailyNote) {
        const response = await fetch(`/api/v1/journal/daily-notes/${dateString}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Failed to update accomplishments');
        return response.json();
      } else {
        const response = await fetch('/api/v1/journal/daily-notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            noteDate: date.toISOString(),
            ...payload,
          }),
        });
        if (!response.ok) throw new Error('Failed to create daily note');
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNote', dateString] });
      toast.success(t('saved'));
    },
    onError: (error: Error) => {
      toast.error(t('saveError', { error: error.message }));
    },
  });

  const handleAddAccomplishment = () => {
    if (!newAccomplishmentText.trim()) return;

    const newAccomplishment: Accomplishment = {
      id: Date.now().toString(),
      text: newAccomplishmentText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedAccomplishments = [...accomplishments, newAccomplishment];
    setAccomplishments(updatedAccomplishments);
    setNewAccomplishmentText('');
    saveAccomplishmentsMutation.mutate(updatedAccomplishments);
  };

  const handleDeleteAccomplishment = (accomplishmentId: string) => {
    const updatedAccomplishments = accomplishments.filter((a) => a.id !== accomplishmentId);
    setAccomplishments(updatedAccomplishments);
    saveAccomplishmentsMutation.mutate(updatedAccomplishments);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Accomplishments List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {accomplishments.map((accomplishment) => (
            <div
              key={accomplishment.id}
              className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 group"
            >
              <span className="text-lg">✓</span>
              <span className="flex-1">{accomplishment.text}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeleteAccomplishment(accomplishment.id)}
                aria-label={t('delete')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {accomplishments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('noAccomplishments')}
            </p>
          )}
        </div>

        {/* Add Accomplishment Input */}
        <div className="flex gap-2">
          <Input
            placeholder={t('addPlaceholder')}
            value={newAccomplishmentText}
            onChange={(e) => setNewAccomplishmentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddAccomplishment();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleAddAccomplishment}
            disabled={!newAccomplishmentText.trim()}
            aria-label={t('add')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

