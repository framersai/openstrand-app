'use client';

import { useState, useEffect } from 'react';
import { Brain, Sparkles, Clock, Zap, Info, AlertCircle } from 'lucide-react';
import { PageLayout } from '@/components/layouts/PageLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFeatureFlags } from '@/lib/feature-flags';

interface DataIntelligenceSettings {
  analysisTrigger: 'immediate' | 'deferred' | 'scheduled' | 'manual';
  batchWindowMinutes: number;
  enableLLMVerification: boolean;
  llmProvider?: 'openai' | 'anthropic' | 'ollama';
  cacheTTLMinutes: number;
  maxConcurrentJobs: number;
}

/**
 * Data Intelligence Settings Page
 * 
 * Community Edition: Simple toggle for auto-run (local heuristics only)
 * Teams Edition: Full controls (batch windows, LLM verification, cache TTL, job limits)
 */
export default function DataIntelligenceSettingsPage() {
  const { toast } = useToast();
  const { isTeamEdition } = useFeatureFlags();
  
  const [settings, setSettings] = useState<DataIntelligenceSettings>({
    analysisTrigger: 'immediate',
    batchWindowMinutes: 15,
    enableLLMVerification: false,
    llmProvider: 'openai',
    cacheTTLMinutes: 60,
    maxConcurrentJobs: 5,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        // TODO: Load from backend API /api/v1/settings/data-intelligence
        // For now, use defaults
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        toast({
          title: 'Failed to load settings',
          description: 'Using default configuration',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    void loadSettings();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save to backend API /api/v1/settings/data-intelligence
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Settings saved',
        description: 'Data intelligence configuration updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Failed to save settings',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof DataIntelligenceSettings>(
    key: K,
    value: DataIntelligenceSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <PageLayout
      title="Data Intelligence"
      description="Configure vocabulary analysis, entity extraction, and metadata generation"
      icon={Brain}
    >
      <div className="space-y-6">
        {/* Edition Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={isTeamEdition ? 'default' : 'secondary'} className="uppercase tracking-wide">
            {isTeamEdition ? 'Teams Edition' : 'Community Edition'}
          </Badge>
          {!isTeamEdition && (
            <span className="text-sm text-muted-foreground">
              Upgrade to Teams for advanced controls
            </span>
          )}
        </div>

        {/* Community Edition: Simple Controls */}
        {!isTeamEdition && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Analysis Mode
              </CardTitle>
              <CardDescription>
                Deterministic vocabulary and entity extraction runs locally on your device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Community Edition uses offline statistical NLP (TF/IDF, NER) with zero LLM dependency.
                  All processing happens on your device—no data leaves your machine.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-run">Auto-run on save</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically analyze strands and datasets when created or updated
                  </p>
                </div>
                <Switch
                  id="auto-run"
                  checked={settings.analysisTrigger !== 'manual'}
                  onCheckedChange={(checked) =>
                    updateSetting('analysisTrigger', checked ? 'immediate' : 'manual')
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="run-mode">Run timing</Label>
                  <p className="text-sm text-muted-foreground">
                    When to trigger analysis
                  </p>
                </div>
                <Select
                  value={settings.analysisTrigger}
                  onValueChange={(value: DataIntelligenceSettings['analysisTrigger']) =>
                    updateSetting('analysisTrigger', value)
                  }
                  disabled={loading}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (background)</SelectItem>
                    <SelectItem value="deferred">On editor blur</SelectItem>
                    <SelectItem value="manual">Manual only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={saving || loading} className="w-full">
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Teams Edition: Advanced Controls */}
        {isTeamEdition && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Analysis Trigger
                </CardTitle>
                <CardDescription>
                  Control when vocabulary and entity analysis runs for team workspaces
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="trigger-mode">Trigger mode</Label>
                  <Select
                    value={settings.analysisTrigger}
                    onValueChange={(value: DataIntelligenceSettings['analysisTrigger']) =>
                      updateSetting('analysisTrigger', value)
                    }
                    disabled={loading}
                  >
                    <SelectTrigger id="trigger-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate (background queue)</SelectItem>
                      <SelectItem value="deferred">Deferred (batch window)</SelectItem>
                      <SelectItem value="scheduled">Scheduled (cron)</SelectItem>
                      <SelectItem value="manual">Manual only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Immediate: Enqueues jobs instantly. Deferred: Batches during idle periods. Scheduled: Runs nightly/hourly.
                  </p>
                </div>

                {settings.analysisTrigger === 'deferred' && (
                  <div className="space-y-2">
                    <Label htmlFor="batch-window">Batch window (minutes)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="batch-window"
                        min={5}
                        max={120}
                        step={5}
                        value={[settings.batchWindowMinutes]}
                        onValueChange={([value]) => updateSetting('batchWindowMinutes', value)}
                        className="flex-1"
                        disabled={loading}
                      />
                      <span className="w-12 text-sm text-muted-foreground">
                        {settings.batchWindowMinutes}m
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Jobs accumulate and run every {settings.batchWindowMinutes} minutes
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="max-jobs">Max concurrent jobs</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="max-jobs"
                      min={1}
                      max={20}
                      step={1}
                      value={[settings.maxConcurrentJobs]}
                      onValueChange={([value]) => updateSetting('maxConcurrentJobs', value)}
                      className="flex-1"
                      disabled={loading}
                    />
                    <span className="w-12 text-sm text-muted-foreground">
                      {settings.maxConcurrentJobs}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Limits parallel analysis to protect shared infrastructure
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  LLM Verification
                  <Badge variant="outline" className="ml-auto text-[10px]">Optional</Badge>
                </CardTitle>
                <CardDescription>
                  Optionally verify deterministic metadata with LLM fact-checking
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Deterministic analysis (TF/IDF, NER) runs first and is always free. LLM verification
                    is an optional second pass that cross-checks and enriches metadata. Costs apply per verification.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="llm-verify">Enable LLM verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Run optional AI fact-checking on vocabulary/entity results
                    </p>
                  </div>
                  <Switch
                    id="llm-verify"
                    checked={settings.enableLLMVerification}
                    onCheckedChange={(checked) => updateSetting('enableLLMVerification', checked)}
                    disabled={loading}
                  />
                </div>

                {settings.enableLLMVerification && (
                  <div className="space-y-2">
                    <Label htmlFor="llm-provider">LLM Provider</Label>
                    <Select
                      value={settings.llmProvider}
                      onValueChange={(value: 'openai' | 'anthropic' | 'ollama') =>
                        updateSetting('llmProvider', value)
                      }
                      disabled={loading}
                    >
                      <SelectTrigger id="llm-provider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI (GPT-4o-mini)</SelectItem>
                        <SelectItem value="anthropic">Anthropic (Claude 3 Haiku)</SelectItem>
                        <SelectItem value="ollama">Ollama (Local)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Estimated cost: ~$0.001–$0.01 per verification depending on content size
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Caching & Performance
                </CardTitle>
                <CardDescription>
                  Control how long summaries stay fresh before re-analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cache-ttl">Cache TTL (minutes)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      id="cache-ttl"
                      min={10}
                      max={1440}
                      step={10}
                      value={[settings.cacheTTLMinutes]}
                      onValueChange={([value]) => updateSetting('cacheTTLMinutes', value)}
                      className="flex-1"
                      disabled={loading}
                    />
                    <span className="w-16 text-sm text-muted-foreground">
                      {settings.cacheTTLMinutes}m
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vocabulary summaries older than this will be regenerated on next access
                  </p>
                </div>

                <Alert variant="default">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Incremental updates:</strong> Only changed strands trigger re-analysis.
                    Content hashes ensure we skip unchanged documents.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || loading}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </>
        )}

        {/* Community Edition: Upgrade CTA */}
        {!isTeamEdition && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-5 w-5 text-primary" />
                Unlock Advanced Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Teams Edition adds batch processing, LLM verification, and fine-grained caching controls
                for large-scale knowledge bases.
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Schedule analysis during off-hours</li>
                <li>• Optional LLM fact-checking with cost tracking</li>
                <li>• Team-wide vocabulary catalogs</li>
                <li>• Multi-project Loom management</li>
              </ul>
              <Button variant="default" className="w-full" onClick={() => window.location.assign('/pricing')}>
                View Teams Pricing
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}

