import React, { useState } from 'react';

export default function AiAssistant({ onConfirmTask, isJa }) {
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      textVi: 'Xin chào Chi! Tôi là Trợ lý AI bóc tách công việc. Bạn hãy nhập yêu cầu hoặc dán link tài liệu, tôi sẽ phân tích và tạo task tự động cho bạn nhé!',
      textJa: 'こんにちは！AIタスクアシスタントです。要件やリンクを入力していただければ、自動でタスクを作成します！'
    }
  ]);

  const handleFileUploadToAi = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
  };

  const handleSendMessage = (e) => {
    if (e) e.preventDefault();
    if (!inputContent.trim() && !attachedFile) return;
    
    const userText = inputContent.trim();
    const fileName = attachedFile ? attachedFile.name : '';
    const displayMsg = userText + (fileName ? ` (📎 Đính kèm: ${fileName})` : '');
    
    setChatHistory(prev => [...prev, { sender: 'user', textVi: displayMsg, textJa: displayMsg }]);
    setInputContent('');
    setLoading(true);

    // Xử lý giả lập AI hoàn toàn nội bộ, không gọi API ngoài tránh lỗi mạng
    setTimeout(() => {
      let previewTask = {};
      let aiMsgVi = '';
      let aiMsgJa = '';

      const lowerText = userText.toLowerCase();
      const isLink = lowerText.startsWith('http://') || lowerText.startsWith('https://') || lowerText.includes('docs.google.com') || lowerText.includes('sheet');

      if (attachedFile || isLink) {
        const sourceName = attachedFile ? attachedFile.name : userText;
        aiMsgVi = `🤖 Đã phân tích thành công nội dung từ (**${sourceName}**). Dưới đây là các hạng mục task được bóc tách tự động:`;
        aiMsgJa = `🤖 リンクまたはファイル (**${sourceName}**) の内容を読み込み、タスクに分解しました。`;
        
        previewTask = {
          titleVi: isLink ? `Xử lý từ link: ${userText.slice(0, 30)}...` : `Triển khai từ file: ${sourceName}`,
          titleJa: 'リンク・資料に基づくプロジェクト展開',
          priority: 'HIGH',
          assignee: 'Chi',
          dueDate: '',
          checklists: [
            { textVi: 'Kiểm tra và đồng bộ dữ liệu', textJa: 'データの確認と同期' },
            { textVi: 'Lập kế hoạch phân bổ chi tiết', textJa: '詳細な割り当て計画' },
            { textVi: 'Thực thi và báo cáo tiến độ', textJa: '実行と進捗報告' }
          ]
        };
        if (attachedFile) setAttachedFile(null);
      } else {
        aiMsgVi = `💡 Dựa trên yêu cầu ("${userText}"), tôi đã bóc tách thành công task công việc. Bạn hãy bấm xác nhận để đưa vào bảng!`;
        aiMsgJa = `💡 要件「${userText}」に基づき、タスクを分解しました。確認して作成してください。`;

        previewTask = {
          titleVi: userText.length > 40 ? userText.slice(0, 40) + '...' : userText,
          titleJa: userText.length > 40 ? userText.slice(0, 40) + '...' : userText,
          priority: userText.toLowerCase().includes('gấp') ? 'HIGH' : 'MEDIUM',
          assignee: 'Chi',
          dueDate: '',
          checklists: [
            { textVi: `Thực hiện: ${userText}`, textJa: `実行項目: ${userText}` },
            { textVi: 'Kiểm tra chất lượng & Báo cáo', textJa: '品質チェック・報告' }
          ]
        };
      }

      setChatHistory(prev => [
        ...prev,
        { 
          sender: 'ai', 
          textVi: aiMsgVi, 
          textJa: aiMsgJa, 
          previewTask: previewTask 
        }
      ]);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
          🤖 {isJa ? 'AIタスク自動分解アシスタント' : 'Trợ Lý AI Bóc Tách Công Việc'}
        </h3>
        <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">Active Mode</span>
      </div>

      <div className="bg-white/90 rounded-lg p-3 max-h-60 overflow-y-auto space-y-3 border border-purple-100 text-xs">
        {chatHistory.map((chat, idx) => (
          <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-2.5 rounded-xl leading-relaxed ${
              chat.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none shadow-sm' 
                : 'bg-purple-100/90 text-purple-900 rounded-bl-none border border-purple-200'
            }`}>
              <p>{isJa ? (chat.textJa || chat.textVi) : (chat.textVi || chat.textJa)}</p>
            </div>

            {chat.previewTask && (
              <div className="mt-2 bg-white border-2 border-purple-300 rounded-xl p-3 shadow-md w-full max-w-md space-y-2">
                <p className="text-[11px] font-bold text-purple-800 uppercase">🔍 Bản xem trước task:</p>
                <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 space-y-1 text-xs">
                  <p><strong>Tên Task:</strong> {chat.previewTask.titleVi}</p>
                  <p><strong>Phụ trách:</strong> {chat.previewTask.assignee}</p>
                  <p><strong>Ưu tiên:</strong> {chat.previewTask.priority}</p>
                  <div>
                    <p className="font-semibold text-gray-600 mt-1">Checklist mục con:</p>
                    <ul className="list-disc pl-4 text-gray-600 text-[11px]">
                      {chat.previewTask.checklists.map((c, i) => (
                        <li key={i}>{c.textVi}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setChatHistory(prev => prev.map((item, i) => i === idx ? { ...item, previewTask: null, textVi: item.textVi + ' (Đã hủy)' } : item));
                    }}
                    className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg font-bold"
                  >
                    ❌ Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onConfirmTask(chat.previewTask);
                      setChatHistory(prev => prev.map((item, i) => i === idx ? { ...item, previewTask: null, textVi: item.textVi + ' ✅ (Đã đưa vào Kanban!)' } : item));
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-1.5 rounded-lg font-bold shadow-sm"
                  >
                    ✅ Xác Nhận Tạo Task
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-purple-100 text-purple-700 p-2 rounded-xl text-[11px] italic animate-pulse">
              🤖 AI đang phân tích yêu cầu...
            </div>
          </div>
        )}
      </div>

      {attachedFile && (
        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-purple-300 text-xs">
          <span className="text-purple-700 font-semibold truncate">📎 File: {attachedFile.name}</span>
          <button type="button" onClick={() => setAttachedFile(null)} className="text-red-500 font-bold">✕</button>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
        <label className="cursor-pointer bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm flex items-center gap-1 shrink-0">
          📎 Đính kèm
          <input type="file" onChange={handleFileUploadToAi} className="hidden" />
        </label>
        
        <input
          type="text"
          placeholder="Nhập yêu cầu hoặc dán link Google Sheets để AI bóc tách..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          className="flex-1 text-xs border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 bg-white"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shrink-0"
        >
          Gửi cho Bot
        </button>
      </form>
    </div>
  );
}
