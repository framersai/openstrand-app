'use client';

import Link from 'next/link';
import { BadgeCheck, Zap, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { formatPlanLabel, type PlanTier } from '@/lib/plan-info';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { Badge } from '@/components/ui/badge';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface PlanSummaryPillProps {
  plan: PlanTier;
  limitLabel: string;
  className?: string;
}

export function PlanSummaryPill({ plan, limitLabel, className }: PlanSummaryPillProps) {
  const tBilling = useTranslations('billing');
  const localizePath = useLocalizedPath();
  const isPro = plan === 'pro';
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "gap-1.5 cursor-pointer hover:bg-primary/10 transition-colors border-primary/30 bg-primary/5",
            className
          )}
        >
          <BadgeCheck className="h-3 w-3" />
          <span className="text-xs font-medium">{formatPlanLabel(plan)}</span>
          <Info className="h-3 w-3 opacity-70" />
        </Badge>
      </PopoverTrigger>
      <PopoverContent 
        side="right" 
        align="start"
        className="w-72 p-4"
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-primary" />
            <div>
              <div className="font-semibold text-sm">{formatPlanLabel(plan)} Plan</div>
              <div className="text-xs text-muted-foreground">{limitLabel}</div>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">
            {tBilling('summary')}
          </p>
          
          {!isPro && (
            <div className="pt-2 border-t">
              <Button 
                asChild 
                size="sm" 
                variant="default"
                className="w-full gap-2"
              >
                <Link href={localizePath('/billing')}>
                  <Zap className="h-3.5 w-3.5" />
                  {tBilling('comparePlans')}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
