/**
 * i18n Configuration
 * Central configuration for internationalization using next-intl
 */

export const defaultLocale = 'en' as const;

export const locales = [
  'en',      // English (base)
  'zh-CN',   // Chinese Simplified
  'es',      // Spanish
  'hi',      // Hindi
  'ar',      // Arabic (RTL)
  'ja',      // Japanese
  'ko',      // Korean
  'pt',      // Portuguese
  'ru',      // Russian
  'fr',      // French
] as const;

export type Locale = (typeof locales)[number];

// Language metadata for UI display
export const languageMetadata: Record<Locale, {
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  flag: string;
}> = {
  'en': {
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
  },
  'zh-CN': {
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    flag: '🇨🇳',
  },
  'es': {
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    flag: '🇪🇸',
  },
  'hi': {
    name: 'Hindi',
    nativeName: 'हिन्दी',
    direction: 'ltr',
    flag: '🇮🇳',
  },
  'ar': {
    name: 'Arabic',
    nativeName: 'العربية',
    direction: 'rtl',
    flag: '🇸🇦',
  },
  'ja': {
    name: 'Japanese',
    nativeName: '日本語',
    direction: 'ltr',
    flag: '🇯🇵',
  },
  'ko': {
    name: 'Korean',
    nativeName: '한국어',
    direction: 'ltr',
    flag: '🇰🇷',
  },
  'pt': {
    name: 'Portuguese',
    nativeName: 'Português',
    direction: 'ltr',
    flag: '🇧🇷',
  },
  'ru': {
    name: 'Russian',
    nativeName: 'Русский',
    direction: 'ltr',
    flag: '🇷🇺',
  },
  'fr': {
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    flag: '🇫🇷',
  },
};

// Locale detection configuration
export const localeDetection = {
  // Try to detect from:
  // 1. Cookie
  // 2. Accept-Language header
  // 3. Default to 'en'
  cookieName: 'locale',
  // Cookie expires in 1 year
  cookieMaxAge: 365 * 24 * 60 * 60,
};

