/**
 * Voice i18n Integration
 * 
 * Auto-switches voice language based on UI locale.
 * Provides manual override in settings.
 * 
 * Locale → Voice Language Mapping:
 * - en (English) → en
 * - es (Spanish) → es
 * - fr (French) → fr
 * - de (German) → de
 * - etc.
 * 
 * @since 1.6.0
 */

export interface VoiceI18nConfig {
  locale: string;
  voiceLanguage?: string; // Manual override
  autoSwitch: boolean;
}

/**
 * Map Next.js locale to BCP-47 voice language code
 */
export const LOCALE_TO_VOICE_LANG: Record<string, string> = {
  en: 'en',
  'en-US': 'en',
  'en-GB': 'en',
  es: 'es',
  'es-ES': 'es',
  'es-MX': 'es',
  fr: 'fr',
  'fr-FR': 'fr',
  'fr-CA': 'fr',
  de: 'de',
  'de-DE': 'de',
  it: 'it',
  'it-IT': 'it',
  pt: 'pt',
  'pt-BR': 'pt',
  'pt-PT': 'pt',
  zh: 'zh',
  'zh-CN': 'zh',
  'zh-TW': 'zh',
  ja: 'ja',
  'ja-JP': 'ja',
  ko: 'ko',
  'ko-KR': 'ko',
  ar: 'ar',
  'ar-SA': 'ar',
  hi: 'hi',
  'hi-IN': 'hi',
  ru: 'ru',
  'ru-RU': 'ru',
  nl: 'nl',
  'nl-NL': 'nl',
  pl: 'pl',
  'pl-PL': 'pl',
  tr: 'tr',
  'tr-TR': 'tr',
  vi: 'vi',
  'vi-VN': 'vi',
  th: 'th',
  'th-TH': 'th',
  sw: 'sw',
  'sw-KE': 'sw',
};

/**
 * Get voice language for current locale
 */
export function getVoiceLanguageForLocale(
  locale: string,
  manualOverride?: string,
  autoSwitch = true
): string {
  // Manual override takes precedence
  if (manualOverride) {
    return manualOverride;
  }

  // If auto-switch disabled, default to English
  if (!autoSwitch) {
    return 'en';
  }

  // Map locale to voice language
  const voiceLang = LOCALE_TO_VOICE_LANG[locale] || LOCALE_TO_VOICE_LANG[locale.split('-')[0]] || 'en';
  
  return voiceLang;
}

/**
 * Get optimal TTS voice for locale/language
 * Some providers have locale-specific voices
 */
export function getOptimalVoiceForLanguage(language: string, provider: string): string {
  // OpenAI TTS (English-only voices, but work with multiple input languages)
  if (provider === 'OPENAI_TTS') {
    const voiceMap: Record<string, string> = {
      en: 'alloy',      // Neutral English
      es: 'nova',       // Works well for Spanish
      fr: 'shimmer',    // Works well for French
      de: 'onyx',       // Works well for German
      it: 'fable',      // Works well for Italian
      pt: 'echo',       // Works well for Portuguese
    };
    return voiceMap[language] || 'alloy';
  }

  // ElevenLabs (has locale-specific voices)
  if (provider === 'ELEVENLABS') {
    // Return default, user can customize
    return 'pNInz6obpgDQGcFmaJgB'; // Adam (multilingual)
  }

  return 'alloy'; // Fallback
}

/**
 * Sync voice settings with locale change
 */
export async function syncVoiceWithLocale(
  newLocale: string,
  currentSettings: any
): Promise<void> {
  const autoSwitch = localStorage.getItem('voiceAutoSwitchLocale') !== 'false';
  
  if (!autoSwitch) return;

  const newVoiceLanguage = getVoiceLanguageForLocale(newLocale);

  // Only update if different
  if (currentSettings.ttsLanguage === newVoiceLanguage) return;

  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/voice/settings`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ttsLanguage: newVoiceLanguage,
        sttLanguage: newVoiceLanguage,
        // Also update voice to optimal for new language
        ttsVoice: getOptimalVoiceForLanguage(newVoiceLanguage, currentSettings.ttsProvider),
      }),
    });

    console.log(`Voice language synced to locale: ${newLocale} → ${newVoiceLanguage}`);
  } catch (error) {
    console.error('Failed to sync voice with locale:', error);
  }
}

/**
 * React hook for voice i18n
 */
export function useVoiceI18n(locale: string) {
  const autoSwitch = typeof window !== 'undefined' 
    ? localStorage.getItem('voiceAutoSwitchLocale') !== 'false'
    : true;

  const voiceLanguage = getVoiceLanguageForLocale(locale, undefined, autoSwitch);

  const toggleAutoSwitch = () => {
    const newValue = !autoSwitch;
    localStorage.setItem('voiceAutoSwitchLocale', String(newValue));
    window.location.reload(); // Reload to apply
  };

  return {
    voiceLanguage,
    autoSwitch,
    toggleAutoSwitch,
  };
}

