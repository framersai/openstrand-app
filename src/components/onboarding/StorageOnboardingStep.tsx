"use client";

import { useEffect, useState } from 'react';
import { HardDrive, GitBranch, FolderOpen, Check, ArrowRight, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StorageOnboardingStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

/**
 * Onboarding wizard step for configuring backup location and Git integration.
 * Auto-advances after 5 seconds if user doesn't interact.
 */
export function StorageOnboardingStep({ onComplete, onSkip }: StorageOnboardingStepProps) {
  const [contentRoot, setContentRoot] = useState('');
  const [enableMirror, setEnableMirror] = useState(true);
  const [enableGit, setEnableGit] = useState(true);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(5);
  const [saving, setSaving] = useState(false);

  // Auto-advance countdown
  useEffect(() => {
    if (autoAdvanceSeconds <= 0) {
      handleAutoAdvance();
      return;
    }

    const timer = setTimeout(() => {
      setAutoAdvanceSeconds(autoAdvanceSeconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoAdvanceSeconds]);

  // Suggest default path based on platform
  useEffect(() => {
    const platform = navigator.platform.toLowerCase();
    let defaultPath = '';

    if (platform.includes('win')) {
      defaultPath = 'C:\\Users\\YourName\\Documents\\OpenStrand';
    } else if (platform.includes('mac')) {
      defaultPath = '/Users/YourName/Documents/OpenStrand';
    } else {
      defaultPath = '/home/yourname/Documents/OpenStrand';
    }

    setContentRoot(defaultPath);
  }, []);

  const handleAutoAdvance = async () => {
    // Save with defaults
    await handleSave(true);
  };

  const handleSave = async (isAuto = false) => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = localStorage.getItem('backend_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${backendUrl}/api/v1/storage/policy`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: 'local',
          contentRootPath: contentRoot,
          mirrorMode: enableMirror ? 'mirror' : 'off',
          gitEnabled: enableGit,
          pruneBehavior: 'confirm',
          maxAssetSizeMB: 512,
          compression: 'lossless',
          dedupe: true,
        }),
      });

      if (response.ok) {
        // Mark as configured
        localStorage.setItem('storage_onboarding_complete', 'true');
        onComplete();
      } else {
        // If it fails, just skip for now
        if (isAuto) {
          onSkip();
        }
      }
    } catch (err) {
      console.error('Failed to save storage settings:', err);
      if (isAuto) {
        onSkip();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = () => {
    setAutoAdvanceSeconds(-1); // Stop countdown
    handleSave(false);
  };

  const handleManualSkip = () => {
    setAutoAdvanceSeconds(-1); // Stop countdown
    onSkip();
  };

  // Pause countdown on any interaction
  const handleInteraction = () => {
    if (autoAdvanceSeconds > 0) {
      setAutoAdvanceSeconds(-1);
    }
  };

  return (
    <Card className="w-full max-w-2xl border-border/60 shadow-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <HardDrive className="w-6 h-6 text-primary" />
              Backup & Storage
            </CardTitle>
            <CardDescription className="mt-2">
              Choose where to store your notes and enable version control
            </CardDescription>
          </div>
          {autoAdvanceSeconds > 0 && (
            <Badge variant="secondary" className="text-xs">
              Auto-advancing in {autoAdvanceSeconds}s
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <strong>Local mirroring</strong> creates a backup of your notes and assets on your computer.
                This works with AI tools like Claude Code and OpenAI Codex, and enables offline access.
              </p>
            </div>
          </div>
        </div>

        {/* Content Root Path */}
        <div onFocus={handleInteraction} onClick={handleInteraction}>
          <label className="block text-sm font-medium mb-2">
            <FolderOpen className="w-4 h-4 inline mr-2" />
            Backup Location
          </label>
          <input
            type="text"
            value={contentRoot}
            onChange={(e) => {
              setContentRoot(e.target.value);
              handleInteraction();
            }}
            placeholder="/Users/you/Documents/OpenStrand"
            className="w-full px-3 py-2 border rounded-md bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            You can change this later in Settings → Storage
          </p>
        </div>

        {/* Mirror Toggle */}
        <div className="flex items-start gap-3" onClick={handleInteraction}>
          <input
            type="checkbox"
            id="enableMirror"
            checked={enableMirror}
            onChange={(e) => {
              setEnableMirror(e.target.checked);
              handleInteraction();
            }}
            className="w-4 h-4 rounded border-gray-300 mt-1"
          />
          <div className="flex-1">
            <label htmlFor="enableMirror" className="text-sm font-medium block cursor-pointer">
              Enable local mirroring
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Automatically save notes and assets to your local filesystem
            </p>
          </div>
        </div>

        {/* Git Toggle */}
        <div className="flex items-start gap-3" onClick={handleInteraction}>
          <input
            type="checkbox"
            id="enableGit"
            checked={enableGit}
            onChange={(e) => {
              setEnableGit(e.target.checked);
              handleInteraction();
            }}
            disabled={!enableMirror}
            className="w-4 h-4 rounded border-gray-300 mt-1 disabled:opacity-50"
          />
          <div className="flex-1">
            <label htmlFor="enableGit" className="text-sm font-medium block cursor-pointer flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Initialize Git repository
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Track changes with Git and enable version control
            </p>
          </div>
        </div>

        {/* Directory Structure Preview */}
        {enableMirror && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-xs font-medium mb-2 text-muted-foreground">Directory structure:</p>
            <pre className="text-xs font-mono text-muted-foreground">
{`${contentRoot}/
├── notes/           # Your notes as JSON/Markdown
├── assets/          # Images, audio, videos
├── .openstrand/     # Metadata and config
${enableGit ? '└── .git/            # Version control' : ''}`}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleManualSave}
            disabled={saving || !contentRoot}
            className="flex-1"
          >
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save & Continue
              </>
            )}
          </Button>

          <Button
            onClick={handleManualSkip}
            variant="outline"
            disabled={saving}
          >
            Skip
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Footer Note */}
        <p className="text-xs text-center text-muted-foreground">
          Don't worry, you can configure this anytime in Settings
        </p>
      </CardContent>
    </Card>
  );
}

