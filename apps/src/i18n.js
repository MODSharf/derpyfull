import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import your translation files
import translationAR from './locales/ar/translation.json';
import translationEN from './locales/en/translation.json';

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      ar: {
        translation: translationAR
      },
      en: {
        translation: translationEN
      }
    },
    lng: "ar", // default language
    fallbackLng: "en", // fallback language if translation is not found

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
