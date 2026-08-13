import React, { useState } from 'react';

export function AiAssistant({ isJa, lang, tasks = [], allTasks = [], projects = [], projectName }) {
  // Tự động phát hiện tiếng Nhật nếu prop isJa=true hoặc lang='ja'
  const isJapanese = isJa === true || lang === 'ja' || lang === 'jp';

  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);

  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      textVi: 'Xin chào! Tôi là Trợ lý AI. Bạn có thể hỏi về tiến độ công việc hoặc tra cứu thông tin (VD: "物件", "logo", "quy trình"...).',
      textJa: 'こんにちは！AIアシスタントです。タスクの進捗や情報についてお気軽にご質問ください。',
      result: null
    }
  ]);

  // Hàm loại bỏ dấu Tiếng Việt & chuẩn hóa chuỗi
  const normalizeStr = (str) => {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .trim();
  };

  // Thuật toán quét và tìm kiếm task
  const searchLocalTasks = (query) => {
    const rawQuery = (query || '').trim();
    if (!rawQuery) return [];

    const normQuery = normalizeStr(rawQuery);
    const keywords = normQuery.split(/\s+/).filter(w => w.length > 0);

    const poolToSearch = (allTasks && allTasks.length > 0) ? allTasks : tasks;

    return poolToSearch.filter(t => {
      const title = `${t.titleVi || ''} ${t.titleJa || ''} ${t.title || ''} ${t.name || ''}`;
      
      const checklists = t.checklists || t.items || [];
      const checklistsText = checklists
        .map(c => `${c.textVi || ''} ${c.textJa || ''} ${c.text || ''} ${c.title || ''}`)
        .join(' ');

      const attachments = t.attachments || t.files || [];
      const attachmentsText = attachments
        .map(a => `${a.name || ''} ${a.filename || ''} ${a.url || ''}`)
        .join(' ');

      const assignee = t.assignee || t.user || '';
      const status = t.status || '';
      const description = t.description || t.desc || '';

      const fullText = `${title} ${description} ${checklistsText} ${attachmentsText} ${assignee} ${status}`;
      const normFullText = normalizeStr(fullText);

      if (normFullText.includes(normQuery)) return true;
      return keywords.length > 0 && keywords.some(kw => normFullText.includes(kw));
    });
  };

  // Format trạng thái
  const formatStatus = (statusStr) => {
    if (!statusStr) return isJapanese ? '未着手' : 'Cần Làm';
    const s = statusStr.toString().toLowerCase();
    if (s.includes('xong') || s.includes('done') || s.includes('完了')) return isJapanese ? '完了' : 'Đã Xong';
    if (s.includes('đang') || s.includes('progress') || s.includes('進行')) return isJapanese ? '進行中' : 'Đang Làm';
    return statusStr;
  };

  const handleFileUploadToAi = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
  };

  const handleSendMessage = async () => {
    if (!inputContent.trim() && !attachedFile) return;
    if (loading) return;

    const userText = inputContent.trim();
    const fileName = attachedFile ? attachedFile.name : '';
    const displayMsg = userText + (fileName ? ` (📎 ${isJapanese ? '添付' : 'Đính kèm'}: ${fileName})` : '');

    setChatHistory(prev => [...prev, { sender: 'user', textVi: displayMsg, textJa: displayMsg, result: null }]);
    
    setInputContent('');
    if (attachedFile) setAttachedFile(null);
    setLoading(true);

    // 1. Backend API Call
    let apiSuccess = false;
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          language: isJapanese ? 'ja' : 'vi',
          projectData: {
            projectName: projectName || 'Dự án',
            taskList: tasks || []
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.reply) {
          setChatHistory(prev => [...prev, {
            sender: 'ai',
            textVi: data.reply,
            textJa: data.reply,
            result: null
          }]);
          apiSuccess = true;
        }
      }
    } catch (err) {
      console.log("Local mode active");
    }

    // 2. Local Agent Search
    if (!apiSuccess) {
      const matchedTasks = searchLocalTasks(userText);

      if (matchedTasks.length === 0) {
        setChatHistory(prev => [...prev, {
          sender: 'ai',
          textVi: `Không tìm thấy công việc liên quan: "${userText}".`,
          textJa: `キーワードに一致するタスクは見つかりませんでした: "${userText}"。`,
          result: null
        }]);
      } else {
        const primaryTask = matchedTasks[0];
        
        const matchedProj = projects.find(p => p.id === primaryTask.projectId);
        const taskProjectName = matchedProj 
          ? (matchedProj.nameJa || matchedProj.nameVi || matchedProj.name) 
          : (projectName || "Oishii BBQ");

        const checklists = primaryTask.checklists || primaryTask.items || [];
        const totalSteps = checklists.length;
        const completedSteps = checklists.filter(c => c.completed || c.done).length;

        const taskTitle = isJapanese 
          ? (primaryTask.titleJa || primaryTask.titleVi || primaryTask.title || primaryTask.name)
          : (primaryTask.titleVi || primaryTask.titleJa || primaryTask.title || primaryTask.name);

        const aiResult = {
          taskTitle: taskTitle,
          projectName: taskProjectName,
          status: primaryTask.status || 'Cần Làm',
          progressText: isJapanese 
            ? (totalSteps > 0 ? `チェックリスト ${totalSteps} 件中 ${completedSteps} 件完了` : "詳細チェックリストなし")
            : (totalSteps > 0 ? `Đã xong ${completedSteps}/${totalSteps} bước checklist` : "Chưa có danh sách checklist"),
          checklists: checklists,
          attachments: primaryTask.attachments || primaryTask.files || []
        };

        setChatHistory(prev => [...prev, {
          sender: 'ai',
          textVi: `Dưới đây là thông tin chi tiết công việc trong dự án "${taskProjectName}":`,
          textJa: `プロジェクト "${taskProjectName}" 内のタスク詳細情報です:`,
          result: aiResult
        }]);
      }
    }

    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
          💬 {isJapanese ? 'AIアシスタントチャット (Local Agent)' : 'Trợ Lý AI Trò Chuyện & Hỗ Trợ (Local Agent)'}
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
              <p className="whitespace-pre-wrap">{isJapanese ? (chat.textJa || chat.textVi) : (chat.textVi || chat.textJa)}</p>

              {chat.result && (
                <div className="mt-2 pt-2 border-t border-purple-200 space-y-2 text-xs text-gray-800 bg-white/80 p-2.5 rounded-lg shadow-xs">
                  <div className="font-bold text-purple-900 text-[13px]">
                    📌 {isJapanese ? 'タスク名:' : 'Công việc:'} "{chat.result.taskTitle}"
                  </div>

                  {chat.result.projectName && (
                    <div className="text-[11px] text-gray-600">
                      📁 {isJapanese ? '所属プロジェクト:' : 'Thuộc dự án:'} <span className="font-semibold text-purple-800">{chat.result.projectName}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-500">{isJapanese ? 'ステータス:' : 'Trạng thái:'}</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      chat.result.status === 'Đã Xong' || chat.result.status === '完了' ? 'bg-green-100 text-green-700 border border-green-200' :
                      chat.result.status === 'Đang Làm' || chat.result.status === '進行中' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {formatStatus(chat.result.status)}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-500">{isJapanese ? '進捗詳細:' : 'Tiến độ chi tiết:'} </span>
                    <span className="font-medium text-gray-700">{chat.result.progressText}</span>
                    {chat.result.checklists.length > 0 && (
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 text-gray-600">
                        {chat.result.checklists.map((c, i) => (
                          <li key={i} className={c.completed || c.done ? "line-through text-gray-400" : ""}>
                            {isJapanese ? (c.textJa || c.textVi || c.text || c.title) : (c.textVi || c.textJa || c.text || c.title)} {c.completed || c.done ? "✓" : "..."}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {chat.result.attachments && chat.result.attachments.length > 0 && (
                    <div className="pt-2 border-t border-purple-100 space-y-1.5">
                      <span className="font-semibold text-gray-500 block">{isJapanese ? '添付ファイル / リンク:' : 'File / Link đính kèm:'}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {chat.result.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url || '#'}
                            target="_blank"
                            rel="noreferrer"
                            download={att.type === 'file' ? att.name : undefined}
                            className="inline-flex items-center gap-1 bg-purple-50 border border-purple-300 text-purple-700 hover:bg-purple-100 font-semibold px-2.5 py-1 rounded-md transition"
                          >
                            {att.type === 'file' ? '💾' : '🔗'} {att.name || att.filename || (isJapanese ? 'ドキュメント' : 'Tài liệu')}
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
              🤖 {isJapanese ? 'AIがタスクデータを処理中...' : 'AI đang xử lý dữ liệu dự án...'}
            </div>
          </div>
        )}
      </div>

      {attachedFile && (
        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-purple-300 text-xs">
          <span className="text-purple-700 font-semibold truncate">📎 {isJapanese ? '選択されたファイル:' : 'Đã chọn file:'} {attachedFile.name}</span>
          <button type="button" onClick={() => setAttachedFile(null)} className="text-red-500 font-bold ml-2">✕</button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <label className="cursor-pointer bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm flex items-center gap-1 shrink-0">
          📎 {isJapanese ? 'ファイル添付' : 'Gửi file'}
          <input type="file" onChange={handleFileUploadToAi} className="hidden" />
        </label>

        <input
          type="text"
          placeholder={isJapanese ? "メッセージを入力 (例: 物件, ロゴ, 手順...)" : "Nhập nội dung trao đổi (VD: logo, quy trình...)"}
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
          {isJapanese ? '送信' : 'Gửi'}
        </button>
      </div>
    </div>
  );
}

export default AiAssistant;
