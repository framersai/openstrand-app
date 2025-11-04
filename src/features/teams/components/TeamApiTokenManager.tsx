"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  CreateTeamApiTokenPayload,
  TeamAdminSummary,
  TeamApiToken,
  openstrandAPI,
} from '@/services/openstrand.api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  CalendarDays,
  Copy,
  Key,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AVAILABLE_SCOPES: Array<{ value: string; label: string; helper: string }> = [
  { value: 'read', label: 'Read', helper: 'List + fetch strands, weaves, catalog data' },
  { value: 'write', label: 'Write', helper: 'Create + update strands, uploads, annotations' },
  { value: 'admin', label: 'Admin', helper: 'Manage team settings, tokens, and approvals' },
];

interface TokenFormState {
  teamId: string;
  name: string;
  description: string;
  scopes: string[];
  expiresAt: string;
}

const DEFAULT_FORM_STATE: TokenFormState = {
  teamId: '',
  name: '',
  description: '',
  scopes: ['read'],
  expiresAt: '',
};

function formatDate(value?: string | null): string {
  if (!value) return '—';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleString();
  } catch {
    return '—';
  }
}

function tokenStatusBadge(status: TeamApiToken['status']): { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; } {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'default' };
    case 'expired':
      return { label: 'Expired', variant: 'secondary' };
    case 'revoked':
    default:
      return { label: 'Revoked', variant: 'outline' };
  }
}

