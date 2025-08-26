import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, defaultLanguage, getTranslation, isRTL } from '../i18n'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

interface I18nProviderProps {
  children: ReactNode
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage first
    const savedLanguage = localStorage.getItem('flyterm-language') as Language
    return savedLanguage || defaultLanguage
  })

  const t = (key: string): string => {
    return getTranslation(language, key)
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('flyterm-language', lang)
  }

  // Set document direction based on language
  useEffect(() => {
    document.documentElement.setAttribute('dir', isRTL(language) ? 'rtl' : 'ltr')
    document.documentElement.setAttribute('lang', language)
  }, [language])

  const value: I18nContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
    isRTL: isRTL(language)
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Hook for easier translation access
export const useTranslation = () => {
  const { t } = useI18n()
  return { t }
}