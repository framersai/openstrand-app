'use client';

import { useState } from 'react';
import { Check, FolderOpen, GitBranch, Play, Eye } from 'lucide-react';
import { PageLayout } from '@/components/layouts/PageLayout';
import Link from 'next/link';

/**
 * Quick-start tutorial: Turn on mirroring, edit a note, watch Git commit.
 * Step-by-step guide with interactive elements and code examples.
 */
export default function BackupQuickstartTutorial() {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (step: number) => {
    if (completedSteps.includes(step)) {
      setCompletedSteps(completedSteps.filter(s => s !== step));
    } else {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const steps = [
    {
      title: 'Enable Mirroring',
      description: 'Configure your backup location and enable local mirroring',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Navigate to <strong>Settings → Storage</strong> and configure:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Set <strong>Content Root Path</strong> to a location on your computer (e.g., <code className="bg-muted px-2 py-1 rounded text-xs">/Users/you/Documents/OpenStrand</code>)</li>
            <li>Check <strong>Enable mirroring</strong></li>
            <li>Check <strong>Initialize Git repository</strong></li>
            <li>Click <strong>Save Settings</strong></li>
          </ol>
          <Link href="/settings/storage" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
            <FolderOpen className="w-4 h-4" />
            Open Storage Settings
          </Link>
        </div>
      ),
    },
    {
      title: 'Create a Note',
      description: 'Create your first mirrored note',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Create a new note to trigger the first mirror:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Navigate to <strong>PKMS → Strands</strong></li>
            <li>Click <strong>New Strand</strong></li>
            <li>Add a title: <code className="bg-muted px-2 py-1 rounded text-xs">My First Mirrored Note</code></li>
            <li>Add some content in the editor</li>
            <li>Click <strong>Save</strong></li>
          </ol>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 mt-3">
            <p className="text-xs text-blue-900 dark:text-blue-200">
              💡 <strong>Tip:</strong> The note will be automatically mirrored to your content root within seconds!
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Verify the Mirror',
      description: 'Check that your note was saved to the filesystem',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Open your content root in Finder/Explorer and verify the structure:</p>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`/your/content/root/
├── notes/
│   └── 2025-01-15/
│       └── my-first-mirrored-note-abc123.json
├── assets/
├── .openstrand/
│   └── index.json
└── .git/
    └── ...`}
          </pre>
          <p className="text-sm">You can also check via terminal:</p>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`# macOS/Linux
ls -la /your/content/root/notes/

# Windows (PowerShell)
Get-ChildItem C:\\your\\content\\root\\notes\\`}
          </pre>
        </div>
      ),
    },
    {
      title: 'View Git History',
      description: 'See the automatic Git commit for your note',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Open a terminal and navigate to your content root:</p>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`cd /your/content/root
git log --oneline --graph`}
          </pre>
          <p className="text-sm">You should see a commit like:</p>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`* a1b2c3d mirror: update 1 note
* 9f8e7d6 mirror: init repository`}
          </pre>
          <p className="text-sm">View the commit details:</p>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`git show HEAD`}
          </pre>
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 mt-3">
            <p className="text-xs text-green-900 dark:text-green-200">
              ✅ <strong>Success!</strong> Your notes are now version-controlled and backed up locally.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Edit and Watch',
      description: 'Make changes and see them automatically committed',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Edit your note in OpenStrand:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Open the note you created</li>
            <li>Add more content or change the title</li>
            <li>Click <strong>Save</strong></li>
            <li>Wait ~60 seconds for the automatic commit</li>
          </ol>
          <p className="text-sm">Check the Git log again:</p>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`git log --oneline --graph
# You should see a new commit!`}
          </pre>
          <p className="text-sm">View the diff between commits:</p>
          <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`git diff HEAD~1 HEAD`}
          </pre>
        </div>
      ),
    },
    {
      title: 'Bonus: Use AI Tools',
      description: 'Access your notes with Claude Code or OpenAI Codex',
      content: (
        <div className="space-y-3">
          <p className="text-sm">Your notes are now accessible to AI assistants!</p>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Claude Code:</p>
            <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`claude index /your/content/root/notes
claude ask "Summarize my notes from today"`}
            </pre>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Custom Script:</p>
            <pre className="bg-muted p-3 rounded text-xs font-mono overflow-x-auto">
{`# Find all notes with "machine learning" tag
grep -r '"tags".*"machine-learning"' /your/content/root/notes`}
            </pre>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 rounded-lg p-3 mt-3">
            <p className="text-xs text-purple-900 dark:text-purple-200">
              🚀 <strong>Pro Tip:</strong> Your notes are now in a standard format that works with any tool or script!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-primary" />
            Backup Quick Start
          </h1>
          <p className="text-lg text-muted-foreground">
            Turn on mirroring, edit a note, and watch Git commit automatically
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedSteps.length} / {steps.length} steps
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            return (
              <div
                key={index}
                className={`border rounded-lg p-6 transition-all ${
                  isCompleted ? 'bg-green-50 dark:bg-green-950/10 border-green-200 dark:border-green-900' : 'bg-card'
                }`}
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => toggleStep(index)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-muted-foreground/30 hover:border-primary'
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <span className="text-sm">{index + 1}</span>}
                  </button>

                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{step.description}</p>
                    {step.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion */}
        {progress === 100 && (
          <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-900 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Congratulations! 🎉</h3>
                <p className="text-sm mb-4">
                  You've successfully set up local backups with Git version control. Your notes are now:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mb-4">
                  <li>Automatically backed up to your filesystem</li>
                  <li>Version-controlled with Git</li>
                  <li>Compatible with AI tools like Claude Code</li>
                  <li>Accessible offline</li>
                </ul>
                <div className="flex gap-3">
                  <Link
                    href="/docs/backup-and-sync"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    Read Full Documentation
                  </Link>
                  <Link
                    href="/settings/storage"
                    className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors text-sm"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Advanced Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-8 border rounded-lg p-6">
          <h3 className="font-semibold mb-3">Next Steps</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Learn about <Link href="/docs/obsidian-vault" className="text-primary hover:underline">Obsidian Vault Integration</Link></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Explore <Link href="/docs/exports-and-imports" className="text-primary hover:underline">Export & Import Options</Link></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Set up <Link href="/docs/integrations-github" className="text-primary hover:underline">GitHub Integration</Link> for remote backups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">→</span>
              <span>Configure <Link href="/teams/storage" className="text-primary hover:underline">Team Storage Policy</Link> (Teams Edition)</span>
            </li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}

