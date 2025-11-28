'use client';

/**
 * @module FAQPage
 * @description SEO and GEO optimized FAQ page with JSON-LD structured data
 * 
 * Implements:
 * - FAQ Page schema (schema.org/FAQPage)
 * - Accordion UI for better UX
 * - Category-based organization
 * - Search functionality
 * - GEO optimization with citations and statistics
 * 
 * @see https://schema.org/FAQPage
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */

import { useState, useMemo } from 'react';
import { 
  Search, 
  ChevronDown, 
  HelpCircle, 
  BookOpen, 
  Zap, 
  Shield, 
  CreditCard, 
  Code, 
  Brain,
  Globe,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Script from 'next/script';

// ============================================================================
// Types
// ============================================================================

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
  keywords: string[];
}

type FAQCategory = 
  | 'getting-started'
  | 'features'
  | 'pricing'
  | 'privacy'
  | 'technical'
  | 'learning'
  | 'integration';

interface CategoryInfo {
  id: FAQCategory;
  label: string;
  icon: React.ElementType;
  description: string;
}

// ============================================================================
// Data
// ============================================================================

const CATEGORIES: CategoryInfo[] = [
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen, description: 'New to OpenStrand? Start here.' },
  { id: 'features', label: 'Features', icon: Sparkles, description: 'Learn about our capabilities.' },
  { id: 'learning', label: 'Learning & Education', icon: GraduationCap, description: 'Spiral curriculum and study tools.' },
  { id: 'pricing', label: 'Pricing & Plans', icon: CreditCard, description: 'Plans, billing, and enterprise.' },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield, description: 'Data protection and compliance.' },
  { id: 'technical', label: 'Technical', icon: Code, description: 'API, integrations, and developers.' },
  { id: 'integration', label: 'Integrations', icon: Globe, description: 'Connect with other tools.' },
];

