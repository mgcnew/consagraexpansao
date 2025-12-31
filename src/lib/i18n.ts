import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptBR from '@/locales/pt-BR.json';
import enUS from '@/locales/en-US.json';

const resources = {
  'pt-BR': { translation: ptBR },
  'en-US': { translation: enUS },
};

// Detectar idioma salvo ou usar portugues como padrao
const savedLanguage = localStorage.getItem('language') || 'pt-BR';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'pt-BR',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export const languages = [
  { code: 'pt-BR', name: 'Portugues', flag: '🇧🇷' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
];

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
};
