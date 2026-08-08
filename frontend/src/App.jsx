import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageShortcut } from './useLanguageShortcut';

function MainContent() {
  const { t, i18n } = useTranslation();
  useLanguageShortcut();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('vi') ? 'ja' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
        <span style={{ fontSize: '13px', color: '#666', background: '#eef', padding: '4px 8px', borderRadius: '4px' }}>
          💡 <b>Mẹo:</b> {t('shortcut_hint')}
        </span>
        <button onClick={toggleLanguage} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>
          🌐 {i18n.language.startsWith('vi') ? '🇻🇳 Tiếng Việt' : '🇯🇵 日本語'}
        </button>
      </div>

      <main style={{ marginTop: '20px' }}>
        <h1>{t('report_title')}</h1>
        <p><b>{t('status_label')}</b> <span style={{ color: 'green' }}>{t('status_done')}</span></p>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div>Đang tải ngôn ngữ...</div>}>
      <MainContent />
    </Suspense>
  );
}
