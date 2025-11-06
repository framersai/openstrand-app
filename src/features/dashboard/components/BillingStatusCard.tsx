'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { openstrandAPI } from '@/services/openstrand.api';

export interface BillingStatusCardProps {
  teamId?: string;
}

type ProvidersResponse = {
  systemProviders: string[];
  userProviders: string[];
  hasGlobalOpenAI: boolean;
  hasGlobalAnthropic: boolean;
  hasUserOpenAI: boolean;
  hasUserAnthropic: boolean;
};

export function BillingStatusCard({ teamId }: BillingStatusCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<ProvidersResponse | null>(null);
  const [userUsage, setUserUsage] = useState<any>(null);
  const [teamUsage, setTeamUsage] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        // Auto-detect primary team via team admin list
        let resolvedTeamId = teamId;
        if (!resolvedTeamId) {
          const teamAdmin = await openstrandAPI.team.list().catch(() => null);
          const teams: Array<{ id: string; plan?: string }> = Array.isArray(teamAdmin?.teams) ? teamAdmin.teams : [];
          if (teams.length > 0) {
            resolvedTeamId = teams[0].id;
          }
        }

        const [prov, sub, usageUser, usageTeam] = await Promise.all([
          openstrandAPI.aiProviders.list().catch(() => null),
          openstrandAPI.billing.subscription().catch(() => null),
          openstrandAPI.billing.usageSummary({ scope: 'user' }).catch(() => null),
          resolvedTeamId ? openstrandAPI.billing.usageSummary({ scope: 'team', teamId: resolvedTeamId }).catch(() => null) : Promise.resolve(null),
        ]);
        if (!mounted) return;
        setProviders(prov);
        setSubscription(sub);
        setUserUsage(usageUser);
        setTeamUsage(usageTeam);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load billing status');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => { mounted = false; };
  }, [teamId]);

  const renderProviderBadge = (name: string, active: boolean) => (
    <Badge variant={active ? 'default' : 'secondary'} className="text-[10px]">
      {name}: {active ? 'active' : '—'}
    </Badge>
  );

  const monthlyLimit = userUsage?.monthlyLimit ?? null;
  const total = userUsage?.total ?? 0;
  const remaining = userUsage?.remaining ?? null;
  const plan = (subscription?.plan || userUsage?.plan || 'free') as string;

  return (
    <Card className="mb-4 border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Usage & Keys</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px] capitalize">Plan: {plan}</Badge>
              {monthlyLimit == null ? (
                <Badge variant="secondary" className="text-[10px]">Unlimited</Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px]">${total.toFixed(2)} used / ${monthlyLimit.toFixed(2)} limit</Badge>
              )}
              {remaining != null && (
                <Badge variant={remaining > 0 ? 'default' : 'destructive'} className="text-[10px]">${remaining.toFixed(2)} remaining</Badge>
              )}
            </div>

            {providers && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Global:</span>
                {renderProviderBadge('OpenAI', providers.hasGlobalOpenAI)}
                {renderProviderBadge('Anthropic', providers.hasGlobalAnthropic)}
                <span className="ml-2 text-xs text-muted-foreground">BYOK:</span>
                {renderProviderBadge('OpenAI', providers.hasUserOpenAI)}
                {renderProviderBadge('Anthropic', providers.hasUserAnthropic)}
              </div>
            )}

            {teamUsage && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">Team</Badge>
                <Badge variant="secondary" className="text-[10px]">${(teamUsage.total ?? 0).toFixed(2)} used this period</Badge>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}


