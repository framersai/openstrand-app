'use client';

/**
 * Work Email Enrichment Component
 * 
 * Detects work email and enriches workspace with company data
 * 
 * @module components/onboarding
 */

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Building2, Check, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useOpenStrandStore } from '@/store/openstrand.store';

interface WorkEmailEnrichmentProps {
  onNext: () => void;
  onSkip: () => void;
  wizardData: Record<string, unknown>;
  updateWizardData: (data: Record<string, unknown>) => void;
}

interface CompanyData {
  domain: string;
  name?: string;
  logoUrl?: string;
  faviconUrl?: string;
  description?: string;
  industry?: string;
  source: string;
}

/**
 * Work Email Enrichment Component
 */
export function WorkEmailEnrichment({ onNext, onSkip, wizardData, updateWizardData }: WorkEmailEnrichmentProps) {
  const user = useOpenStrandStore((state) => state.user);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (user?.email) {
      enrichEmail(user.email);
    }
  }, [user?.email]);

  /**
   * Extract domain from email
   */
  const extractDomain = (email: string): string | null => {
    const match = email.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/);
    return match ? match[1] : null;
  };

  /**
   * Check if email is work email (not common providers)
   */
  const isWorkEmail = (email: string): boolean => {
    const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const domain = extractDomain(email);
    return domain ? !commonProviders.includes(domain.toLowerCase()) : false;
  };

  /**
   * Enrich email with company data
   */
  const enrichEmail = async (email: string) => {
    if (!isWorkEmail(email)) {
      // Skip enrichment for personal emails
      return;
    }

    const domain = extractDomain(email);
    if (!domain) return;

    setIsLoading(true);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${backendUrl}/api/enrichment/domain/${domain}`);

      if (response.ok) {
        const data = await response.json();
        setCompanyData(data);
        updateWizardData({ companyData: data });
      }
    } catch (error) {
      console.error('Failed to enrich email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Apply company branding to workspace
   */
  const handleApply = async () => {
    if (!companyData) {
      onNext();
      return;
    }

    setIsApplying(true);

    try {
      // In production, this would update workspace settings with company branding
      // For now, just store in wizard data
      updateWizardData({
        companyBranding: {
          name: companyData.name,
          logo: companyData.logoUrl || companyData.faviconUrl,
          industry: companyData.industry,
        },
      });

      toast.success('Company branding applied!');
      onNext();
    } catch (error) {
      console.error('Failed to apply branding:', error);
      toast.error('Failed to apply branding');
    } finally {
      setIsApplying(false);
    }
  };

  // If not a work email, skip this step
  if (!user?.email || !isWorkEmail(user.email)) {
    useEffect(() => {
      onSkip();
    }, []);
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">Company Workspace</h3>
        <p className="text-sm text-muted-foreground">
          We detected a work email. Would you like to customize your workspace with company branding?
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Fetching company information...
          </p>
        </div>
      ) : companyData ? (
        <div className="space-y-6">
          {/* Company Info Card */}
          <div className="flex items-start gap-4 p-6 rounded-lg border border-border bg-accent/50">
            <Avatar className="h-16 w-16">
              <AvatarImage src={companyData.logoUrl || companyData.faviconUrl} alt={companyData.name} />
              <AvatarFallback>
                <Building2 className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="space-y-1">
                <h4 className="font-semibold text-lg">
                  {companyData.name || companyData.domain}
                </h4>
                {companyData.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {companyData.description}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {companyData.industry && (
                  <Badge variant="secondary">{companyData.industry}</Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Source: {companyData.source}
                </Badge>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Workspace Preview</p>
            <div className="p-4 rounded-lg border border-border bg-background">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={companyData.logoUrl || companyData.faviconUrl} alt={companyData.name} />
                  <AvatarFallback>
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {companyData.name || companyData.domain}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Team Workspace
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="rounded-full bg-muted p-4">
            <X className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium">No company information found</p>
            <p className="text-sm text-muted-foreground">
              We couldn't find branding for {extractDomain(user.email)}
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-border/60">
        <Button variant="outline" onClick={onSkip}>
          Skip for now
        </Button>

        <Button onClick={handleApply} disabled={!companyData || isApplying}>
          {isApplying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {companyData ? 'Apply Branding' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}

