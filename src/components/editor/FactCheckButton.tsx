'use client';

/**
 * Fact-Check Button Component
 * 
 * LLM-powered fact-checking with dual-model verification
 * 
 * @module components/editor
 */

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { 
  ShieldCheck, 
  Loader2, 
  Check, 
  X, 
  AlertTriangle, 
  Info,
  ChevronDown 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface FactCheckButtonProps {
  content: string;
  onVerified?: (result: FactCheckResult) => void;
  className?: string;
}

interface FactCheckResult {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  verdict?: 'MATCH' | 'MISMATCH' | 'UNCERTAIN';
  confidence?: number;
  answerA?: string;
  answerB?: string;
  arbiterReasoning?: string;
}

/**
 * Fact-Check Button Component
 */
export function FactCheckButton({ content, onVerified, className }: FactCheckButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<FactCheckResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  /**
   * Start fact-check
   */
  const handleFactCheck = async () => {
    if (!content || content.trim().length < 10) {
      toast.error('Content too short to fact-check');
      return;
    }

    setIsChecking(true);
    setResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Start job
      const response = await fetch(`${backendUrl}/api/fact-check`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to start fact-check');
      }

      const data = await response.json();
      const jobId = data.jobId;

      // Poll for result
      await pollFactCheck(jobId);
    } catch (error) {
      console.error('Fact-check failed:', error);
      toast.error('Fact-check failed');
      setIsChecking(false);
    }
  };

  /**
   * Poll fact-check status
   */
  const pollFactCheck = async (jobId: string) => {
    const token = localStorage.getItem('auth_token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async () => {
      attempts++;

      try {
        const response = await fetch(`${backendUrl}/api/fact-check/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to get fact-check status');
        }

        const data: FactCheckResult = await response.json();
        setResult(data);

        if (data.status === 'COMPLETED') {
          setIsChecking(false);
          if (onVerified) {
            onVerified(data);
          }
          showResultToast(data);
        } else if (data.status === 'FAILED') {
          setIsChecking(false);
          toast.error('Fact-check failed');
        } else if (attempts < maxAttempts) {
          // Continue polling
          setTimeout(poll, 1000);
        } else {
          setIsChecking(false);
          toast.error('Fact-check timed out');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setIsChecking(false);
        toast.error('Fact-check failed');
      }
    };

    poll();
  };

  /**
   * Show result toast
   */
  const showResultToast = (result: FactCheckResult) => {
    if (result.verdict === 'MATCH') {
      toast.success('Fact-check passed! Models agree.');
    } else if (result.verdict === 'MISMATCH') {
      toast.error('Fact-check warning! Models disagree.');
    } else {
      toast('Fact-check uncertain', { icon: '⚠️' });
    }
  };

  /**
   * Get verdict icon
   */
  const getVerdictIcon = () => {
    if (!result || !result.verdict) return null;

    switch (result.verdict) {
      case 'MATCH':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'MISMATCH':
        return <X className="h-4 w-4 text-red-500" />;
      case 'UNCERTAIN':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  /**
   * Get verdict color
   */
  const getVerdictColor = () => {
    if (!result || !result.verdict) return 'default';

    switch (result.verdict) {
      case 'MATCH':
        return 'success';
      case 'MISMATCH':
        return 'destructive';
      case 'UNCERTAIN':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-2', className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFactCheck}
              disabled={isChecking || !content}
              className="gap-2"
            >
              {isChecking ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking...
                </span>
              ) : result ? (
                <span className="inline-flex items-center gap-2">
                  {getVerdictIcon()}
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Fact-Check
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 max-w-xs">
              <p className="font-medium">AI Fact-Check</p>
              <p className="text-xs text-muted-foreground">
                Verify content with multiple AI models to detect hallucinations and ensure accuracy.
              </p>
              {result && (
                <div className="pt-2 space-y-1">
                  <p className="text-xs">
                    Confidence: {Math.round((result.confidence || 0) * 100)}%
                  </p>
                  {result.arbiterReasoning && (
                    <p className="text-xs italic">{result.arbiterReasoning}</p>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {result && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <Badge variant={getVerdictColor() as any}>
                  {result.verdict}
                </Badge>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Fact-Check Result</span>
                  <Badge variant={getVerdictColor() as any}>
                    {result.verdict}
                  </Badge>
                </div>

                {result.confidence !== undefined && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                    <Progress value={result.confidence * 100} className="h-1" />
                  </div>
                )}

                {result.arbiterReasoning && (
                  <div className="space-y-1">
                    <span className="text-xs font-medium">Arbiter Analysis</span>
                    <p className="text-xs text-muted-foreground">
                      {result.arbiterReasoning}
                    </p>
                  </div>
                )}

                {result.answerA && result.answerB && (
                  <div className="pt-2 border-t space-y-2">
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Info className="h-3 w-3" />
                      {showDetails ? 'Hide' : 'Show'} model answers
                    </button>

                    {showDetails && (
                      <div className="space-y-2 text-xs">
                        <div className="p-2 rounded bg-accent/50">
                          <p className="font-medium mb-1">Model A:</p>
                          <p className="text-muted-foreground">{result.answerA}</p>
                        </div>
                        <div className="p-2 rounded bg-accent/50">
                          <p className="font-medium mb-1">Model B:</p>
                          <p className="text-muted-foreground">{result.answerB}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  );
}

