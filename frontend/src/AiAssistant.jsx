import React, { useState } from 'react';

export function AiAssistant({ isJa, tasks, projectName }) {
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      textVi: 'Xin chào! Tôi là Trợ lý AI. Bạn có thể hỏi về tiến độ công việc hoặc tra cứu thông tin trong dự án (VD: "logo", "quy trình", "SOP"...).',
      textJa: 'こんにちは！AIアシスタントです。タスクの進捗や情報についてお気軽にご質問ください。',
      result: null
    }
  ]);

  const handleFileUploadToAi = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
  };

  // Hàm quét cục bộ nâng cấp (Quét Task + Checklist + Attachments)
  const searchLocalTasks = (query) => {
    const currentTasks = tasks || [];
    const keywords = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);

    return currentTasks.filter(t => {
      const titleVi = (t.titleVi || t.title || '').toLowerCase();
      const titleJa = (t.titleJa || '').toLowerCase();
      const assignee = (t.assignee || '').toLowerCase();

      // Gom toàn bộ checklist text
      const checklistsText = (t.checklists || [])
        .map(c => `${c.textVi || ''} ${c.textJa || ''} ${c.text || ''}`)
        .join(' ')
        .toLowerCase();

      // Gom toàn bộ attachment names
      const attachmentsText = (t.attachments || [])
        .map(a => a.name || '')
        .join(' ')
        .toLowerCase();

      const fullTaskText = `${titleVi} ${titleJa} ${assignee} ${checklistsText} ${attachmentsText}`;

      // Kiểm tra xem có từ khóa nào xuất hiện trong toàn bộ dữ liệu task hay không
      return keywords.some(kw => fullTaskText.includes(kw));
    });
  };

  const handleSendMessage = async () => {
    if (!inputContent.trim() && !attachedFile) return;
    if (loading) return;

    const userText = inputContent.trim();
    const fileName = attachedFile ? attachedFile.name : '';
    const displayMsg = userText + (fileName ? ` (📎 Đính kèm: ${fileName})` : '');

    setChatHistory(prev => [...prev, { sender: 'user', textVi: displayMsg, textJa: displayMsg, result: null }]);
    
    setInputContent('');
    if (attachedFile) setAttachedFile(null);
    setLoading(true);

    try {
      // 1. Thử gửi yêu cầu tới Backend Gemini API
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          projectData: {
            projectName: projectName || 'Oishii BBQ',
            taskList: tasks || []
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          setChatHistory(prev => [...prev, {
            sender: 'ai',
            textVi: data.reply,
            textJa: data.reply,
            result: null
          }]);
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Chưa nối backend API hoặc lỗi kết nối, chuyển sang Local Search Agent:", err);
    }

    // 2. Nếu Backend chưa chạy hoặc lỗi API -> Sử dụng Local Search Agent thông minh
    const matchedTasks = searchLocalTasks(userText);

    if (matchedTasks.length === 0) {
      setChatHistory(prev => [...prev, {
        sender: 'ai',
        textVi: `Không tìm thấy công việc, checklist hay tài liệu nào khớp với từ khóa: "${userText}".`,
        textJa: `キーワードに一致する情報が見つかりませんでした: "${userText}"。`,
        result: null
      }]);
    } else {
      // Hiển thị task phù hợp nhất
      const matchedTask = matchedTasks[0];
      const checklists = matchedTask.checklists || [];
      const totalSteps = checklists.length;
      const completedSteps = checklists.filter(c => c.completed).length;

      const aiResult = {
        taskTitle: matchedTask.titleVi || matchedTask.titleJa || matchedTask.title,
        status: matchedTask.status || 'Cần Làm',
        progressText: totalSteps > 0 ? `Đã xong ${completedSteps}/${totalSteps} bước checklist` : "Chưa có checklist chi tiết",
        checklists: checklists,
        attachments: matchedTask.attachments || []
      };

      setChatHistory(prev => [...prev, {
        sender: 'ai',
        textVi: `Tìm thấy ${matchedTasks.length} kết quả phù hợp với từ khóa "${userText}" trong dự án "${projectName || "Oishii BBQ"}":`,
        textJa: `プロジェクト "${projectName || "Oishii BBQ"}" で "${userText}" に liên quan する結果が見つかりました:`,
        result: aiResult
      }]);
    }

    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
          💬 {isJa ? 'AIアシスタントチャット (Gemini & Local Agent)' : 'Trợ Lý AI Trò Chuyện & Hỗ Trợ (Gemini & Local Agent)'}
        </h3>
        <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">Active</span>
      </div>

      <div className="bg-white/90 rounded-lg p-3 max-h-60 overflow-y-auto space-y-3 border border-purple-100 text-xs">
        {chatHistory.map((chat, idx) => (
          <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-2.5 rounded-xl leading-relaxed ${
              chat.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none shadow-sm' 
                : 'bg-purple-100/90 text-purple-900 rounded-bl-none border border-purple-200 space-y-2'
            }`}>
              <p className="whitespace-pre-wrap">{isJa ? (chat.textJa || chat.textVi) : (chat.textVi || chat.textJa)}</p>

              {chat.result && (
                <div className="mt-2 pt-2 border-t border-purple-200 space-y-2 text-xs text-gray-800 bg-white/60 p-2 rounded-lg">
                  <div className="font-bold text-purple-900 text-[13px]">📌 Công việc: "{chat.result.taskTitle}"</div>

                  <div>
                    <span className="font-semibold text-gray-500">Trạng thái: </span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      chat.result.status === 'Đã Xong' ? 'bg-green-100 text-green-700' :
                      chat.result.status === 'Đang Làm' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {chat.result.status}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-500">Tiến độ chi tiết: </span>
                    <span className="font-medium text-gray-700">{chat.result.progressText}</span>
                    {chat.result.checklists.length > 0 && (
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-gray-600">
                        {chat.result.checklists.map((c, i) => (
                          <li key={i} className={c.completed ? "line-through text-gray-400" : ""}>
                            {c.textVi || c.textJa || c.text} {c.completed ? "✓" : "..."}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {chat.result.attachments && chat.result.attachments.length > 0 && (
                    <div className="pt-2 border-t border-purple-100 space-y-1.5">
                      <span className="font-semibold text-gray-500 block">File / Tài liệu đính kèm:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {chat.result.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            download={att.type === 'file' ? att.name : undefined}
                            className="inline-flex items-center gap-1 bg-purple-50 border border-purple-300 text-purple-700 hover:bg-purple-100 font-semibold px-2.5 py-1 rounded-md shadow-xs transition"
                          >
                            {att.type === 'file' ? '💾' : '🔗'} {att.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-purple-100 text-purple-700 p-2 rounded-xl text-[11px] italic animate-pulse">
              🤖 AI đang xử lý dữ liệu dự án...
            </div>
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
          placeholder="Nhập nội dung trao đổi (VD: logo, quy trình...)"
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          className="flex-1 text-xs border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 bg-white"
        />

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shrink-0 disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

export default AiAssistant;
