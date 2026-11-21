import { FastifyRequest } from 'fastify';
import { id, Dictionary } from './locales/id';
import { en } from './locales/en';

export const enumSupportedLanguage = ['id', 'en'] as const;
export type SupportedLanguage = typeof enumSupportedLanguage[number];

export const dictionaries: Record<SupportedLanguage, Dictionary> = {
  id,
  en,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'id';

/**
 * Extracts and normalizes the target language from a FastifyRequest.
 * Checks:
 * 1. ?lang= query param
 * 2. language, x-lang, x-language headers
 * 3. accept-language header
 */
export function getLanguageFromRequest(request: FastifyRequest): SupportedLanguage {
  // 1. Check query parameter
  const queryLang = (request.query as any)?.lang;
  if (typeof queryLang === 'string' && queryLang.trim()) {
    const norm = normalizeLangCode(queryLang);
    if (norm) return norm;
  }

  const headers = request.headers;

  // 2. Check explicit custom headers (language, x-lang, x-language)
  const customHeader = headers['language'] || headers['x-lang'] || headers['x-language'];
  if (typeof customHeader === 'string' && customHeader.trim()) {
    const norm = normalizeLangCode(customHeader);
    if (norm) return norm;
  }

  // 3. Check standard Accept-Language header
  const acceptLang = headers['accept-language'];
  if (typeof acceptLang === 'string' && acceptLang.trim()) {
    // accept-language can be "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
    const languages = acceptLang.split(',').map(s => s.split(';')[0].trim());
    for (const langStr of languages) {
      const norm = normalizeLangCode(langStr);
      if (norm) return norm;
    }
  }

  return DEFAULT_LANGUAGE;
}

function normalizeLangCode(raw: string): SupportedLanguage | null {
  const clean = raw.trim().toLowerCase();
  if (clean.startsWith('en')) return 'en';
  if (clean.startsWith('id') || clean.startsWith('in')) return 'id';
  return null;
}

/**
 * Gets the entire dictionary for a given language.
 */
export function getDictionary(lang: SupportedLanguage = DEFAULT_LANGUAGE): Dictionary {
  return dictionaries[lang] || dictionaries[DEFAULT_LANGUAGE];
}

/**
 * Translates raw Supabase error messages into localized user-friendly text.
 */
export function translateSupabaseError(
  rawMessage?: string,
  lang: SupportedLanguage = DEFAULT_LANGUAGE
): string | undefined {
  if (!rawMessage) return undefined;
  const dict = getDictionary(lang);
  const mapped = dict.supabaseErrors?.[rawMessage as keyof typeof dict.supabaseErrors];
  return mapped || rawMessage;
}

/**
 * Translation helper function `t`.
 * Usage: t('auth.login_failed', { message: 'Invalid token' }, 'en')
 */
export function t(
  key: string,
  params?: Record<string, any>,
  lang: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  const dict = getDictionary(lang);
  const keys = key.split('.');
  
  let current: any = dict;
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current !== 'string') {
    // Fallback to ID dictionary if not found in target lang
    if (lang !== DEFAULT_LANGUAGE) {
      return t(key, params, DEFAULT_LANGUAGE);
    }
    return key;
  }

  let result = current;
  if (params) {
    Object.entries(params).forEach(([pKey, pVal]) => {
      result = result.replace(new RegExp(`\\{${pKey}\\}`, 'g'), String(pVal ?? ''));
    });
  }

  return result;
}
