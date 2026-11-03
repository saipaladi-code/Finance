import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import teTranslations from './locales/te.json';

const savedLanguage = localStorage.getItem('smart_finance_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      te: { translation: teTranslations },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('smart_finance_lang', lng);
  document.documentElement.lang = lng;
});

export default i18n;