// Format configurations per locale
export const formats = {
  dateTime: {
    short: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
    long: {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    },
  },
  number: {
    precise: {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  },
  list: {
    enumeration: {
      style: 'long',
      type: 'conjunction',
    },
  },
};

// Supported currencies per locale
export const localeCurrencies: Record<Locale, string> = {
  'en': 'USD',
  'zh-CN': 'CNY',
  'es': 'EUR',
  'hi': 'INR',
  'ar': 'SAR',
  'ja': 'JPY',
  'ko': 'KRW',
  'pt': 'BRL',
  'ru': 'RUB',
  'fr': 'EUR',
};

// Date format patterns per locale
export const localeDateFormats: Record<Locale, string> = {
  'en': 'MM/DD/YYYY',
  'zh-CN': 'YYYY年MM月DD日',
  'es': 'DD/MM/YYYY',
  'hi': 'DD/MM/YYYY',
  'ar': 'DD/MM/YYYY',
  'ja': 'YYYY年MM月DD日',
  'ko': 'YYYY년 MM월 DD일',
  'pt': 'DD/MM/YYYY',
  'ru': 'DD.MM.YYYY',
  'fr': 'DD/MM/YYYY',
};

// Number format patterns per locale
export const localeNumberFormats: Record<Locale, {
  decimal: string;
  thousand: string;
}> = {
  'en': { decimal: '.', thousand: ',' },
  'zh-CN': { decimal: '.', thousand: ',' },
  'es': { decimal: ',', thousand: '.' },
  'hi': { decimal: '.', thousand: ',' },
  'ar': { decimal: '٫', thousand: '٬' },
  'ja': { decimal: '.', thousand: ',' },
  'ko': { decimal: '.', thousand: ',' },
  'pt': { decimal: ',', thousand: '.' },
  'ru': { decimal: ',', thousand: ' ' },
  'fr': { decimal: ',', thousand: ' ' },
};

// Font families optimized for each language
export const localeFonts: Record<Locale, string> = {
  'en': 'Inter, system-ui, -apple-system, sans-serif',
  'zh-CN': '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif',
  'es': 'Inter, system-ui, -apple-system, sans-serif',
  'hi': '"Noto Sans Devanagari", "Mangal", sans-serif',
  'ar': '"Noto Sans Arabic", "Segoe UI Arabic", "Tahoma", sans-serif',
  'ja': '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", sans-serif',
  'ko': '"Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif',
  'pt': 'Inter, system-ui, -apple-system, sans-serif',
  'ru': 'Inter, "Segoe UI", "Helvetica Neue", sans-serif',
  'fr': 'Inter, system-ui, -apple-system, sans-serif',
};

// SEO metadata per locale
export const localeSEO: Record<Locale, {
  title: string;
  description: string;
  keywords: string[];
}> = {
  'en': {
    title: 'OpenStrand - AI-Powered Personal Knowledge Management Platform',
    description: 'Transform your data into insights with natural language. Build charts, tables, and visualizations using AI.',
    keywords: ['data visualization', 'AI', 'charts', 'analytics', 'business intelligence'],
  },
  'zh-CN': {
    title: 'OpenStrand - AI驱动的个人知识管理平台',
    description: '使用自然语言将您的数据转化为洞察。使用AI构建图表、表格和可视化。',
    keywords: ['数据可视化', '人工智能', '图表', '分析', '商业智能'],
  },
  'es': {
    title: 'OpenStrand - Plataforma de Gestión del Conocimiento con IA',
    description: 'Transforma tus datos en insights con lenguaje natural. Crea gráficos, tablas y visualizaciones usando IA.',
    keywords: ['visualización de datos', 'IA', 'gráficos', 'análisis', 'inteligencia empresarial'],
  },
  'hi': {
    title: 'OpenStrand - AI-संचालित नॉलेज मैनेजमेंट प्लेटफ़ॉर्म',
    description: 'प्राकृतिक भाषा के साथ अपने डेटा को अंतर्दृष्टि में बदलें। AI का उपयोग करके चार्ट, टेबल और विज़ुअलाइज़ेशन बनाएं।',
    keywords: ['डेटा विज़ुअलाइज़ेशन', 'AI', 'चार्ट', 'विश्लेषण', 'बिज़नेस इंटेलिजेंस'],
  },
  'ar': {
    title: 'OpenStrand - منصة إدارة المعرفة المدعومة بالذكاء الاصطناعي',
    description: 'حول بياناتك إلى رؤى باستخدام اللغة الطبيعية. قم ببناء المخططات والجداول والتصورات باستخدام الذكاء الاصطناعي.',
    keywords: ['تصور البيانات', 'الذكاء الاصطناعي', 'المخططات', 'التحليلات', 'ذكاء الأعمال'],
  },
  'ja': {
    title: 'OpenStrand - AI駆動のナレッジマネジメントプラットフォーム',
    description: '自然言語でデータをインサイトに変換。AIを使用してチャート、テーブル、ビジュアライゼーションを構築。',
    keywords: ['データ可視化', 'AI', 'チャート', '分析', 'ビジネスインテリジェンス'],
  },
  'ko': {
    title: 'OpenStrand - AI 기반 지식 관리 플랫폼',
    description: '자연어로 데이터를 통찰력으로 변환하세요. AI를 사용하여 차트, 테이블 및 시각화를 구축하세요.',
    keywords: ['데이터 시각화', 'AI', '차트', '분석', '비즈니스 인텔리전스'],
  },
  'pt': {
    title: 'OpenStrand - Plataforma de Gestão de Conhecimento com IA',
    description: 'Transforme seus dados em insights com linguagem natural. Construa gráficos, tabelas e visualizações usando IA.',
    keywords: ['visualização de dados', 'IA', 'gráficos', 'análise', 'inteligência empresarial'],
  },
  'ru': {
    title: 'OpenStrand - Платформа управления знаниями на основе ИИ',
    description: 'Превратите ваши данные в инсайты с помощью естественного языка. Создавайте диаграммы, таблицы и визуализации с помощью ИИ.',
    keywords: ['визуализация данных', 'ИИ', 'диаграммы', 'аналитика', 'бизнес-аналитика'],
  },
  'fr': {
    title: 'OpenStrand - Plateforme de Gestion des Connaissances par IA',
    description: 'Transformez vos données en insights avec le langage naturel. Créez des graphiques, tableaux et visualisations avec l\'IA.',
    keywords: ['visualisation de données', 'IA', 'graphiques', 'analyse', 'intelligence d\'affaires'],
  },
};

export function isRTL(locale: Locale): boolean {
  return languageMetadata[locale].direction === 'rtl';
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return languageMetadata[locale].direction;
}

export function getLocaleCurrency(locale: Locale): string {
  return localeCurrencies[locale];
}

export function getLocaleFont(locale: Locale): string {
  return localeFonts[locale];
}
