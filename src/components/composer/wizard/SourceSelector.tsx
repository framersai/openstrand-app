'use client';

/**
 * @module composer/wizard/SourceSelector
 * @description Source type selection step for the wizard
 */

import { 
  FileText, 
  FileCode, 
  Upload, 
  Link, 
  Image,
  FolderPlus,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import type { SourceType, CreationType } from './types';
import { SOURCE_OPTIONS } from './types';

const ICONS: Record<string, React.ElementType> = {
  FileText,
  FileCode,
  Upload,
  Link,
  Image,
};

interface SourceSelectorProps {
  selectedSource: SourceType;
  onSourceChange: (source: SourceType) => void;
  creationType: CreationType;
  onCreationTypeChange: (type: CreationType) => void;
}

export function SourceSelector({
  selectedSource,
  onSourceChange,
  creationType,
  onCreationTypeChange,
}: SourceSelectorProps) {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Creation Type Toggle */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">What are you creating?</label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onCreationTypeChange('strand')}
            className={cn(
              "flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[80px] sm:min-h-0",
              "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
              creationType === 'strand'
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              creationType === 'strand' ? "bg-primary/20" : "bg-muted"
            )}>
              <FileText className={cn(
                "h-5 w-5",
                creationType === 'strand' ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="text-center sm:text-left">
              <div className="font-medium text-sm sm:text-base">Strand</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">A piece of content</div>
            </div>
          </button>
          
          <button
            type="button"
            onClick={() => onCreationTypeChange('folder')}
            className={cn(
              "flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl border-2 transition-all min-h-[80px] sm:min-h-0",
              "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]",
              creationType === 'folder'
                ? "border-primary bg-primary/10 shadow-sm"
                : "border-border bg-card"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              creationType === 'folder' ? "bg-primary/20" : "bg-muted"
            )}>
              <FolderPlus className={cn(
                "h-5 w-5",
                creationType === 'folder' ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="text-center sm:text-left">
              <div className="font-medium text-sm sm:text-base">Folder</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground">Organize strands</div>
            </div>
          </button>
        </div>
      </div>

      {/* Source Type Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">How do you want to start?</label>
        <div className="grid gap-2">
          {SOURCE_OPTIONS.map((option) => {
            const Icon = ICONS[option.icon] || FileText;
            const isSelected = selectedSource === option.type;
            
            return (
              <button
                key={option.type}
                type="button"
                onClick={() => onSourceChange(option.type)}
                className={cn(
                  "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all text-left min-h-[60px]",
                  "hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <div className={cn(
                  "p-2 sm:p-2.5 rounded-lg flex-shrink-0",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn(
                    "h-4 w-4 sm:h-5 sm:w-5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base">{option.title}</span>
                    {option.type === 'url' && (
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] gap-0.5 sm:gap-1 px-1.5 py-0">
                        <Sparkles className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                        AI
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground line-clamp-1">{option.description}</div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30"
                )}>
                  {isSelected && (
                    <svg className="w-full h-full text-primary-foreground p-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Folder-specific tip */}
      {creationType === 'folder' && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                Spiral Curriculum Structure
              </p>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                Folders represent topics. Subfolders are subtopics that become more specific as you go deeper. 
                This powers the AI-driven Spiral Path learning system.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

