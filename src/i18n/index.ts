import en from './locales/en.json'
import ar from './locales/ar.json'

export type Language = 'en' | 'ar'

export const languages = {
  en: 'English',
  ar: 'العربية'
}

export const translations = {
  en,
  ar
}

export const defaultLanguage: Language = 'ar' // Default to Arabic as requested

export type TranslationKey = keyof typeof en

// Helper function to get nested translation
export function getNestedTranslation(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path
}

// Helper function to get translation with fallback
export function getTranslation(language: Language, key: string): string {
  const translation = getNestedTranslation(translations[language], key)
  
  // Fallback to English if translation not found
  if (!translation && language !== 'en') {
    return getNestedTranslation(translations.en, key) || key
  }
  
  return translation || key
}

export function isRTL(language: Language): boolean {
  return language === 'ar'
}