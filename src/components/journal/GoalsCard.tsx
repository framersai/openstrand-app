'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface GoalsCardProps {
  date: Date;
}

export function GoalsCard({ date }: GoalsCardProps) {
  const t = useTranslations('daily.goals');
  const queryClient = useQueryClient();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalText, setNewGoalText] = useState('');

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

  // Load goals from daily note metadata
  useEffect(() => {
    if (dailyNote?.metadata?.goals) {
      setGoals(dailyNote.metadata.goals);
    } else {
      setGoals([]);
    }
  }, [dailyNote]);

  // Save goals mutation
  const saveGoalsMutation = useMutation({
    mutationFn: async (updatedGoals: Goal[]) => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Not authenticated');

      const payload = {
        metadata: {
          ...(dailyNote?.metadata || {}),
          goals: updatedGoals,
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
        if (!response.ok) throw new Error('Failed to update goals');
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
    },
    onError: (error: Error) => {
      toast.error(t('saveError', { error: error.message }));
    },
  });

  const handleAddGoal = () => {
    if (!newGoalText.trim()) return;

    const newGoal: Goal = {
      id: Date.now().toString(),
      text: newGoalText.trim(),
      completed: false,
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    setNewGoalText('');
    saveGoalsMutation.mutate(updatedGoals);
  };

  const handleToggleGoal = (goalId: string) => {
    const updatedGoals = goals.map((goal) =>
      goal.id === goalId ? { ...goal, completed: !goal.completed } : goal
    );
    setGoals(updatedGoals);
    saveGoalsMutation.mutate(updatedGoals);
  };

  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter((goal) => goal.id !== goalId);
    setGoals(updatedGoals);
    saveGoalsMutation.mutate(updatedGoals);
  };

  const completedCount = goals.filter((g) => g.completed).length;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('title')}</span>
          {goals.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{goals.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Goal List */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {goals.map((goal) => (
            <div
              key={goal.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
            >
              <Checkbox
                checked={goal.completed}
                onCheckedChange={() => handleToggleGoal(goal.id)}
                aria-label={t('toggleGoal')}
              />
              <span
                className={`flex-1 ${
                  goal.completed ? 'line-through text-muted-foreground' : ''
                }`}
              >
                {goal.text}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeleteGoal(goal.id)}
                aria-label={t('deleteGoal')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {goals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('noGoals')}
            </p>
          )}
        </div>

        {/* Add Goal Input */}
        <div className="flex gap-2">
          <Input
            placeholder={t('addPlaceholder')}
            value={newGoalText}
            onChange={(e) => setNewGoalText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddGoal();
              }
            }}
          />
          <Button
            size="icon"
            onClick={handleAddGoal}
            disabled={!newGoalText.trim()}
            aria-label={t('addGoal')}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

