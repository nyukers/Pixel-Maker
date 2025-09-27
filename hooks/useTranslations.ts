import { useLanguage } from '../context/LanguageContext';
import en from '../locales/en';
import uk from '../locales/uk';

const translations = { en, uk };

export const useTranslations = () => {
  const { language } = useLanguage();
  return translations[language];
};