export function TeamApiTokenManager() {
  const [tokens, setTokens] = useState<TeamApiToken[]>([]);
  const [teams, setTeams] = useState<TeamAdminSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [form, setForm] = useState<TokenFormState>(DEFAULT_FORM_STATE);
  const [plaintextToken, setPlaintextToken] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { tokens: tokenList, teams: teamList } = await openstrandAPI.team.list();
      setTokens(tokenList);
      setTeams(teamList);

      if (teamList.length === 1 && !form.teamId) {
        setForm((prev) => ({ ...prev, teamId: teamList[0].id }));
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load API tokens');
    } finally {
      setLoading(false);
    }
  }, [form.teamId]);

  useEffect(() => {
    void fetchTokens();
  }, [fetchTokens]);

  const handleScopeToggle = (scope: string, checked: boolean) => {
    setForm((prev) => {
      const existing = new Set(prev.scopes);
      if (checked) {
        existing.add(scope);
      } else {
        existing.delete(scope);
      }
      if (existing.size === 0) {
        existing.add('read');
      }
      return { ...prev, scopes: Array.from(existing) };
    });
  };

  const handleCreate = async () => {
    if (!form.teamId) {
      toast.error('Select a team to generate a token');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Provide a token name');
      return;
    }

    const payload: CreateTeamApiTokenPayload = {
      teamId: form.teamId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      scopes: form.scopes,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };

    try {
      setCreating(true);
      const response = await openstrandAPI.team.create(payload);
      setPlaintextToken(response?.plaintext ?? null);
      toast.success('API token created');
      setCreateOpen(false);
      setForm({ ...DEFAULT_FORM_STATE, teamId: payload.teamId });
      await fetchTokens();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to create token');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (tokenId: string) => {
    try {
      setRevokingId(tokenId);
      await openstrandAPI.team.revoke(tokenId);
      toast.success('Token revoked');
      setTokens((prev) => prev.map((token) => (token.id === tokenId ? { ...token, status: 'revoked', revokedAt: new Date().toISOString() } : token)));
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to revoke token');
    } finally {
      setRevokingId(null);
    }
  };

  const copyPlaintext = async () => {
    if (!plaintextToken) return;
    try {
      await navigator.clipboard.writeText(plaintextToken);
      toast.success('Token copied to clipboard');
    } catch (err) {
      console.error(err);
      toast.error('Unable to copy to clipboard');
    }
  };

  const teamOptions = useMemo(() => teams.map((team) => ({
    id: team.id,
    name: team.name,
    plan: team.plan,
  })), [teams]);

  return (
    <Card className="border-border/70 shadow-xl">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <CardTitle className="text-xl font-semibold">Team API tokens</CardTitle>
          <CardDescription>
            Generate scoped tokens for CI pipelines, notebooks, and integrations. Tokens are available on Team or Enterprise plans and inherit team-level rate limits and audit trails.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fetchTokens()}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button type="button" size="sm" className="gap-2" onClick={() => {
            setPlaintextToken(null);
            setForm((prev) => ({ ...DEFAULT_FORM_STATE, teamId: prev.teamId || teams[0]?.id || '' }));
            setCreateOpen(true);
          }}>
            <Plus className="h-4 w-4" />
            Generate token
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Unable to load tokens</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {plaintextToken && (
          <Alert variant="info" className="border-primary/40">
            <AlertTitle>New API token created</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <p className="text-sm">
                This secret is only shown once. Store it securely in your vault or secrets manager.
              </p>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 font-mono text-xs">
                <span className="truncate">{plaintextToken}</span>
                <Button variant="ghost" size="icon" onClick={() => void copyPlaintext()}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy token</span>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">Issued tokens</h3>
          <Card className="border-dashed border-border/60">
            <ScrollArea className="max-h-[400px]">
              <div className="divide-y divide-border/60">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading tokens…
                  </div>
                ) : tokens.length === 0 ? (
                  <div className="space-y-2 px-4 py-10 text-center text-sm text-muted-foreground">
                    <Key className="mx-auto h-5 w-5 text-primary" />
                    <p>No tokens issued yet. Generate one to connect pipelines or notebooks.</p>
                  </div>
                ) : (
                  tokens.map((token) => {
                    const badge = tokenStatusBadge(token.status);
                    return (
                      <div key={token.id} className="flex flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{token.name}</span>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                            <Badge variant="secondary" className="text-[11px]">
                              Team plan: {token.teamPlan}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Token • ends with {token.lastFour} • scopes: {token.scopes.join(', ')}
                          </p>
                          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                            <span>Created {formatDate(token.createdAt)}</span>
                            <span>Last used {formatDate(token.lastUsedAt)}</span>
                            <span>Expires {formatDate(token.expiresAt)}</span>
                          </div>
                          {token.description ? (
                            <p className="text-xs text-muted-foreground">{token.description}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="gap-2 text-destructive"
                            disabled={token.status === 'revoked' || revokingId === token.id}
                            onClick={() => void handleRevoke(token.id)}
                          >
                            {revokingId === token.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Revoke
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </CardContent>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Generate a new API token</DialogTitle>
            <DialogDescription>
              Tokens inherit your team’s plan rate limits and are audited automatically. Scopes tighten what the token can modify.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-token-team">Team</Label>
              <select
                id="team-token-team"
                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                value={form.teamId}
                onChange={(event) => setForm((prev) => ({ ...prev, teamId: event.target.value }))}
              >
                <option value="">Select a team</option>
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} • {team.plan}
                  </option>
                ))}
              </select>
              {teams.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  You need an active Team or Enterprise workspace with admin rights to mint tokens.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-token-name">Token label</Label>
              <Input
                id="team-token-name"
                placeholder="CI sync pipeline"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-token-description">Description</Label>
              <Textarea
                id="team-token-description"
                placeholder="Optional context for other admins"
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Scopes
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <ShieldCheck className="h-3 w-3" /> Principle of least privilege
                </Badge>
              </Label>
              <div className="grid gap-2 md:grid-cols-3">
                {AVAILABLE_SCOPES.map((scope) => (
                  <label
                    key={scope.value}
                    className={cn(
                      'flex cursor-pointer items-start gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 text-xs transition hover:border-primary/40 hover:bg-primary/5',
                      form.scopes.includes(scope.value) && 'border-primary/50 bg-primary/10',
                    )}
                  >
                    <Checkbox
                      checked={form.scopes.includes(scope.value)}
                      onCheckedChange={(checked) => handleScopeToggle(scope.value, Boolean(checked))}
                    />
                    <span className="flex flex-col gap-1">
                      <span className="font-medium text-foreground">{scope.label}</span>
                      <span className="text-[11px] text-muted-foreground">{scope.helper}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-token-expiry" className="flex items-center gap-2">
                Expiration (optional)
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              </Label>
              <Input
                id="team-token-expiry"
                type="datetime-local"
                value={form.expiresAt}
                onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
              />
            </div>

            <Separator />
            <p className="text-xs text-muted-foreground">
              Token secrets are hashed on the server. Keep the plaintext token secure; revoking it immediately disables any integrations using it.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setCreateOpen(false);
                setForm(DEFAULT_FORM_STATE);
              }}
            >
              Cancel
            </Button>
            <Button type="button" className="gap-2" disabled={creating} onClick={() => void handleCreate()}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Generate token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

