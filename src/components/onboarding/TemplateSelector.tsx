'use client';

/**
 * Template Selector Component
 * 
 * Allows users to choose a project template during onboarding
 * 
 * @module components/onboarding
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Book, 
  Users, 
  FolderTree, 
  Briefcase, 
  FileText, 
  Search,
  Check,
  Loader2 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  tags: string[];
  icon?: string;
  previewUrl?: string;
  usageCount: number;
}

interface TemplateSelectorProps {
  onNext: () => void;
  onSkip: () => void;
  wizardData: Record<string, unknown>;
  updateWizardData: (data: Record<string, unknown>) => void;
}

const categoryIcons: Record<string, typeof Book> = {
  STORYTELLING: Book,
  CRM: Users,
  FAMILY_TREE: FolderTree,
  PROJECT_MANAGEMENT: Briefcase,
  RESEARCH: FileText,
  DOCUMENTATION: FileText,
  CONTACTS: Users,
  CUSTOM: FileText,
};

/**
 * Template Selector Component
 */
export function TemplateSelector({ onNext, onSkip, wizardData, updateWizardData }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    (wizardData.templateId as string) || null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  /**
   * Load templates from API
   */
  const loadTemplates = async () => {
    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/templates?isPublic=true`);

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        toast.error('Failed to load templates');
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply template
   */
  const handleApply = async () => {
    if (!selectedTemplate) {
      onSkip();
      return;
    }

    setIsApplying(true);

    try {
      const token = localStorage.getItem('auth_token');
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/templates/${selectedTemplate}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables: wizardData.templateVariables || {},
        }),
      });

      if (response.ok) {
        const data = await response.json();
        updateWizardData({ 
          templateId: selectedTemplate, 
          rootStrandId: data.rootStrandId 
        });
        toast.success('Template applied successfully!');
        onNext();
      } else {
        toast.error('Failed to apply template');
      }
    } catch (error) {
      console.error('Failed to apply template:', error);
      toast.error('Failed to apply template');
    } finally {
      setIsApplying(false);
    }
  };

  /**
   * Filter templates by search query
   */
  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Choose a Template</h3>
        <p className="text-sm text-muted-foreground">
          Start with a pre-built layout or skip to create your own structure
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
          {filteredTemplates.map((template) => {
            const Icon = categoryIcons[template.category] || FileText;
            const isSelected = selectedTemplate === template.id;

            return (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={cn(
                  'relative flex flex-col items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-accent/50'
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div className="rounded-full bg-primary p-1">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {template.category.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                )}

                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {template.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Used {template.usageCount} times
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>

        <Button onClick={handleApply} disabled={!selectedTemplate || isApplying}>
          {isApplying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Apply Template
        </Button>
      </div>
    </div>
  );
}

