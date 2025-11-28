'use client';

import { useState, useEffect } from 'react';
import { Layers3, Plus, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFeatureFlags } from '@/lib/feature-flags';
import { LoomIcon } from '@/components/icons';

interface Loom {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  useCase?: 'storytelling' | 'worldbuilding' | 'research' | 'notebook' | 'documentation' | 'education' | 'custom';
  strandCount?: number;
  // Visual style properties (all optional)
  thumbnail?: string;
  coverImage?: string;
  backgroundImage?: string;
  backgroundColor?: string;
  accentColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: string;
  opacity?: number;
  blur?: number;
  gradient?: string;
  customStyles?: Record<string, unknown>;
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
        const response = await fetch('/api/v1/looms', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load looms');
        }

        const data = await response.json();
        setLooms(data);
      } catch (error) {
        console.error('Failed to load looms:', error);
        // Fallback to empty list
        setLooms([]);
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
              <LoomIcon 
                iconId={looms.find(l => l.id === value)?.icon} 
                className="h-4 w-4" 
                decorative 
              />
              <SelectValue placeholder="Select Loom..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            {looms.map((loom) => (
              <SelectItem key={loom.id} value={loom.id}>
                <div className="flex items-center gap-2">
                  <LoomIcon 
                    iconId={loom.icon} 
                    className="h-4 w-4 shrink-0" 
                    decorative 
                  />
                  <span className="truncate">{loom.name}</span>
                  {loom.useCase && (
                    <Badge variant="outline" className="text-[9px] ml-auto shrink-0">
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

                    <Badge variant="outline" className="text-[9px] ml-auto shrink-0">
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
