'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Play,
  Pause,
  RefreshCw,
  Download,
  FileText,
  Database,
  LineChart,
  Brain,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Loader2,
  FileSpreadsheet,
  FileJson,
  Image,
  BarChart3,
  PieChart,
  TrendingUp,
  Network
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  KnowledgeWeavingIcon,
  VisualizationTierIcon,
  SchemaIntelligenceIcon,
  DataOceanIcon
} from '@/components/landing/icons';

// Sample datasets for demo
const SAMPLE_DATASETS = [
  {
    id: 'sales',
    name: 'Sales Analytics',
    icon: TrendingUp,
    size: '2.4 MB',
    rows: 10000,
    columns: 12,
    preview: [
      ['Date', 'Revenue', 'Region', 'Product', 'Quantity'],
      ['2024-01-15', '$45,000', 'North', 'Widget-A', '150'],
      ['2024-01-16', '$52,000', 'South', 'Widget-B', '180'],
      ['2024-01-17', '$38,000', 'East', 'Widget-A', '120']
    ]
  },
  {
    id: 'research',
    name: 'Research Papers',
    icon: FileText,
    size: '15.7 MB',
    documents: 50,
    connections: 324,
    preview: [
      'Machine Learning in Healthcare.pdf',
      'Neural Networks for Drug Discovery.pdf',
      'AI-Powered Diagnostics Review.pdf'
    ]
  },
  {
    id: 'customer',
    name: 'Customer Feedback',
    icon: Database,
    size: '890 KB',
    entries: 2500,
    sentiment: 'positive',
    preview: [
      '"Great product, saves us hours every day!"',
      '"The visualization features are incredible."',
      '"Would love to see more export options."'
    ]
  }
];

// Processing steps for demo
const PROCESSING_STEPS = [
  {
    id: 'upload',
    name: 'Data Upload',
    icon: Upload,
    duration: 500
  },
  {
    id: 'parse',
    name: 'Schema Detection',
    icon: SchemaIntelligenceIcon,
    duration: 800
  },
  {
    id: 'analyze',
    name: 'AI Analysis',
    icon: Brain,
    duration: 1200
  },
  {
    id: 'visualize',
    name: 'Generate Visualizations',
    icon: VisualizationTierIcon,
    duration: 1000
  },
  {
    id: 'weave',
    name: 'Knowledge Weaving',
    icon: KnowledgeWeavingIcon,
    duration: 600
  }
];

// Generated visualizations for demo
const DEMO_VISUALIZATIONS = [
  {
    type: 'Bar Chart',
    tier: 1,
    cost: '$0.0002',
    icon: BarChart3,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    type: 'Line Graph',
    tier: 1,
    cost: '$0.0002',
    icon: LineChart,
    color: 'from-cyan-500 to-teal-500'
  },
  {
    type: 'Network Graph',
    tier: 2,
    cost: '$0.01',
    icon: Network,
    color: 'from-teal-500 to-emerald-500'
  },
  {
    type: 'AI Custom Viz',
    tier: 3,
    cost: '$0.17',
    icon: Sparkles,
    color: 'from-emerald-500 to-green-500'
  }
];

interface LiveDemoProps {
  className?: string;
}

