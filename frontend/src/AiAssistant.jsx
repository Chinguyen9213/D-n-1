import React, { useState } from 'react';

export function AiAssistant({ isJa, lang, tasks = [], allTasks = [], projects = [], projectName, onTasksExtracted }) {
  const isJapanese = isJa === true || lang === 'ja' || lang === 'jp';
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      textVi: 'Xin chào! Hãy nhập yêu cầu công việc, tôi sẽ lập tức bóc tách thành các bước chi tiết cho bạn.',
      textJa: 'こんにちは！作業内容を入力してください。AIがタスクをステップに分解します。',
      result: null,
      extractedTasks: null
    }
  ]);

  const parseSmartTaskBreakdown = (text) => {
    if (!text) return [];
    const lower = text.toLowerCase();

    if (lower.includes('mat bang') || lower.includes('tim mat bang') || lower.includes('xem mat bang') || lower.includes('chi di xem')) {
      return [
        {
          titleVi: 'Khảo sát và tìm kiếm các địa điểm mặt bằng tiềm năng',
          titleJa: '候補地の調査と選定',
          status: 'Cần Làm',
          assignee: '',
          checklists: [
            { title: 'Lọc danh sách các khu vực phù hợp với ngân sách', completed: false },
            { title: 'Liên hệ môi giới hoặc chủ nhà để lấy thông tin sơ bộ', completed: false },
            { title: 'Lên lịch hẹn đi xem trực tiếp', completed: false }
          ]
        },
        {
          titleVi: 'Đi thực tế xem mặt bằng và đánh giá hiện trạng',
          titleJa: '現地視察と現状評価',
          status: 'Cần Làm',
          assignee: '',
          checklists: [
            { title: 'Kiểm tra diện tích, hướng và kết cấu mặt bằng', completed: false },
            { title: 'Đánh giá giao thông, chỗ để xe và lưu lượng người', completed: false },
            { title: 'Chụp hình/quay phim hiện trạng để báo cáo', completed: false }
          ]
        },
        {
          titleVi: 'Đàm phán giá thuê và các điều kiện hợp đồng',
          titleJa: '賃料交渉と契約条件の確認',
          status: 'Cần Làm',
          assignee: '',
          checklists: [
            { title: 'So sánh giá với các khu vực xung quanh', completed: false },
            { title: 'Thương lượng thời gian miễn phí tiền thuê (nếu có)', completed: false },
            { title: 'Kiểm tra điều kiện pháp lý của mặt bằng', completed: false }
          ]
        },
        {
          titleVi: 'Báo cáo kết quả và trình phương án lên cấp trên',
          titleJa: '結果報告と承認申請',
          status: 'Cần Làm',
          assignee: '',
          checklists: [
            { title: 'Tổng hợp ưu/nhược điểm của các mặt bằng đã xem', completed: false },
            { title: 'Gửi đề xuất phương án tối ưu nhất cho quản lý/sếp', completed: false }
          ]
        }
      ];
    }

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length > 1) {
      return lines.map(line => ({
        titleVi: line.replace(/^[0-9]+[\.\)]|\*|-|•/, '').trim(),
        titleJa: line.replace(/^[0-9]+[\.\)]|\*|-|•/, '').trim(),
        status: 'Cần Làm',
        assignee: '',
        checklists: []
      }));
    }

    return [
      {
        titleVi: text,
        titleJa: text,
        status: 'Cần Làm',
        assignee: '',
        checklists: [
          { title: 'Lên kế hoạch chi tiết triển khai', completed: false },
          { title: 'Chuẩn bị tài liệu và công cụ cần thiết', completed: false },
          { title: 'Thực hiện và báo cáo tiến độ lên nhóm', completed: false },
          { title: 'Nghiệm thu và hoàn tất công việc', completed: false }
        ]
      }
    ];
  };

  const handleFileUploadToAi = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputContent(prev => (prev ? `${prev}\n\n${event.target.result}` : event.target.result));
      };
      reader.readAsText(file);
    }
  };

  const handleSendMessage = () => {
    if (!inputContent.trim() && !attachedFile) return;
    if (loading) return;
    const userText = inputContent.trim();
    const fileName = attachedFile ? attachedFile.name : '';
    const displayMsg = userText + (fileName ? ` (📎 Đính kèm: ${fileName})` : '');
    
    setChatHistory(prev => [...prev, { sender: 'user', textVi: displayMsg, textJa: displayMsg, result: null, extractedTasks: null }]);
    setInputContent('');
    if (attachedFile) setAttachedFile(null);
    setLoading(true);

    setTimeout(() => {
      const extracted = parseSmartTaskBreakdown(userText);
      setChatHistory(prev => [...prev, {
        sender: 'ai',
        textVi: `Đã bóc tách thành công yêu cầu thành ${extracted.length} công việc chi tiết:`,
        textJa: `要件を ${extracted.length} 件のタスクに分解しました:`,
        extractedTasks: extracted,
        result: null
      }]);
      setLoading(false);
    }, 200);
  };

  const handleApplyExtractedTasks = (tasksToApply) => {
    if (onTasksExtracted && typeof onTasksExtracted === 'function') {
      onTasksExtracted(tasksToApply);
    }
    setChatHistory(prev => [...prev, {
      sender: 'ai',
      textVi: `✅ Đã thêm thành công ${tasksToApply.length} công việc vào dự án!`,
      textJa: `✅ プロジェクトに追加しました！`,
      result: null,
      extractedTasks: null
    }]);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
          🤖 Trợ lý AI Bóc tách Công việc
        </h3>
        <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">Active</span>
      </div>
      <div className="bg-white/90 rounded-lg p-3 max-h-60 overflow-y-auto space-y-3 border border-purple-100 text-xs">
        {chatHistory.map((chat, idx) => (
          <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-2.5 rounded-xl leading-relaxed ${chat.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none shadow-sm' : 'bg-purple-100/90 text-purple-900 rounded-bl-none border border-purple-200 space-y-2'}`}>
              <p className="whitespace-pre-wrap">{isJapanese ? (chat.textJa || chat.textVi) : (chat.textVi || chat.textJa)}</p>
              {chat.extractedTasks && chat.extractedTasks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-200 space-y-2 bg-white/95 p-2.5 rounded-lg shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-900 text-[12px]">📋 Danh sách task bóc tách ({chat.extractedTasks.length}):</span>
                    <button type="button" onClick={() => handleApplyExtractedTasks(chat.extractedTasks)} className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs transition">➕ Thêm vào dự án</button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {chat.extractedTasks.map((t, tIdx) => (
                      <div key={tIdx} className="bg-purple-50 p-2 rounded border border-purple-100 text-[11px] space-y-1">
                        <div className="font-bold text-purple-900">
                          {tIdx + 1}. {t.titleVi}
                        </div>
                        {t.checklists && t.checklists.length > 0 && (
                          <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                            {t.checklists.map((c, cIdx) => (
                              <li key={cIdx}>{c.title}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-purple-100 text-purple-700 p-2 rounded-xl text-[11px] italic animate-pulse">🤖 Đang bóc tách thông tin công việc...</div>
          </div>
        )}
      </div>
      {attachedFile && (
        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-purple-300 text-xs">
          <span className="text-purple-700 font-semibold truncate">📎 Đã chọn file: {attachedFile.name}</span>
          <button type="button" onClick={() => setAttachedFile(null)} className="text-red-500 font-bold ml-2">✕</button>
        </div>
      )}
      <div className="flex gap-2 items-center">
        <label className="cursor-pointer bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm flex items-center gap-1 shrink-0">
          📎 Gửi file
          <input type="file" onChange={handleFileUploadToAi} className="hidden" />
        </label>
        <input
          type="text"
          placeholder="Nhập yêu cầu (VD: đi tìm mặt bằng...)"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          className="flex-1 text-xs border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 bg-white"
        />
        <button type="button" onClick={handleSendMessage} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shrink-0 disabled:opacity-50">Gửi cho Bot</button>
      </div>
    </div>
  );
}

export default AiAssistant;
