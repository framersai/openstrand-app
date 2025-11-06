/**
 * Dataset type definitions with language support
 */

export interface Dataset {
  id: string;
  name: string;
  description?: string;

  // Language support
  language: string;                    // Primary language (ISO 639-1 code, e.g., 'en', 'zh-CN')
  languages_available: string[];       // Available translations
  is_international?: boolean;          // True for English datasets (shown to all users)

  // Metadata translations
  metadata?: {
    [locale: string]: {
      name: string;
      description?: string;
      tags?: string[];
    }
  };

  // Data structure
  rows: number;
  columns: number;
  size?: number;

  // Column information with translations
  column_info?: DatasetColumn[];

  // File information
  file_type?: 'csv' | 'json' | 'tsv' | 'excel';
  original_filename?: string;

  // Status and visibility
  status?: 'pending' | 'approved' | 'rejected' | 'archived';
  visibility?: 'public' | 'private' | 'premium';

  // Timestamps
  created_at?: string;
  updated_at?: string;

  // User information
  user_id?: string;
  user_email?: string;

  // Sample data
  sample_data?: any[];

  // Statistics
  stats?: {
    numeric_columns?: number;
    text_columns?: number;
    date_columns?: number;
    null_percentage?: number;
  };

  // Provider information
  provider?: 'openrouter' | 'openai' | 'anthropic' | 'heuristic';

  // Cost tracking
  processing_cost?: number;

  // Community feedback
  feedback?: {
    upvotes: number;
    downvotes: number;
    favorites: number;
  };
}

export interface DatasetColumn {
  original_name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';

  // Translation support
  translations?: {
    [locale: string]: {
      name: string;
      description?: string;
      semantic_type?: string;  // e.g., 'revenue', 'date', 'category'
    }
  };

  // Statistics
  stats?: {
    unique_values?: number;
    null_count?: number;
    min?: number | string;
    max?: number | string;
    mean?: number;
    median?: number;
    mode?: any;
  };

  // Sample values
  samples?: any[];

  // Metadata
  format?: string;  // e.g., 'currency', 'percentage', 'date:YYYY-MM-DD'
  unit?: string;    // e.g., 'USD', 'km', 'kg'
}

export interface DatasetUploadRequest {
  file: File;
  name?: string;
  description?: string;
  language?: string;        // User-specified or 'auto' for detection
  translate?: boolean;       // Premium feature: auto-translate metadata
  visibility?: 'public' | 'private';
  tags?: string[];
}

export interface DatasetTranslationRequest {
  dataset_id: string;
  target_languages: string[];
  translate_columns: boolean;
  translate_metadata: boolean;
  use_ai?: boolean;  // Use AI for translation vs manual
}

export interface DatasetFilter {
  language?: string | string[];
  include_international?: boolean;  // Include English datasets
  visibility?: 'public' | 'private' | 'premium';
  status?: string;
  user_id?: string;
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'name' | 'rows' | 'popularity';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface LanguageDetectionResult {
  detected_language: string;
  confidence: number;
  alternative_languages?: {
    language: string;
    confidence: number;
  }[];
  charset?: string;
  script?: string;  // e.g., 'Latin', 'Chinese', 'Arabic', 'Cyrillic'
}

export interface DatasetLanguageBadge {
  language: string;
  label: string;
  flag?: string;
  is_translated?: boolean;
  is_international?: boolean;
}

// Helper functions
export function getDatasetLanguageLabel(dataset: Dataset): string {
  if (dataset.is_international || dataset.language === 'en') {
    return 'INT';  // International
  }
  return dataset.language.toUpperCase();
}

export function getDatasetDisplayName(dataset: Dataset, locale: string): string {
  // Return translated name if available
  if (dataset.metadata?.[locale]?.name) {
    return dataset.metadata[locale].name;
  }
  // Fallback to original name
  return dataset.name;
}

export function getColumnDisplayName(column: DatasetColumn, locale: string): string {
  // Return translated name if available
  if (column.translations?.[locale]?.name) {
    return column.translations[locale].name;
  }
  // Fallback to original name
  return column.original_name;
}

export function isDatasetAvailableInLanguage(dataset: Dataset, language: string): boolean {
  // English datasets are available to everyone
  if (dataset.is_international || dataset.language === 'en') {
    return true;
  }

  // Check if dataset is in the requested language
  if (dataset.language === language) {
    return true;
  }

  // Check if translation is available
  if (dataset.languages_available?.includes(language)) {
    return true;
  }

  return false;
}

export function getDatasetLanguages(dataset: Dataset): string[] {
  const languages = [dataset.language];

  if (dataset.languages_available) {
    languages.push(...dataset.languages_available);
  }

  // Remove duplicates
  return [...new Set(languages)];
}

// Sample datasets with language support
export const SAMPLE_DATASETS: Partial<Dataset>[] = [
  {
    id: 'saas-100-en',
    name: 'Top 100 SaaS Companies',
    description: 'Leading SaaS companies with revenue and growth metrics',
    language: 'en',
    is_international: true,
    rows: 100,
    columns: 12,
    languages_available: ['zh-CN', 'es', 'ja', 'ko']
  },
  {
    id: 'tech-companies-zh',
    name: '科技公司数据集',
    description: '中国顶级科技公司的财务和运营数据',
    language: 'zh-CN',
    rows: 50,
    columns: 15,
    metadata: {
      'en': {
        name: 'Tech Companies Dataset',
        description: 'Financial and operational data of top Chinese tech companies'
      }
    }
  },
  {
    id: 'startup-metrics-ja',
    name: 'スタートアップメトリクス',
    description: '日本のスタートアップ企業の成長指標',
    language: 'ja',
    rows: 75,
    columns: 10,
    metadata: {
      'en': {
        name: 'Startup Metrics',
        description: 'Growth metrics of Japanese startup companies'
      }
    }
  }
];