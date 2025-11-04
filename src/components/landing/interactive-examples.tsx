'use client';

import { useState } from 'react';
import {
  Play,
  Code2,
  Users,
  ArrowRight,
  Database,
  LineChart,
  Brain,
  Sparkles,
  Upload,
  Download,
  GitBranch,
  Zap,
  FileText,
  Image,
  BarChart3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  KnowledgeWeavingIcon,
  VisualizationTierIcon,
  SchemaIntelligenceIcon,
  InteractiveDemoIcon,
  NeuralStrandIcon
} from '@/components/landing/icons';
import { LiveDemo } from '@/components/landing/live-demo';

interface InteractiveExamplesProps {
  id?: string;
  className?: string;
}

const codeExamples = {
  typescript: `import { OpenStrandSDK } from '@openstrand/sdk';

const client = new OpenStrandSDK({
  apiUrl: 'http://localhost:8000',
  token: process.env.OPENSTRAND_TOKEN,
});

const strand = await client.strands.create({
  type: 'dataset',
  title: 'Q4 revenue analysis',
});

const request = await client.strands.requestStructureChange(strand.id, {
  scopeId: 'team:sales',
  type: 'ADD_CHILD',
  parentId: 'scope-root',
  justification: 'Requested in weekly sync',
});

if (request) {
  await client.strands.resolveStructureRequest(request.id, 'approve', { note: 'Approved by data operations' });
}

await client.meta.updatePlaceholderPreferences({
  default: { text: 'Pending scope approval', icon: 'ph:clock' },
});`,
  python: `from openstrand import OpenStrandClient

client = OpenStrandClient(
    api_url='http://localhost:8000',
    token=os.getenv('OPENSTRAND_TOKEN'),
)

strand = client.strands.create({
    'type': 'dataset',
    'title': 'Q4 revenue analysis'
})

request = client.strands.request_structure_change(
    strand['id'],
    scope_id='team:sales',
    request_type='ADD_CHILD',
    parent_id='scope-root',
    justification='Requested in weekly sync'
)

if request:
    client.strands.resolve_structure_request(request['id'], action='approve', note='Approved by data operations')

client.meta.update_placeholder_preferences({
    'default': { 'text': 'Pending scope approval', 'icon': 'ph:clock' }
})`,
  curl: `# Queue a structure change
curl -X POST https://api.openstrand.ai/v1/strands/STRAND_ID/structure/requests \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "scopeId": "team:sales",
    "type": "ADD_CHILD",
    "parentId": "scope-root",
    "justification": "Requested in weekly sync"
  }'

# Approve the request
curl -X POST https://api.openstrand.ai/v1/strands/structure/requests/REQUEST_ID/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Approved by data operations"
  }'

# Update placeholder preferences
curl -X PUT https://api.openstrand.ai/v1/meta/placeholders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "default": { "text": "Pending scope approval", "icon": "ph:clock" }
  }'`
};

const useCases = [
  {
    id: 'research',
    title: 'Research Teams',
    icon: Brain,
    description: 'Keep literature reviews in sync while compliance signs off on every structural change.',
    scenario: 'A biotech guild curates multi-department strands with reviewers spread across time zones.',
    benefits: [
      'Queue structure approvals per study scope',
      'Audit visibility cascades before publication',
      'Share placeholder-safe previews with external partners',
    ],
    metrics: { approvals: '128/week', 'cascade latency': '320 ms', reuse: '42% cross-scope reuse' },
  },
  {
    id: 'customer-success',
    title: 'Customer Success',
    icon: Users,
    description: 'Ship recursive playbooks while regional managers approve updates before they go live.',
    scenario: 'A SaaS org maintains shared playbooks across AMER, EMEA, and APAC teams.',
    benefits: [
      'Route strand edits through per-region approvers',
      'Let visibility cascades roll out new placeholders instantly',
      'Track audit history for every customer touchpoint',
    ],
    metrics: { approvals: '3.5 min median', placeholders: '100% coverage', scopes: '12 active scopes' },
  },
  {
    id: 'knowledge',
    title: 'Knowledge Operations',
    icon: FileText,
    description: 'Curate recursive knowledge bases with confident reuse and programmable placeholder policies.',
    scenario: 'An internal enablement team stitches together product, sales, and support strands.',
    benefits: [
      'Draft structure requests directly from AI suggestions',
      'Preview cascaded visibility states before publishing',
      'Automate placeholder text per audience',
    ],
    metrics: { suggestions: '68% auto-adopted', approvals: '2 reviewers', conflicts: '0 unresolved' },
  },
];

