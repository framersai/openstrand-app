'use client';

/**
 * @module CostUsagePanel
 * @description User-facing cost tracking and usage analytics panel
 * 
 * Features:
 * - Current month cost summary
 * - Provider/operation breakdown charts
 * - Daily usage timeline
 * - Paginated cost history
 * - CSV export
 * - Cost reset with confirmation
 * 
 * Used in both Community Edition (user settings) and Teams Edition (profile).
 */

import { useState, useEffect } from 'react';
import { DollarSign, Download, RefreshCcw, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface UsageStats {
  totalCost: number;
  totalOperations: number;
  totalTokens: number;
  byProvider: Record<string, { cost: number; operations: number; tokens: number }>;
  byOperation: Record<string, { cost: number; operations: number; tokens: number }>;
  dailyUsage: Array<{ date: string; cost: number; count: number }>;
  dateRange: { start: string; end: string };
}

interface CostRecord {
  id: string;
  costType: string;
  provider: string;
  amount: number;
  currency: string;
  tokens?: number;
  timestamp: Date;
  metadata?: any;
}

/**
 * Cost usage panel for user settings and profile pages.
 * Shows comprehensive AI usage analytics with export and reset capabilities.
 */
export function CostUsagePanel() {
  const { toast } = useToast();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [history, setHistory] = useState<CostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/cost/usage/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/v1/cost/usage/history?take=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setHistory(result.data.records || []);
      }
    } catch (error) {
      console.error('Failed to load cost history:', error);
    }
  };

  useEffect(() => {
    void loadStats();
    void loadHistory();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/v1/cost/usage/export', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `openstrand-costs-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export complete',
          description: 'Cost records downloaded as CSV',
        });
      }
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Unable to download cost records',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await fetch('/api/v1/cost/usage/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          reason: 'User requested reset from settings',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Costs reset',
          description: result.message,
        });
        await loadStats();
        await loadHistory();
      }
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: 'Unable to reset cost records',
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            AI Usage & Costs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const providerData = stats
    ? Object.entries(stats.byProvider).map(([provider, data]) => ({
        provider,
        cost: data.cost,
        operations: data.operations,
      }))
    : [];

  const dailyData = stats?.dailyUsage || [];

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                AI Usage & Costs
              </CardTitle>
              <CardDescription className="mt-1">
                Current month: {stats?.dateRange.start.split('T')[0]} to {stats?.dateRange.end.split('T')[0]}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={exporting || !stats}
                className="gap-2"
              >
                <Download className={cn('h-4 w-4', exporting && 'animate-pulse')} />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { void loadStats(); void loadHistory(); }}
                disabled={loading}
              >
                <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* KPIs */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div className="rounded-lg border border-border/50 bg-card/70 p-4">
              <div className="text-sm text-muted-foreground mb-1">Total Cost</div>
              <div className="text-2xl font-bold text-foreground">
                ${stats?.totalCost.toFixed(2) || '0.00'}
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/70 p-4">
              <div className="text-sm text-muted-foreground mb-1">Operations</div>
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalOperations.toLocaleString() || '0'}
              </div>
            </div>
            <div className="rounded-lg border border-border/50 bg-card/70 p-4">
              <div className="text-sm text-muted-foreground mb-1">Tokens</div>
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalTokens.toLocaleString() || '0'}
              </div>
            </div>
          </div>

          {/* Provider Breakdown */}
          {providerData.length > 0 && (
            <Card className="border-border/60 bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Cost by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={providerData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis dataKey="provider" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toFixed(4)}`, 'Cost']} />
                    <Bar dataKey="cost" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Daily Timeline */}
          {dailyData.length > 0 && (
            <Card className="border-border/60 bg-muted/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Daily Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'cost') return [`$${Number(value).toFixed(4)}`, 'Cost'];
                        return [value, 'Operations'];
                      }}
                    />
                    <Bar dataKey="cost" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Recent History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Last 10 AI operations</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              No cost records yet. Start using AI features to see usage here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Provider</TableHead>
                    <TableHead className="text-xs text-right">Cost</TableHead>
                    <TableHead className="text-xs text-right">Tokens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-xs">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {record.costType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs capitalize">{record.provider}</TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        ${record.amount.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">
                        {record.tokens?.toLocaleString() || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Section */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            Reset Cost Records
          </CardTitle>
          <CardDescription>
            Archive all cost records and start fresh. This action creates an audit trail but cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={!stats || stats.totalCost === 0}>
                Reset All Costs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset cost records?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <div>
                    This will archive <strong>{stats?.totalOperations || 0} cost records</strong> totaling{' '}
                    <strong>${stats?.totalCost.toFixed(2) || '0.00'}</strong>.
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Records will be marked as archived (not deleted) for audit purposes.
                    You can export them before resetting if needed.
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} disabled={resetting}>
                  {resetting ? 'Resetting...' : 'Reset Costs'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

