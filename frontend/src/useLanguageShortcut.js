import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useLanguageShortcut() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && (event.key === 'l' || event.key === 'L')) {
        event.preventDefault();
        const currentLang = i18n.language || 'vi';
        const nextLang = currentLang.startsWith('vi') ? 'ja' : 'vi';
        i18n.changeLanguage(nextLang);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [i18n]);
}
