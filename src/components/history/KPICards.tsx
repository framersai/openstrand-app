'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, FileText, Smile, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  dateRange: { from: Date; to: Date };
}

interface KPIData {
  streak: number;
  totalEntries: number;
  avgMood: number;
  totalStrands: number;
}

export function KPICards({ dateRange }: KPICardsProps) {
  const t = useTranslations('history.kpi');
  const [data, setData] = useState<KPIData>({
    streak: 0,
    totalEntries: 0,
    avgMood: 0,
    totalStrands: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchKPIs = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API calls
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 500));
        setData({
          streak: 14,
          totalEntries: 42,
          avgMood: 7.5,
          totalStrands: 128,
        });
      } catch (error) {
        console.error('Failed to fetch KPIs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKPIs();
  }, [dateRange]);

  const cards = [
    {
      icon: Flame,
      label: t('streak'),
      value: `${data.streak}`,
      suffix: t('days'),
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      icon: FileText,
      label: t('totalEntries'),
      value: `${data.totalEntries}`,
      suffix: t('notes'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      icon: Smile,
      label: t('avgMood'),
      value: data.avgMood.toFixed(1),
      suffix: '/ 10',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      icon: TrendingUp,
      label: t('totalStrands'),
      value: `${data.totalStrands}`,
      suffix: t('created'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="overflow-hidden transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground font-medium">
                    {card.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{card.value}</p>
                    <p className="text-sm text-muted-foreground">{card.suffix}</p>
                  </div>
                </div>
                <div className={cn('p-3 rounded-lg', card.bgColor)}>
                  <Icon className={cn('h-6 w-6', card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

