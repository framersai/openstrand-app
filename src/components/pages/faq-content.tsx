'use client';

/**
 * FAQ Page Content - Client Component
 * Frequently Asked Questions about OpenStrand
 */

import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, BookOpen, Sparkles, Database, Shield, CreditCard, Code } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// FAQ Categories
const FAQ_CATEGORIES = [
  { id: 'general', label: 'General', icon: BookOpen },
  { id: 'features', label: 'Features', icon: Sparkles },
  { id: 'data', label: 'Data & Privacy', icon: Database },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'pricing', label: 'Pricing', icon: CreditCard },
  { id: 'technical', label: 'Technical', icon: Code },
] as const;

type FAQCategory = typeof FAQ_CATEGORIES[number]['id'];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
}

const FAQ_ITEMS: FAQItem[] = [
  // General
  {
    id: 'what-is-openstrand',
    question: 'What is OpenStrand?',
    answer: 'OpenStrand is an AI-powered knowledge management and data visualization platform that helps you organize, understand, and visualize your data and documents. It uses the Spiral Curriculum methodology to help you learn and retain information more effectively.',
    category: 'general',
  },
  {
    id: 'who-is-it-for',
    question: 'Who is OpenStrand for?',
    answer: 'OpenStrand is designed for researchers, students, knowledge workers, and anyone who needs to organize large amounts of information. It\'s particularly useful for those who want to understand complex topics through progressive learning.',
    category: 'general',
  },
  {
    id: 'what-is-spiral-curriculum',
    question: 'What is the Spiral Curriculum?',
    answer: 'The Spiral Curriculum is a learning theory developed by cognitive psychologist Jerome Bruner. It involves revisiting topics repeatedly, with each visit building on previous knowledge and increasing complexity. OpenStrand implements this by helping you create learning paths that progressively deepen understanding.',
    category: 'general',
  },
  // Features
  {
    id: 'what-are-strands',
    question: 'What are Strands?',
    answer: 'Strands are the fundamental units of knowledge in OpenStrand. They can be documents, notes, datasets, or any piece of information. Strands can be connected to form knowledge graphs and organized into hierarchies.',
    category: 'features',
  },
  {
    id: 'what-are-looms',
    question: 'What are Looms?',
    answer: 'Looms are workspaces or projects that contain related Strands. Think of them as folders or containers that help you organize your knowledge by topic, project, or any other grouping that makes sense for your work.',
    category: 'features',
  },
  {
    id: 'what-are-weaves',
    question: 'What are Weaves?',
    answer: 'Weaves are collections of Looms that share common themes or purposes. They provide a higher-level organization for your knowledge, allowing you to group related projects together.',
    category: 'features',
  },
  {
    id: 'ai-visualizations',
    question: 'How do AI-powered visualizations work?',
    answer: 'OpenStrand uses AI to analyze your data and automatically suggest the most appropriate visualization types. You can describe what you want to see in natural language, and the AI will generate charts, graphs, and other visualizations that best represent your data.',
    category: 'features',
  },
  // Data & Privacy
  {
    id: 'data-storage',
    question: 'Where is my data stored?',
    answer: 'Your data is stored securely on our servers with encryption at rest and in transit. We also support local-first workflows where you can keep sensitive data on your own machine and only sync metadata to the cloud.',
    category: 'data',
  },
  {
    id: 'data-export',
    question: 'Can I export my data?',
    answer: 'Yes, you can export all your data at any time in standard formats including JSON, CSV, and Markdown. We believe in data portability and never lock you into our platform.',
    category: 'data',
  },
  {
    id: 'data-deletion',
    question: 'Can I delete my data?',
    answer: 'Yes, you can delete individual Strands, Looms, or your entire account at any time. When you delete data, it is permanently removed from our servers within 30 days.',
    category: 'data',
  },
  // Security
  {
    id: 'encryption',
    question: 'Is my data encrypted?',
    answer: 'Yes, all data is encrypted both in transit (using TLS 1.3) and at rest (using AES-256 encryption). We follow industry best practices for data security.',
    category: 'security',
  },
  {
    id: 'authentication',
    question: 'What authentication methods do you support?',
    answer: 'We support email/password authentication, OAuth with Google and GitHub, and enterprise SSO options. Two-factor authentication is available for all accounts.',
    category: 'security',
  },
  // Pricing
  {
    id: 'free-tier',
    question: 'Is there a free tier?',
    answer: 'Yes, OpenStrand offers a generous free tier that includes basic features, limited AI visualizations, and up to 100 Strands. It\'s perfect for trying out the platform or for personal use.',
    category: 'pricing',
  },
  {
    id: 'pricing-plans',
    question: 'What pricing plans are available?',
    answer: 'We offer Free, Pro, and Enterprise plans. Pro includes unlimited Strands, advanced AI features, and priority support. Enterprise adds team collaboration, SSO, and dedicated support.',
    category: 'pricing',
  },
  // Technical
  {
    id: 'api-access',
    question: 'Do you have an API?',
    answer: 'Yes, OpenStrand provides a comprehensive REST API and SDK for integrating with your own applications. API access is available on Pro and Enterprise plans.',
    category: 'technical',
  },
  {
    id: 'file-formats',
    question: 'What file formats are supported?',
    answer: 'OpenStrand supports a wide range of formats including Markdown, JSON, CSV, Excel, PDF, and common image formats. We also support YAML frontmatter for metadata.',
    category: 'technical',
  },
  {
    id: 'integrations',
    question: 'What integrations are available?',
    answer: 'We integrate with GitHub, Google Drive, Notion, and other popular tools. Our API also allows you to build custom integrations with any service.',
    category: 'technical',
  },
];

function FAQAccordionItem({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left hover:text-primary transition-colors"
        aria-expanded={isOpen}
      >
        <span className="font-medium pr-4">{item.question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

export function FAQPageContent() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<FAQCategory | 'all'>('all');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const filteredFAQs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesSearch = search === '' || 
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Find answers to common questions about OpenStrand, our features, pricing, and more.
            </p>
            
            {/* Search */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto gap-1 py-2 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              )}
            >
              All Questions
            </button>
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2',
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                )}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No questions found matching your search.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50 border rounded-lg bg-card p-6">
                {filteredFAQs.map((item) => (
                  <FAQAccordionItem
                    key={item.id}
                    item={item}
                    isOpen={openItems.has(item.id)}
                    onToggle={() => toggleItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            Can&apos;t find what you&apos;re looking for? Our support team is here to help.
          </p>
          <a
            href="mailto:support@openstrand.ai"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </section>
    </main>
  );
}