export function LiveDemo({ className }: LiveDemoProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(SAMPLE_DATASETS[0]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [generatedVisualizations, setGeneratedVisualizations] = useState<typeof DEMO_VISUALIZATIONS>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate processing
  useEffect(() => {
    if (!isRunning || currentStep >= PROCESSING_STEPS.length) return;

    const step = PROCESSING_STEPS[currentStep];
    if (!step) {
      setCurrentStep(0);
      return;
    }

    const timer = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, step.id]);
      setProgress(((currentStep + 1) / PROCESSING_STEPS.length) * 100);

      if (currentStep === PROCESSING_STEPS.length - 1) {
        // Processing complete
        setIsRunning(false);
        setGeneratedVisualizations(DEMO_VISUALIZATIONS);
      } else {
        setCurrentStep(currentStep + 1);
      }
    }, step.duration);

    return () => clearTimeout(timer);
  }, [isRunning, currentStep]);

  const handleStart = () => {
    setIsRunning(true);
    setCurrentStep(0);
    setCompletedSteps([]);
    setProgress(0);
    setGeneratedVisualizations([]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentStep(-1);
    setCompletedSteps([]);
    setProgress(0);
    setGeneratedVisualizations([]);
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // In a real implementation, handle the dropped files
    handleStart();
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl border border-cyan-200/50 bg-gradient-to-br from-white to-cyan-50/20 shadow-2xl dark:border-cyan-800/50 dark:from-gray-900 dark:to-cyan-950/20', className)}>
      {/* Demo header */}
      <div className="border-b border-cyan-200/30 bg-gradient-to-r from-cyan-50/80 to-teal-50/80 px-6 py-4 backdrop-blur dark:border-cyan-800/30 dark:from-cyan-950/50 dark:to-teal-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500 hover-scale" />
              <div className="h-3 w-3 rounded-full bg-yellow-500 hover-scale" />
              <div className="h-3 w-3 rounded-full bg-green-500 hover-scale" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">OpenStrand Live Playground</span>
            <Badge className="animate-pulse bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              INTERACTIVE
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReset}
              disabled={isRunning}
              className="gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Reset
            </Button>
            <Button
              size="sm"
              variant={isRunning ? 'destructive' : 'default'}
              onClick={isRunning ? () => setIsRunning(false) : handleStart}
              className="gap-2 hover-scale"
            >
              {isRunning ? (
                <>
                  <Pause className="h-3 w-3" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  Run Demo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div className="mt-3">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </div>

      {/* Demo content */}
      <div className="p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input side */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-600" />
              <h3 className="text-lg font-semibold">1. Your Data</h3>
            </div>

            {/* File upload area */}
            <div
              className={cn(
                'relative overflow-hidden rounded-xl border-2 border-dashed transition-all micro-interaction',
                isDragging
                  ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30'
                  : 'border-cyan-300 bg-cyan-50/20 hover:border-cyan-400 dark:border-cyan-700 dark:bg-cyan-950/10'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.json,.xlsx,.pdf"
                onChange={handleStart}
              />
              <div className="p-8 text-center">
                <DataOceanIcon className="mx-auto mb-4 h-12 w-12 text-cyan-600/50 animate-float" />
                <p className="mb-2 text-sm font-medium">
                  Drop files here or{' '}
                  <button
                    onClick={handleFileUpload}
                    className="text-cyan-600 hover:underline"
                  >
                    browse
                  </button>
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV, JSON, Excel, PDF, and 20+ formats supported
                </p>
              </div>
            </div>

            {/* Sample datasets */}
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Or try sample data:
              </p>
              <div className="grid gap-3">
                {SAMPLE_DATASETS.map((dataset) => (
                  <button
                    key={dataset.id}
                    onClick={() => {
                      setSelectedDataset(dataset);
                      handleStart();
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover-lift interactive-card',
                      selectedDataset.id === dataset.id
                        ? 'border-cyan-500 bg-cyan-50/50 dark:bg-cyan-950/30'
                        : 'border-gray-200 dark:border-gray-800'
                    )}
                  >
                    <dataset.icon className="h-5 w-5 text-cyan-600" />
                    <div className="flex-1">
                      <p className="font-medium">{dataset.name}</p>
                      <p className="text-xs text-muted-foreground">{dataset.size}</p>
                    </div>
                    {selectedDataset.id === dataset.id && (
                      <Check className="h-4 w-4 text-cyan-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected dataset preview */}
            {selectedDataset && (
              <div className="rounded-lg border border-cyan-200/30 bg-cyan-50/20 p-4 animate-fade-in dark:border-cyan-800/30 dark:bg-cyan-950/10">
                <p className="mb-2 text-sm font-medium">Data Preview:</p>
                <div className="max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs font-mono dark:bg-gray-900">
                  {selectedDataset.preview && Array.isArray(selectedDataset.preview[0]) ? (
                    <table className="w-full">
                      <tbody>
                        {(selectedDataset.preview as string[][]).map((row, i) => (
                          <tr key={i} className={i === 0 ? 'font-bold' : ''}>
                            {row.map((cell, j) => (
                              <td key={j} className="px-2 py-1">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="space-y-1">
                      {(selectedDataset.preview as string[])?.map((item, i) => (
                        <div key={i}>{item}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Processing side */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              <h3 className="text-lg font-semibold">2. OpenStrand Processing</h3>
            </div>

            {/* Processing steps */}
            <div className="space-y-3">
              {PROCESSING_STEPS.map((step, index) => {
                const isActive = currentStep === index;
                const isCompleted = completedSteps.includes(step.id);

                return (
                  <div
                    key={step.id}
                    className={cn(
                      'flex items-center gap-3 rounded-lg border px-4 py-3 transition-all',
                      isActive
                        ? 'border-cyan-400 bg-cyan-50/50 animate-pulse dark:border-cyan-600 dark:bg-cyan-950/30'
                        : isCompleted
                        ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                        : 'border-gray-200 bg-gray-50/30 opacity-50 dark:border-gray-800 dark:bg-gray-950/30'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full',
                        isActive
                          ? 'bg-cyan-600 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700'
                      )}
                    >
                      {isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        'flex-1 text-sm font-medium',
                        (isActive || isCompleted) && 'text-foreground'
                      )}
                    >
                      {step.name}
                    </span>
                    {isCompleted && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        Done
                      </Badge>
                    )}
                    {isActive && (
                      <Badge className="animate-pulse bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">
                        Processing...
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Generated visualizations */}
            {generatedVisualizations.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Generated Visualizations:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {generatedVisualizations.map((viz, index) => (
                    <div
                      key={index}
                      className={cn(
                        'relative overflow-hidden rounded-lg border border-cyan-200/30 bg-gradient-to-br p-4 animate-fade-in-scale hover-lift interactive-card',
                        `stagger-${index + 1}`
                      )}
                    >
                      <div
                        className={cn(
                          'absolute inset-0 bg-gradient-to-br opacity-10',
                          viz.color
                        )}
                      />
                      <div className="relative space-y-2">
                        <viz.icon className="h-8 w-8 text-cyan-600" />
                        <p className="text-sm font-medium">{viz.type}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            Tier {viz.tier}
                          </Badge>
                          <span className="text-xs font-mono text-emerald-600">
                            {viz.cost}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {completedSteps.length === PROCESSING_STEPS.length && (
              <div className="flex gap-3 animate-fade-in">
                <Button className="flex-1 gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700 hover-scale">
                  <Download className="h-4 w-4" />
                  Export Results
                </Button>
                <Button variant="outline" className="flex-1 gap-2 hover-scale">
                  <ArrowRight className="h-4 w-4" />
                  Open in Editor
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}