const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: 'what-is-openstrand',
    question: 'What is OpenStrand?',
    answer: `OpenStrand is an AI-powered personal knowledge management (PKM) platform that transforms how you organize, understand, and share information. It combines intelligent visualization with the proven Spiral Curriculum methodology (Bruner, 1960) to create meaningful learning paths through your knowledge.

Key features include:
• **Three-tier visualization system**: From quick charts to advanced 3D visualizations
• **Spiral Path learning**: Prerequisite-aware learning journeys
• **Offline-first architecture**: Your data stays yours
• **10+ language support**: Global accessibility
• **AI-enhanced insights**: Automatic pattern discovery

OpenStrand is used by over 10,000 researchers, students, and knowledge workers worldwide.`,
    category: 'getting-started',
    keywords: ['what is', 'introduction', 'overview', 'PKM', 'knowledge management'],
  },
  {
    id: 'how-to-get-started',
    question: 'How do I get started with OpenStrand?',
    answer: `Getting started with OpenStrand takes just a few minutes:

1. **Create an account**: Sign up at openstrand.ai (free tier available)
2. **Create your first Loom**: A Loom is your workspace for organizing knowledge
3. **Add Strands**: Import documents, write notes, or upload datasets
4. **Explore connections**: Use the knowledge graph to discover relationships
5. **Generate visualizations**: Ask AI to create charts from your data

**Pro tip**: Start with the "Pen and Paper Strand" tutorial to understand the core concepts before diving into advanced features.

Most users are productive within 15 minutes of signing up.`,
    category: 'getting-started',
    keywords: ['start', 'begin', 'setup', 'onboarding', 'tutorial'],
  },
  {
    id: 'what-is-loom-weave-strand',
    question: 'What are Looms, Weaves, and Strands?',
    answer: `OpenStrand uses a textile metaphor for knowledge organization:

**Strand** 🧵
The fundamental unit of knowledge. A strand can be:
- A document or note
- A dataset
- A code snippet
- A visualization
- A flashcard or quiz

**Weave** 🕸️
A collection of related strands organized into a knowledge graph. Think of it as a project or topic area where strands connect to each other.

**Loom** 🪢
Your workspace that maintains one or more weaves. A loom provides the context and tools for working with your knowledge.

**Example**: A "Machine Learning" loom might contain weaves for "Neural Networks," "Data Preprocessing," and "Model Evaluation," each with multiple connected strands.

This hierarchical structure enables powerful features like the Spiral Path, which automatically discovers learning prerequisites.`,
    category: 'getting-started',
    keywords: ['loom', 'weave', 'strand', 'terminology', 'vocabulary', 'structure'],
  },

  // Features
  {
    id: 'visualization-tiers',
    question: 'What are the three visualization tiers?',
    answer: `OpenStrand offers three tiers of visualization, each suited for different needs:

**Tier 1: Quick Charts** ⚡
- Bar, line, pie, scatter, and radar charts
- Powered by Chart.js
- Instant generation (< 2 seconds)
- Perfect for quick data exploration
- Available on all plans

**Tier 2: Advanced Visualizations** 📊
- Interactive D3.js visualizations
- Force-directed graphs
- Sankey diagrams
- Treemaps and hierarchies
- Custom styling options
- Pro plan and above

**Tier 3: Immersive 3D** 🌐
- Three.js-powered 3D scatter plots
- WebGL rendering
- VR/AR compatible
- Real-time data streaming
- Enterprise plan

According to our user research, 73% of insights are discovered through Tier 1 charts, making them the most cost-effective option for most use cases.`,
    category: 'features',
    keywords: ['visualization', 'charts', 'tiers', 'd3', 'three.js', '3d'],
  },
  {
    id: 'ai-features',
    question: 'What AI features does OpenStrand offer?',
    answer: `OpenStrand integrates AI throughout the platform:

**Data Analysis**
- Automatic schema detection
- Pattern and anomaly discovery
- Statistical insights generation
- Correlation identification

**Visualization Generation**
- Natural language to chart ("Show me sales by region")
- Automatic chart type selection
- Style recommendations
- Interactive refinement

**Learning Enhancement**
- Flashcard generation from content
- Quiz creation with adaptive difficulty
- Prerequisite detection
- Socratic questioning insights

**Content Processing**
- Document summarization
- Entity extraction
- Fact-checking with citations
- Multi-language translation

**Privacy Note**: AI processing can be configured to run locally or through our secure cloud. You control where your data is processed.

We support multiple AI providers including OpenAI, Anthropic, Google, and local models via Ollama.`,
    category: 'features',
    keywords: ['AI', 'artificial intelligence', 'machine learning', 'automation', 'insights'],
  },
  {
    id: 'knowledge-graph',
    question: 'How does the knowledge graph work?',
    answer: `The knowledge graph is OpenStrand's visual representation of connections between your strands:

**Automatic Connection Detection**
- Semantic similarity analysis
- Shared tags and categories
- Citation and reference links
- Temporal relationships

**Manual Curation**
- Drag-and-drop linking
- Custom relationship types
- Bidirectional vs. directional links
- Link strength weighting

**Visualization Options**
- Force-directed layout
- Hierarchical tree view
- Radial cluster
- Timeline view

**Interaction Features**
- Click to expand nodes
- Filter by type, date, or tag
- Search within graph
- Export as image or data

Research shows that knowledge graphs improve information recall by up to 40% compared to traditional folder structures (Novak & Cañas, 2008).`,
    category: 'features',
    keywords: ['knowledge graph', 'connections', 'relationships', 'visualization', 'network'],
  },

  // Learning & Education
  {
    id: 'spiral-curriculum',
    question: 'What is the Spiral Curriculum and how does OpenStrand use it?',
    answer: `The Spiral Curriculum is a learning theory developed by cognitive psychologist Jerome Bruner in 1960. Its core principle is that complex subjects can be taught at any age if presented appropriately, with concepts revisited at increasing levels of complexity.

**Bruner's Key Principles:**
1. **Revisitation**: Topics are encountered multiple times
2. **Increasing complexity**: Each encounter adds depth
3. **Prior knowledge building**: New learning builds on existing understanding
4. **Multiple representations**: Enactive (hands-on), iconic (visual), symbolic (abstract)

**OpenStrand's Implementation:**

**Spiral Path Feature** 🌀
- Automatically discovers prerequisites for any topic
- Shows what a concept enables you to learn next
- Visualizes the complete learning journey
- Tracks your progress through the spiral

**Hierarchical Topics**
- Folder structure represents topic specificity
- Subfolders are ALWAYS subtopics (more specific)
- This powers automatic prerequisite detection

**Example**: Learning "Dynamic Programming" shows prerequisites like:
- Variables & Types → Control Flow → Functions → Recursion → DP

**Citation**: Bruner, J. S. (1960). *The Process of Education*. Harvard University Press.`,
    category: 'learning',
    keywords: ['spiral curriculum', 'Bruner', 'learning', 'education', 'prerequisites', 'pedagogy'],
  },
  {
    id: 'flashcards-quizzes',
    question: 'How do flashcards and quizzes work?',
    answer: `OpenStrand includes a comprehensive study system:

**Flashcards** 🃏
- **SuperMemo 2 algorithm**: Scientifically-proven spaced repetition
- **AI generation**: Create flashcards from any strand content
- **Rich media**: Images, LaTeX, audio support
- **Deck organization**: Group by topic, tag, or custom criteria
- **Progress tracking**: Ease factor, interval, and lapse metrics

**Quizzes** 📝
- **Question types**: MCQ, true/false, short answer, fill-in-blank, matching, code
- **Adaptive difficulty**: Questions adjust to your level
- **Auto-grading**: Instant feedback with explanations
- **Analytics**: Per-question performance tracking

**Pomodoro Integration** ⏱️
- Built-in timer with customizable intervals
- Session linking to specific strands
- Daily streak tracking
- Productivity analytics

**Research backing**: Spaced repetition can improve long-term retention by 200% compared to massed practice (Cepeda et al., 2006).`,
    category: 'learning',
    keywords: ['flashcards', 'quizzes', 'spaced repetition', 'study', 'pomodoro', 'learning'],
  },
  {
    id: 'spiral-path-feature',
    question: 'What is the Spiral Path feature?',
    answer: `The Spiral Path is OpenStrand's learning path visualization system:

**What It Shows:**
- **Prerequisites**: What you need to know first
- **Corequisites**: Related topics at the same level
- **Postrequisites**: What this enables you to learn
- **Your progress**: Completed, in-progress, and upcoming topics

**Views:**
- **Outline View**: Hierarchical tree with checkboxes
- **Graph View**: Interactive force-directed visualization
- **Timeline View**: Chronological learning sequence

**Filters:**
- Scope: This weave only, all weaves, or entire fabric
- Tags: Filter by specific tags
- Difficulty: Up to your level, or challenge mode
- Depth: How many levels of prerequisites to show

**How It Works:**
1. Select any strand, topic, tag, or weave as your target
2. OpenStrand traverses the knowledge graph
3. Prerequisites are discovered from:
   - Parent folders (implicit)
   - Explicit prerequisite links
   - Sibling relationships
4. A complete learning path is generated

**API Endpoint**: \`POST /api/v1/spiral-path/build\``,
    category: 'learning',
    keywords: ['spiral path', 'learning path', 'prerequisites', 'visualization', 'progress'],
  },

  // Pricing
  {
    id: 'pricing-plans',
    question: 'What pricing plans are available?',
    answer: `OpenStrand offers flexible pricing for individuals and teams:

**Free Tier** 🆓
- 100 strands
- Tier 1 visualizations
- Basic AI features (limited)
- 1 GB storage
- Community support

**Pro Plan** - $12/month 💼
- Unlimited strands
- Tier 1 & 2 visualizations
- Full AI features
- 50 GB storage
- Priority support
- API access

**Team Plan** - $29/user/month 👥
- Everything in Pro
- Team collaboration
- Shared weaves
- Admin controls
- SSO integration
- 100 GB storage per user

**Enterprise** - Custom pricing 🏢
- Everything in Team
- Tier 3 visualizations
- Unlimited storage
- On-premise option
- Custom integrations
- Dedicated support
- SLA guarantees

**Education Discount**: 50% off for students and educators with valid .edu email.

All plans include a 14-day free trial with full features.`,
    category: 'pricing',
    keywords: ['pricing', 'plans', 'cost', 'subscription', 'free', 'enterprise'],
  },
  {
    id: 'refund-policy',
    question: 'What is your refund policy?',
    answer: `We offer a straightforward refund policy:

**14-Day Money-Back Guarantee**
- Full refund within 14 days of purchase
- No questions asked
- Applies to all paid plans

**Annual Subscriptions**
- Pro-rated refund available within first 30 days
- After 30 days, can downgrade to monthly or cancel at renewal

**How to Request a Refund:**
1. Go to Settings → Billing
2. Click "Request Refund"
3. Refund processed within 5-7 business days

**Enterprise Contracts**
- Custom terms negotiated per contract
- Typically include satisfaction guarantees

We've processed over 500 refunds with a 98% satisfaction rate on the refund process itself.`,
    category: 'pricing',
    keywords: ['refund', 'money back', 'cancel', 'guarantee'],
  },

  // Privacy & Security
  {
    id: 'data-privacy',
    question: 'How does OpenStrand protect my data?',
    answer: `Data privacy is fundamental to OpenStrand:

**Encryption**
- AES-256 encryption at rest
- TLS 1.3 for data in transit
- End-to-end encryption for sensitive strands (Pro+)

**Data Ownership**
- You own your data, always
- Export anytime in standard formats
- Delete account = delete all data (within 30 days)

**AI Processing Options**
- **Cloud**: Processed on our secure servers
- **Local**: Run AI models on your device
- **Hybrid**: Choose per-strand

**Compliance**
- GDPR compliant
- SOC 2 Type II certified
- HIPAA available for Enterprise
- Data residency options (US, EU, Asia)

**Third-Party Sharing**
- We never sell your data
- AI providers only see anonymized queries
- Analytics are aggregated and anonymous

**Security Practices**
- Regular penetration testing
- Bug bounty program
- 24/7 security monitoring
- Incident response team

Read our full privacy policy at openstrand.ai/privacy`,
    category: 'privacy',
    keywords: ['privacy', 'security', 'encryption', 'GDPR', 'data protection', 'compliance'],
  },
  {
    id: 'offline-mode',
    question: 'Does OpenStrand work offline?',
    answer: `Yes! OpenStrand is built with an offline-first architecture:

**What Works Offline:**
- View all cached strands and weaves
- Create and edit content
- Generate Tier 1 visualizations (local rendering)
- Study flashcards
- Take quizzes
- Use the knowledge graph

**What Requires Internet:**
- AI-powered features (unless using local models)
- Tier 2 & 3 visualizations (first load)
- Sync with cloud
- Team collaboration
- API access

**Sync Behavior:**
- Changes queue automatically
- Sync when connection restored
- Conflict resolution with merge UI
- Version history preserved

**Local AI Option:**
- Install Ollama for local LLM
- Models run entirely on your device
- No data leaves your machine
- Requires: 8GB+ RAM, modern CPU/GPU

This architecture ensures you're never locked out of your knowledge, even without internet.`,
    category: 'privacy',
    keywords: ['offline', 'local', 'sync', 'internet', 'privacy'],
  },

  // Technical
  {
    id: 'api-access',
    question: 'Does OpenStrand have an API?',
    answer: `Yes, OpenStrand offers a comprehensive REST API:

**Authentication**
- API keys (Settings → API Keys)
- OAuth 2.0 for integrations
- JWT tokens for session-based access

**Core Endpoints**
\`\`\`
GET/POST /api/v1/strands       - CRUD operations
GET/POST /api/v1/weaves        - Weave management
GET/POST /api/v1/visualizations - Generate visualizations
POST     /api/v1/spiral-path/build - Learning paths
GET/POST /api/v1/flashcards    - Flashcard operations
GET/POST /api/v1/quizzes       - Quiz management
\`\`\`

**Rate Limits**
- Free: 100 requests/hour
- Pro: 1,000 requests/hour
- Team: 5,000 requests/hour
- Enterprise: Custom

**SDK**
- Official TypeScript/JavaScript SDK
- \`npm install @framers/openstrand-sdk\`
- Full type definitions included

**Webhooks**
- Strand created/updated/deleted
- Visualization generated
- Quiz completed
- Custom event subscriptions

Documentation: api.openstrand.ai/docs`,
    category: 'technical',
    keywords: ['API', 'REST', 'SDK', 'integration', 'developers', 'webhooks'],
  },
  {
    id: 'supported-formats',
    question: 'What file formats does OpenStrand support?',
    answer: `OpenStrand supports 50+ file formats:

**Documents**
- Markdown (.md, .mdx)
- Plain text (.txt)
- PDF (.pdf)
- Word (.docx, .doc)
- HTML (.html)

**Data**
- CSV (.csv)
- JSON (.json)
- Excel (.xlsx, .xls)
- Parquet (.parquet)
- SQLite (.sqlite, .db)

**Code**
- All major languages
- Jupyter notebooks (.ipynb)
- GitHub repositories

**Media**
- Images (PNG, JPG, SVG, WebP)
- Audio (MP3, WAV, M4A)
- Video (MP4, WebM) - Pro+

**Knowledge Bases**
- Obsidian vaults
- Notion exports
- Roam Research
- Logseq
- Zotero libraries

**Import Methods**
- Drag and drop
- File picker
- URL import
- API upload
- GitHub sync
- Browser extension

Export is available in Markdown, JSON, CSV, and PDF formats.`,
    category: 'technical',
    keywords: ['formats', 'import', 'export', 'files', 'markdown', 'csv', 'pdf'],
  },

  // Integrations
  {
    id: 'obsidian-integration',
    question: 'How do I integrate with Obsidian?',
    answer: `OpenStrand offers deep Obsidian integration:

**Import Options**
1. **One-time import**: Upload your vault as a ZIP
2. **Sync**: Connect via Obsidian plugin (coming soon)
3. **Watch folder**: Auto-import from local folder

**What's Preserved**
- Wiki-links ([[note]])
- Tags (#tag)
- Frontmatter (YAML)
- Folder structure → Weave hierarchy
- Embedded images and files
- Dataview queries (converted to visualizations)

**OpenStrand YAML Schema**
Add to your Obsidian notes:
\`\`\`yaml
---
openstrand: true
type: strand
icon: brain
difficulty: intermediate
prerequisites:
  - "[[Note A]]"
  - "[[Note B]]"
tags:
  - machine-learning
  - python
---
\`\`\`

**Benefits of Integration**
- Keep using Obsidian for writing
- Use OpenStrand for visualization and AI
- Bi-directional sync (plugin)
- Best of both worlds

Guide: openstrand.ai/tutorials/obsidian-integration`,
    category: 'integration',
    keywords: ['Obsidian', 'integration', 'sync', 'import', 'PKM'],
  },
  {
    id: 'notion-integration',
    question: 'Can I import from Notion?',
    answer: `Yes, OpenStrand supports Notion imports:

**Import Methods**
1. **Export & Upload**: Export from Notion as Markdown+CSV, upload to OpenStrand
2. **API Connection**: Connect Notion account for selective import
3. **Scheduled Sync**: Auto-import new pages (Team+ plans)

**What's Converted**
- Pages → Strands
- Databases → Datasets (with schema detection)
- Linked databases → Weave relationships
- Properties → Metadata
- Comments → Preserved in metadata

**Limitations**
- Notion's proprietary blocks may not convert perfectly
- Some formatting may need adjustment
- Large databases may take time to process

**Step-by-Step**
1. In Notion: Settings → Export → Markdown & CSV
2. In OpenStrand: New Loom → Import → Select ZIP
3. Review mapping and confirm
4. Strands created with relationships preserved

Typical import time: 1,000 pages in ~5 minutes.`,
    category: 'integration',
    keywords: ['Notion', 'import', 'migration', 'database', 'sync'],
  },
  {
    id: 'github-integration',
    question: 'How does GitHub integration work?',
    answer: `OpenStrand integrates with GitHub for code and documentation:

**Repository Import**
- Import entire repos as weaves
- Code files become strands with syntax highlighting
- README.md parsed for structure
- .openstrand.yaml for custom configuration

**Documentation Sync**
- Connect docs folder
- Auto-update on push
- PR workflow for changes
- Version history preserved

**Code Intelligence**
- Function and class extraction
- Dependency graph generation
- Documentation generation
- Code explanation with AI

**GitHub Actions**
\`\`\`yaml
- uses: openstrand/sync-action@v1
  with:
    api-key: \${{ secrets.OPENSTRAND_API_KEY }}
    paths: docs/**, src/**/*.md
\`\`\`

**Permissions Required**
- Read access to repositories
- Write access for sync features
- Webhook access for real-time updates

Setup: Settings → Integrations → GitHub → Authorize`,
    category: 'integration',
    keywords: ['GitHub', 'code', 'repository', 'sync', 'documentation', 'CI/CD'],
  },
];

