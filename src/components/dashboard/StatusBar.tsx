'use client';

import { useState } from 'react';
import {
  Activity,
  Database,
  Zap,
  HardDrive,
  Wifi,
  WifiOff,
  ChevronUp,
  Info,
  Clock,
  User,
  Layers,
  GitBranch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface StatusBarProps {
  dataset?: {
    name: string;
    rows: number;
    columns: number;
    size: string;
  };
  connection?: 'online' | 'offline' | 'syncing';
  usage?: {
    cpu: number;
    memory: number;
    storage: number;
  };
  user?: {
    name: string;
    plan: string;
  };
  visualizations?: number;
  lastSync?: Date;
  className?: string;
}

export function StatusBar({
  dataset,
  connection = 'online',
  usage,
  user,
  visualizations = 0,
  lastSync,
  className
}: StatusBarProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-40',
      'h-8 bg-background/95 backdrop-blur border-t border-border/50',
      'flex items-center justify-between px-4',
      'text-xs',
      className
    )}>
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Dataset info */}
        {dataset && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <Database className="h-3.5 w-3.5" />
                <span className="font-medium">{dataset.name}</span>
                <span className="text-muted-foreground">
                  {dataset.rows} × {dataset.columns}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Dataset Details</span>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{dataset.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rows:</span>
                    <span>{dataset.rows.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Columns:</span>
                    <span>{dataset.columns}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Size:</span>
                    <span>{dataset.size}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Separator */}
        <div className="h-4 w-px bg-border" />

        {/* Visualizations count */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
              <Layers className="h-3.5 w-3.5" />
              <span>{visualizations} visualizations</span>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="w-48">
            <div className="space-y-2">
              <div className="font-semibold">Visualizations</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total:</span>
                  <span>{visualizations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier 1:</span>
                  <span>8</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier 2:</span>
                  <span>3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier 3:</span>
                  <span>1</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Center section */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
          {connection === 'online' ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-green-600" />
              <span>Online</span>
            </>
          ) : connection === 'offline' ? (
            <>
              <WifiOff className="h-3.5 w-3.5 text-red-600" />
              <span>Offline</span>
            </>
          ) : (
            <>
              <Wifi className="h-3.5 w-3.5 text-yellow-600 animate-pulse" />
              <span>Syncing...</span>
            </>
          )}
        </button>

        {/* AI Provider Status */}
        {visualizations > 0 && (
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>{visualizations} viz</span>
          </button>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Last sync */}
        {lastSync && (
          <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
            <Clock className="h-3.5 w-3.5" />
            <span>Synced {formatTime(lastSync)}</span>
          </button>
        )}

        {/* User info */}
        {user && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <User className="h-3.5 w-3.5" />
                <span>{user.name}</span>
                <Badge variant="outline" className="h-4 px-1 text-[10px]">
                  {user.plan}
                </Badge>
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" className="w-64">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Account</span>
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User:</span>
                    <span>{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <Badge variant="outline">{user.plan}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage:</span>
                    <span>2.4GB / 5GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing:</span>
                    <span>Active</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Expand/collapse all */}
        <button className="hover:text-primary transition-colors">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}