const beforeAfterExamples = [
  {
    id: 'manual-tree',
    before: {
      title: 'Manual spreadsheet of nested IDs',
      content: `team_scope,parent,strand
board,root,analysis
board,analysis,deck
...`,
      icon: FileText,
      time: 'Hours per update',
    },
    after: {
      title: 'Queue structure requests and approve once',
      content: 'Analysts file structure requests, reviewers approve with context, and cascades update visibility instantly.',
      features: [
        'Per-scope approval routing',
        'Automatic visibility cascades',
        'Change log with full audit trail',
      ],
      time: 'Minutes with audit certainty',
    },
  },
  {
    id: 'email-approvals',
    before: {
      title: 'Approval via email threads',
      content: 'Forwarding messages and spreadsheets to get buy-in for every hierarchy edit.',
      icon: Users,
      time: 'Unpredictable',
    },
    after: {
      title: 'Approval drawer with context and notes',
      content: 'Reviewers see requested changes, justification, and placeholder previews before approving or rejecting.',
      features: [
        'Inline diff of parent/child changes',
        'Optional resolution notes',
        'Webhook + Slack notifications',
      ],
      time: 'Under 5 minutes',
    },
  },
  {
    id: 'hidden-content',
    before: {
      title: 'Hidden pages break flows',
      content: 'Viewers hit dead ends when strands are private or pending approval.',
      icon: Zap,
      time: 'N/A',
    },
    after: {
      title: 'Placeholder policies keep flows intact',
      content: 'Configure default placeholder text and icons so every audience sees meaningful context even without access.',
      features: [
        'Per-team placeholder defaults',
        'Scope overrides and analytics',
        'Auto-expiry when approvals land',
      ],
      time: 'Continuous experience',
    },
  },
];

