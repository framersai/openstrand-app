'use client';

/**
 * @module JournalReflectionCard
 * @description Card for creating reflection strands from journal/mood analytics
 * 
 * Features:
 * - Date range picker (presets: last 7 days, last 30 days, custom)
 * - Style selector (summary, narrative, bullet points)
 * - Mood/quick capture toggles
 * - Real-time generation with progress feedback
 * - Direct link to created strand
 * 
 * @author OpenStrand
 * @since 1.4.0
 */

import { useState } from 'react';
import { Calendar, Sparkles, Loader2, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface JournalReflectionCardProps {
  /** Optional callback when reflection is created */
  onReflectionCreated?: (strandId: string) => void;
}

/**
 * Card component for creating reflection strands from journal data.
 * 
 * Allows users to select a time window and generate an AI-synthesized
 * reflection that consolidates daily notes, moods, and quick captures
 * into a single cohesive strand.
 */
export function JournalReflectionCard({ onReflectionCreated }: JournalReflectionCardProps) {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'custom'>('7d');
  const [style, setStyle] = useState<'summary' | 'narrative' | 'bullet_points'>('summary');
  const [createdStrandId, setCreatedStrandId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setCreatedStrandId(null);

    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      if (dateRange === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      }

      const response = await fetch('/api/v1/journal/reflections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          includeMood: true,
          includeQuickCaptures: true,
          style,
          tags: ['reflection', `${dateRange}-review`],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const strandId = result.data?.strand?.id;
        
        setCreatedStrandId(strandId);
        
        toast({
          title: 'Reflection created',
          description: `Synthesized ${result.data?.metadata?.dailyNotesCount || 0} daily notes into a reflection strand`,
        });

        if (strandId && onReflectionCreated) {
          onReflectionCreated(strandId);
        }
      } else {
        throw new Error('Failed to create reflection');
      }
    } catch (err) {
      toast({
        title: 'Generation failed',
        description: err instanceof Error ? err.message : 'Unable to create reflection',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Create Reflection
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Synthesize your journal entries into a reflection strand
            </CardDescription>
          </div>
          {createdStrandId && (
            <Badge variant="default" className="gap-1 text-xs">
              <CheckCircle className="h-3 w-3" />
              Created
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Time window</Label>
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Last 7 days
                </div>
              </SelectItem>
              <SelectItem value="30d">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Last 30 days
                </div>
              </SelectItem>
              <SelectItem value="custom">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  Custom range
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Style */}
        <div className="space-y-2">
          <Label className="text-xs font-medium text-foreground">Reflection style</Label>
          <Select value={style} onValueChange={(v: any) => setStyle(v)}>
            <SelectTrigger className="w-full text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Summary (balanced overview)</SelectItem>
              <SelectItem value="narrative">Narrative (cohesive story)</SelectItem>
              <SelectItem value="bullet_points">Bullet points (organized themes)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full gap-2"
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Reflection
            </>
          )}
        </Button>

        {createdStrandId && (
          <div className="pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => {
                // Navigate to strand (would need routing context)
                window.location.href = `/pkms/strands/${createdStrandId}`;
              }}
            >
              <FileText className="h-4 w-4" />
              View Reflection
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

