import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import pt from '../locales/pt.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';
import es from '../locales/es.json';
import tr from '../locales/tr.json';
import ja from '../locales/ja.json';
import vi from '../locales/vi.json';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    pt: { translation: pt },
    de: { translation: de },
    fr: { translation: fr },
    es: { translation: es },
    tr: { translation: tr },
    ja: { translation: ja },
    vi: { translation: vi },
  },
  lng: Localization.getLocales()[0]?.languageCode ?? 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