export function InteractiveExamples({ id, className }: InteractiveExamplesProps) {
  const [activeUseCase, setActiveUseCase] = useState('research');
  const [activeExample, setActiveExample] = useState('csv-to-insight');

  const currentUseCase = useCases.find(uc => uc.id === activeUseCase) || useCases[0];
  const currentExample = beforeAfterExamples.find(ex => ex.id === activeExample) || beforeAfterExamples[0];

  return (
    <section id={id} className={cn('landing-section py-24', className)}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <Badge className="mb-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white">
            <InteractiveDemoIcon className="mr-1 h-3 w-3" />
            Interactive Examples
          </Badge>
          <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
            See OpenStrand in Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Live demos, real code, actual transformations. No marketing fluff.
          </p>
        </div>

        {/* Tabs for different example types */}
        <Tabs defaultValue="live-demo" className="space-y-8">
          <TabsList className="mx-auto grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="live-demo" className="gap-2">
              <Play className="h-4 w-4" />
              Live Demo
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code2 className="h-4 w-4" />
              Code
            </TabsTrigger>
            <TabsTrigger value="use-cases" className="gap-2">
              <Users className="h-4 w-4" />
              Use Cases
            </TabsTrigger>
            <TabsTrigger value="transformations" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Before/After
            </TabsTrigger>
          </TabsList>

          {/* Live Demo Tab */}
          <TabsContent value="live-demo" className="space-y-6">
            <div className="mx-auto max-w-5xl">
              <LiveDemo className="animate-fade-in" />
            </div>
          </TabsContent>

          {/* Code Examples Tab */}
          <TabsContent value="code" className="space-y-6">
            <div className="mx-auto max-w-4xl">
              <Tabs defaultValue="typescript" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>

                {Object.entries(codeExamples).map(([lang, code]) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-950 dark:border-gray-800">
                      <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
                        <span className="text-xs font-medium text-gray-400">
                          {lang === 'typescript' ? 'TypeScript / JavaScript' :
                           lang === 'python' ? 'Python' : 'REST API'}
                        </span>
                        <Button size="sm" variant="ghost" className="h-6 gap-1 text-xs text-gray-400 hover:text-white">
                          <Code2 className="h-3 w-3" />
                          Copy
                        </Button>
                      </div>
                      <pre className="overflow-x-auto p-4">
                        <code className="text-sm text-gray-300">{code}</code>
                      </pre>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              {/* SDK Links */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href="https://npmjs.com/package/@openstrand/sdk" target="_blank" rel="noopener noreferrer">
                    <Image className="h-4 w-4" />
                    npm Package
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href="https://pypi.org/project/openstrand/" target="_blank" rel="noopener noreferrer">
                    <Image className="h-4 w-4" />
                    PyPI Package
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="gap-2" asChild>
                  <a href="/docs/api" target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    API Docs
                  </a>
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Use Cases Tab */}
          <TabsContent value="use-cases" className="space-y-6">
            <div className="mx-auto max-w-5xl">
              {/* Use case selector */}
              <div className="mb-8 flex flex-wrap justify-center gap-3">
                {useCases.map((useCase) => (
                  <Button
                    key={useCase.id}
                    variant={activeUseCase === useCase.id ? 'default' : 'outline'}
                    onClick={() => setActiveUseCase(useCase.id)}
                    className="gap-2"
                  >
                    <useCase.icon className="h-4 w-4" />
                    {useCase.title}
                  </Button>
                ))}
              </div>

              {/* Use case details */}
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-2 text-xl font-semibold text-foreground">
                      {currentUseCase.title}
                    </h3>
                    <p className="text-muted-foreground">{currentUseCase.description}</p>
                  </div>

                  <div className="rounded-xl border border-cyan-200/30 bg-cyan-50/30 p-6 dark:border-cyan-800/30 dark:bg-cyan-950/20">
                    <p className="mb-3 text-sm font-medium uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                      Real Scenario
                    </p>
                    <p className="text-sm text-foreground">{currentUseCase.scenario}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                      Key Benefits
                    </p>
                    {currentUseCase.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5 h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 p-0.5">
                          <div className="h-full w-full rounded-full bg-white dark:bg-gray-950" />
                        </div>
                        <span className="text-sm text-foreground">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Metrics cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(currentUseCase.metrics).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-border bg-background/50 p-4 text-center">
                        <p className="text-2xl font-bold text-foreground">{value}</p>
                        <p className="text-xs capitalize text-muted-foreground">{key}</p>
                      </div>
                    ))}
                  </div>

                  {/* Visual representation */}
                  <div className="relative overflow-hidden rounded-xl border border-cyan-200/30 bg-gradient-to-br from-cyan-50/50 to-teal-50/50 p-8 dark:border-cyan-800/30 dark:from-cyan-950/30 dark:to-teal-950/30">
                    <div className="flex items-center justify-center">
                      <currentUseCase.icon className="h-32 w-32 text-cyan-500/20" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <BarChart3 className="mx-auto mb-3 h-12 w-12 text-cyan-600" />
                        <p className="text-sm font-medium text-foreground">
                          Interactive Demo Available
                        </p>
                        <Button size="sm" className="mt-3 gap-2" variant="secondary">
                          <Play className="h-3 w-3" />
                          Try This Scenario
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Before/After Tab */}
          <TabsContent value="transformations" className="space-y-6">
            <div className="mx-auto max-w-5xl">
              {/* Example selector */}
              <div className="mb-8 flex flex-wrap justify-center gap-3">
                {beforeAfterExamples.map((example) => (
                  <Button
                    key={example.id}
                    variant={activeExample === example.id ? 'default' : 'outline'}
                    onClick={() => setActiveExample(example.id)}
                    size="sm"
                  >
                    {example.before.title}
                  </Button>
                ))}
              </div>

              {/* Before/After comparison */}
              <div className="grid gap-8 md:grid-cols-2">
                {/* Before */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                      <currentExample.before.icon className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Before OpenStrand</h3>
                      <p className="text-xs text-muted-foreground">{currentExample.before.time}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-red-200/30 bg-red-50/30 p-6 dark:border-red-800/30 dark:bg-red-950/10">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      {currentExample.before.title}
                    </p>
                    <pre className="overflow-x-auto rounded-lg bg-gray-100 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      {currentExample.before.content}
                    </pre>
                  </div>

                  <div className="flex items-center justify-center py-4">
                    <ArrowRight className="h-8 w-8 text-cyan-500" />
                  </div>
                </div>

                {/* After */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                      <Sparkles className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">After OpenStrand</h3>
                      <p className="text-xs text-muted-foreground">{currentExample.after.time}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-emerald-200/30 bg-gradient-to-br from-emerald-50/30 to-teal-50/30 p-6 dark:border-emerald-800/30 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <p className="mb-3 text-sm font-medium text-foreground">
                      {currentExample.after.title}
                    </p>
                    <p className="mb-4 text-lg">{currentExample.after.content}</p>

                    <div className="space-y-2">
                      {currentExample.after.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <span className="text-sm text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <Button className="mt-6 w-full gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700">
                      <Zap className="h-4 w-4" />
                      Transform Your Data Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}