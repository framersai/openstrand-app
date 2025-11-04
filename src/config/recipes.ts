export interface ExplorationRecipe {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'trends' | 'segments' | 'rankings' | 'cohorts';
  icon: string;
  highlights?: string[];
  debugContext?: string;
}

export const EXPLORATION_RECIPES: ExplorationRecipe[] = [
  {
    id: 'top-performers',
    title: 'Top performers',
    description: 'Rank the top 10 companies by ARR with growth %',
    prompt: 'Rank the top 10 companies by ARR and include their year-over-year growth percentage.',
    category: 'rankings',
    icon: '[R]',
    highlights: ['ARR', 'Growth %'],
  },
  {
    id: 'trendline',
    title: 'Trend line',
    description: 'Plot ARR trend over the last 12 months',
    prompt: 'Show a line chart of ARR over the last 12 months highlighting peaks and troughs.',
    category: 'trends',
    icon: '[T]',
    highlights: ['Monthly ARR', 'Peaks'],
  },
  {
    id: 'segment-share',
    title: 'Segment share',
    description: 'Stacked bar by industry and funding stage',
    prompt: 'Create a stacked bar chart showing industry share broken down by funding stage.',
    category: 'segments',
    icon: '[S]',
    highlights: ['Industries', 'Stages'],
  },
  {
    id: 'retention-cohort',
    title: 'Retention cohort',
    description: 'Cohort table by signup month',
    prompt: 'Build a cohort table that tracks retention % by customer signup month.',
    category: 'cohorts',
    icon: '[C]',
    highlights: ['Signup month', 'Retention %'],
  },
  {
    id: 'correlation',
    title: 'Correlation heatmap',
    description: 'ARR vs valuation vs team size',
    prompt: 'Analyze the correlation between ARR, valuation, and team size with a heatmap.',
    category: 'segments',
    icon: '[H]',
    highlights: ['ARR', 'Valuation', 'Team size'],
  },
  {
    id: 'auto-insights',
    title: 'Auto insights',
    description: 'Let the LLM surface correlations, outliers, and recommended charts.',
    prompt:
      'Scan the dataset and list the most actionable insights, correlations, outliers, and recommended chart types. Highlight why each matters.',
    category: 'segments',
    icon: '[AI]',
    highlights: ['Correlations', 'Outliers', 'Recommendations'],
    debugContext: 'Auto insights triggers the LLM-only path and exposes the debug log inline.',
  },
];
