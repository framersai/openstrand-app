'use client';

import { useState, useEffect } from 'react';
import { Layers3, Plus, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFeatureFlags } from '@/lib/feature-flags';
import { openstrandAPI } from '@/services/openstrand.api';

interface Loom {
  id: string;
  name: string;
  description?: string;
  useCase?: 'storytelling' | 'worldbuilding' | 'research' | 'notebook' | 'custom';
  strandCount?: number;
}

interface LoomSwitcherProps {
  value?: string;
  onChange?: (loomId: string) => void;
  className?: string;
}

/**
 * Loom Switcher Component
 * 
 * Community Edition: Shows "Global Loom" with upgrade CTA
 * Teams Edition: Full project/Loom selector with use-case templates
 */
export function LoomSwitcher({ value, onChange, className }: LoomSwitcherProps) {
  const { isTeamEdition } = useFeatureFlags();
  const [looms, setLooms] = useState<Loom[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!isTeamEdition) return;

    const loadLooms = async () => {
      setLoading(true);
      try {
        // TODO: Implement /api/v1/looms endpoint
        // For now, mock data
        const mockLooms: Loom[] = [
          { id: 'global', name: 'Global Workspace', strandCount: 42 },
          { id: 'story-1', name: 'Novel: The Last Archive', useCase: 'storytelling', strandCount: 156 },
          { id: 'world-1', name: 'Worldbuilding: Aetheria', useCase: 'worldbuilding', strandCount: 89 },
          { id: 'research-1', name: 'PhD Research Notes', useCase: 'research', strandCount: 234 },
        ];
        setLooms(mockLooms);
      } catch (error) {
        console.error('Failed to load looms:', error);
      } finally {
        setLoading(false);
      }
    };

    void loadLooms();
  }, [isTeamEdition]);

  // Community Edition: Single global Loom with upgrade prompt
  if (!isTeamEdition) {
    return (
      <div className={className}>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
            Community
          </Badge>
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5">
            <Layers3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Global Loom</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUpgrade(!showUpgrade)}
            className="gap-1"
          >
            <Sparkles className="h-3 w-3" />
            <span className="text-xs">Upgrade</span>
          </Button>
        </div>

        {showUpgrade && (
          <Alert className="mt-3 border-primary/20 bg-primary/5">
            <Sparkles className="h-4 w-4 text-primary" />
            <AlertDescription className="text-xs">
              <strong>Teams Edition</strong> lets you create multiple Looms for different projects:
              storytelling, world-building, research, and more. Each Loom has its own vocabulary catalog
              and knowledge graph.{' '}
              <a href="/pricing" className="underline hover:text-primary">
                View pricing
              </a>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // Teams Edition: Full Loom selector
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Badge variant="default" className="text-[10px] uppercase tracking-wide">
          Teams
        </Badge>
        <Select value={value} onValueChange={onChange} disabled={loading}>
          <SelectTrigger className="w-[220px]">
            <div className="flex items-center gap-2">
              <Layers3 className="h-4 w-4" />
              <SelectValue placeholder="Select Loom..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {looms.map((loom) => (
              <SelectItem key={loom.id} value={loom.id}>
                <div className="flex items-center justify-between gap-2">
                  <span>{loom.name}</span>
                  {loom.useCase && (
                    <Badge variant="outline" className="text-[9px]">
                      {loom.useCase}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-3 w-3" />
          New Loom
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Each Loom is an independent project with its own strands, vocabulary, and knowledge graph
      </p>
    </div>
  );
}