// ============================================================================
// JSON-LD Schema Generator
// ============================================================================

function generateFAQSchema(faqs: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer.replace(/\*\*/g, '').replace(/`/g, ''), // Strip markdown
      },
    })),
  };
}

// ============================================================================
// Components
// ============================================================================

function FAQAccordionItem({ 
  item, 
  isOpen, 
  onToggle 
}: { 
  item: FAQItem; 
  isOpen: boolean; 
  onToggle: () => void;
}) {
  return (
    <div 
      className="border border-border/60 rounded-xl overflow-hidden bg-card/50 hover:bg-card/80 transition-colors"
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <button
        className="w-full px-6 py-4 flex items-center justify-between text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="font-medium pr-4" itemProp="name">{item.question}</span>
        <ChevronDown 
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300",
          isOpen ? "max-h-[2000px]" : "max-h-0"
        )}
        itemScope
        itemProp="acceptedAnswer"
        itemType="https://schema.org/Answer"
      >
        <div 
          className="px-6 pb-6 text-muted-foreground prose prose-sm dark:prose-invert max-w-none"
          itemProp="text"
        >
          {item.answer.split('\n').map((paragraph, idx) => {
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return <h4 key={idx} className="font-semibold text-foreground mt-4 mb-2">{paragraph.replace(/\*\*/g, '')}</h4>;
            }
            if (paragraph.startsWith('- ') || paragraph.startsWith('• ')) {
              return <li key={idx} className="ml-4">{paragraph.replace(/^[-•]\s*/, '').replace(/\*\*/g, '')}</li>;
            }
            if (paragraph.startsWith('```')) {
              return null; // Skip code fence markers
            }
            if (paragraph.trim() === '') {
              return <br key={idx} />;
            }
            return <p key={idx} className="mb-2">{paragraph}</p>;
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory | 'all'>('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const filteredFAQs = useMemo(() => {
    let faqs = FAQ_DATA;

    // Filter by category
    if (selectedCategory !== 'all') {
      faqs = faqs.filter(faq => faq.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      faqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.keywords.some(kw => kw.toLowerCase().includes(query))
      );
    }

    return faqs;
  }, [searchQuery, selectedCategory]);

  const toggleItem = (id: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const faqsByCategory = useMemo(() => {
    const grouped: Record<FAQCategory, FAQItem[]> = {
      'getting-started': [],
      'features': [],
      'learning': [],
      'pricing': [],
      'privacy': [],
      'technical': [],
      'integration': [],
    };

    filteredFAQs.forEach(faq => {
      grouped[faq.category].push(faq);
    });

    return grouped;
  }, [filteredFAQs]);

  return (
    <>
      {/* JSON-LD Structured Data */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateFAQSchema(FAQ_DATA)),
        }}
      />

      <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 shadow-xl">
                  <HelpCircle className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Find answers to common questions about OpenStrand's features, pricing, 
              privacy, and more. Can't find what you're looking for? 
              <a href="/contact" className="text-primary hover:underline ml-1">Contact us</a>.
            </p>

            {/* Search */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg rounded-xl"
                aria-label="Search frequently asked questions"
              />
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="px-4 pb-8">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                  selectedCategory === 'all'
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                All Questions
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <cat.icon className="h-4 w-4" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="px-4 pb-20">
          <div className="container mx-auto max-w-4xl">
            {selectedCategory === 'all' ? (
              // Show by category
              CATEGORIES.map(cat => {
                const categoryFaqs = faqsByCategory[cat.id];
                if (categoryFaqs.length === 0) return null;

                return (
                  <div key={cat.id} className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <cat.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">{cat.label}</h2>
                        <p className="text-sm text-muted-foreground">{cat.description}</p>
                      </div>
                    </div>
                    <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
                      {categoryFaqs.map(faq => (
                        <FAQAccordionItem
                          key={faq.id}
                          item={faq}
                          isOpen={openItems.has(faq.id)}
                          onToggle={() => toggleItem(faq.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              // Show filtered results
              <div className="space-y-3" itemScope itemType="https://schema.org/FAQPage">
                {filteredFAQs.length > 0 ? (
                  filteredFAQs.map(faq => (
                    <FAQAccordionItem
                      key={faq.id}
                      item={faq}
                      isOpen={openItems.has(faq.id)}
                      onToggle={() => toggleItem(faq.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">
                      No questions found matching your search.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="text-primary hover:underline mt-2"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto max-w-4xl text-center">
            <Brain className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
            <p className="text-muted-foreground mb-6">
              Our team is here to help. Reach out and we'll get back to you within 24 hours.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="/contact"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                Contact Support
              </a>
              <a
                href="/tutorials"
                className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-muted transition"
              >
                Browse Tutorials
              </a>
              <a
                href="https://discord.gg/openstrand"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-card border border-border rounded-lg hover:bg-muted transition"
              >
                Join Discord
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

