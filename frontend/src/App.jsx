import React, { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageShortcut } from './useLanguageShortcut';

// Nhập lại tất cả các trang / component cũ của dự án
// (Điều chỉnh lại đường dẫn import bên dưới nếu cấu trúc thư mục của bạn khác một chút)
import ReportPage from './components/ReportPage'; 

function MainContent() {
  const { t, i18n } = useTranslation();
  
  // Kích hoạt phím tắt Alt + L
  useLanguageShortcut();

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi';
    const nextLang = currentLang.startsWith('vi') ? 'ja' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div>
      {/* Thanh công cụ nhỏ góc trên hỗ trợ đổi ngôn ngữ */}
      <div style={{
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        backgroundColor: '#f8f9fa',
        borderBottom: '1px solid #e9ecef',
        fontSize: '13px'
      }}>
        <span style={{ color: '#495057' }}>
          💡 <b>Mẹo:</b> {t('shortcut_hint')}
        </span>
        <button 
          onClick={toggleLanguage}
          style={{
            padding: '4px 12px',
            cursor: 'pointer',
            borderRadius: '4px',
            border: '1px solid #ced4da',
            backgroundColor: '#ffffff',
            fontWeight: '500'
          }}
        >
          🌐 {i18n.language && i18n.language.startsWith('vi') ? '🇻🇳 Tiếng Việt' : '🇯🇵 日本語'}
        </button>
      </div>

      {/* Hiển thị lại toàn bộ giao diện báo cáo ban đầu của bạn */}
      <ReportPage />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Đang tải ngôn ngữ...</div>}>
      <MainContent />
    </Suspense>
  );
}
