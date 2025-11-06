'use client';

import React, { useState } from 'react';
import {
  Download,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronRight,
  Info,
  Database,
  Upload,
  RefreshCw,
  FileText,
  BarChart3,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataUploader } from '@/components/data-uploader';
import { MinimalUpload } from '@/components/minimal-upload';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { DatasetMetadata, SampleDatasetSummary, DatasetSummary } from '@/types';
import { formatBytes, formatDate } from '@/lib/formatters';
import type { PlanTier } from '@/lib/plan-info';
import { PlanSummaryPill } from './PlanSummaryPill';
import { DatasetSummaryPanel } from './DatasetSummaryPanel';

interface UploadTabContentProps {
  metadata?: DatasetMetadata | null;
  isProcessing: boolean;
  isLoadingSamples: boolean;
  samples: SampleDatasetSummary[];
  activeDatasetId?: string;
  onFileUpload: (file: File) => Promise<void>;
  onClearDataset: () => void;
  onLoadSample: (filename: string) => Promise<void>;
  planTier: PlanTier;
  planLimitMb: number | null;
  summary: DatasetSummary | null;
  isSummaryLoading: boolean;
  onRefreshSummary?: () => void;
}

export function UploadTabContent({
  metadata,
  isProcessing,
  isLoadingSamples,
  samples,
  activeDatasetId,
  onFileUpload,
  onClearDataset,
  onLoadSample,
  planTier,
  planLimitMb,
  summary,
  isSummaryLoading,
  onRefreshSummary,
}: UploadTabContentProps) {
  const tDatasets = useTranslations('datasets');
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    upload: true,
    currentDataset: true,
    summary: false,
    samples: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const limitLabel =
    typeof planLimitMb === 'number' ? `${planLimitMb} MB max` : 'Unlimited';

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Minimal Upload Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">
                    {tDatasets('upload.title')}
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">
                        Upload CSV, TSV, TXT, or JSON files. Your plan allows files up to {limitLabel}.
                        Supported formats will be automatically detected and parsed.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <PlanSummaryPill plan={planTier} limitLabel={limitLabel} />
              </div>
              
              <MinimalUpload 
                onFileUpload={onFileUpload}
                variant="card"
                className="border-border/50"
              />
              
              <div className="flex items-center justify-center">
                <MinimalUpload 
                  onFileUpload={onFileUpload}
                  variant="inline"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Dataset Section */}
        {metadata && (
          <Card className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
              onClick={() => toggleSection('currentDataset')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">
                    Current Dataset
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearDataset();
                        }}
                        disabled={isProcessing}
                        className="h-7 px-2"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Clear current dataset</p>
                    </TooltipContent>
                  </Tooltip>
                  {expandedSections.currentDataset ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>

            {expandedSections.currentDataset && (
              <CardContent className="pt-0 pb-4">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoCard
                      label="Rows"
                      value={metadata.rowCount.toLocaleString()}
                      icon={<BarChart3 className="h-3 w-3" />}
                      tooltip="Total number of data rows in the dataset"
                    />
                    <InfoCard
                      label="Columns"
                      value={metadata.columns.length.toString()}
                      icon={<FileText className="h-3 w-3" />}
                      tooltip="Number of data columns/fields"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Fields:</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="text-xs font-medium">All columns:</p>
                            <p className="text-xs font-mono">
                              {metadata.columns.join(', ')}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {metadata.columns.slice(0, 3).map((col) => (
                        <Badge key={col} variant="outline" className="text-xs px-2 py-0">
                          {col}
                        </Badge>
                      ))}
                      {metadata.columns.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0">
                          +{metadata.columns.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Dataset Summary Section */}
        {metadata && (
          <Card className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
              onClick={() => toggleSection('summary')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">
                    Dataset Analysis
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="text-xs">
                        AI-powered analysis of your dataset including column types,
                        statistics, and semantic tags
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  {summary && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRefreshSummary?.();
                          }}
                          disabled={isProcessing || isSummaryLoading}
                          className="h-7 px-2"
                        >
                          <RefreshCw className={`h-3 w-3 ${isSummaryLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Refresh analysis</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {expandedSections.summary ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardHeader>

            {expandedSections.summary && (
              <CardContent className="pt-0 pb-4">
                <DatasetSummaryPanel
                  summary={summary}
                  isLoading={isSummaryLoading}
                  onRefresh={onRefreshSummary}
                  disableRefresh={isProcessing}
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* Sample Datasets Section */}
        <Card className="overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors py-3"
            onClick={() => toggleSection('samples')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium">
                  {tDatasets('samples.title')}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {samples.length}
                </Badge>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-xs">
                      Pre-loaded sample datasets to help you get started quickly.
                      Click to load any sample dataset.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              {expandedSections.samples ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>

          {expandedSections.samples && (
            <CardContent className="pt-0 pb-4 space-y-2">
              {isLoadingSamples ? (
                <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading samples...
                </div>
              ) : samples.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No sample datasets available
                </p>
              ) : (
                <div className="space-y-2">
                  {samples.map((sample) => {
                    const isActive = activeDatasetId === sample.id;
                    return (
                      <div
                        key={sample.id}
                        className={`
                          flex items-center justify-between rounded-lg border p-2
                          ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}
                          transition-colors
                        `}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {sample.filename}
                            </span>
                            {sample.isDefault && (
                              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                Default
                              </Badge>
                            )}
                            {isActive && (
                              <Badge variant="default" className="text-xs px-1.5 py-0">
                                Active
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatBytes(sample.sizeBytes)} · {formatDate(sample.lastModified)}
                          </p>
                        </div>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant={isActive ? 'secondary' : 'ghost'}
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => onLoadSample(sample.filename)}
                              disabled={isProcessing || isActive}
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {isActive ? 'Currently active' : 'Load this dataset'}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </TooltipProvider>
  );
}

// Helper component for info cards
function InfoCard({
  label,
  value,
  icon,
  tooltip,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-xs text-muted-foreground">{label}</span>
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/50" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}


