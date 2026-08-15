import React, { useState } from 'react';
export function AiAssistant({ isJa, lang, tasks = [], allTasks = [], projects = [], projectName, apiKey, onTasksExtracted }) {
  const isJapanese = isJa === true || lang === 'ja' || lang === 'jp';
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      textVi: 'Xin chào! Tôi là Trợ lý AI. Bạn có thể hỏi về tiến độ công việc hoặc tra cứu thông tin (VD: "物件", "logo", "quy trình"...), hoặc dán nội dung/file để bóc tách task tự động.',
      textJa: 'こんにちは！AIアシスタントです。タスクの進捗や情報についてお気軽にご質問ください（例: "物件", "logo", "quy trình"...）。テキストやファイルを貼り付けてタスクを自動抽出することも可能です。',
      result: null,
      extractedTasks: null
    }
  ]);

  const normalizeStr = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();
  };

  const searchLocalTasks = (query) => {
    const rawQuery = (query || '').trim();
    if (!rawQuery) return [];
    const normQuery = normalizeStr(rawQuery);
    const keywords = normQuery.split(/\s+/).filter(w => w.length > 0);
    const poolToSearch = (allTasks && allTasks.length > 0) ? allTasks : tasks;
    return poolToSearch.filter(t => {
      const title = `${t.titleVi \vert{}\vert{} ''}${t.titleJa || ''} ${t.title \vert{}\vert{} ''}${t.name || ''}`;
      const checklists = t.checklists || t.items || [];
      const checklistsText = checklists.map(c => `${c.textVi \vert{}\vert{} ''}${c.textJa || ''} ${c.text \vert{}\vert{} ''}${c.title || ''}`).join(' ');
      const attachments = t.attachments || t.files || [];
      const attachmentsText = attachments.map(a => `${a.name || ''} ${a.filename \vert{}\vert{} ''}${a.url || ''}`).join(' ');
      const assignee = t.assignee || t.user || '';
      const status = t.status || '';
      const description = t.description || t.desc || '';
      const fullText = `${title}${description} ${checklistsText}${attachmentsText} ${assignee}${status}`;
      const normFullText = normalizeStr(fullText);
      if (normFullText.includes(normQuery)) return true;
      return keywords.length > 0 && keywords.some(kw => normFullText.includes(kw));
    });
  };

  const parseLocalTextToTasks = (text) => {
    if (!text) return [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedTasks = [];
    let currentTask = null;
    lines.forEach((line) => {
      const isBullet = /^[0-9]+\.|\*|-|•/.test(line);
      const isSubItem = /^[a-z]\.|\+|\t|\s{2,}/.test(line);
      if (isBullet || !currentTask) {
        if (currentTask) parsedTasks.push(currentTask);
        const cleanTitle = line.replace(/^[0-9]+\.|\*|-|•/, '').trim();
        currentTask = {
          titleVi: cleanTitle,
          titleJa: cleanTitle,
          status: line.toLowerCase().includes('xong') || line.toLowerCase().includes('済') ? 'Đã Xong' : 'Cần Làm',
          assignee: '',
          checklists: []
        };
      } else if (isSubItem && currentTask) {
        const cleanSub = line.replace(/^[a-z]\.|\+/, '').trim();
        currentTask.checklists.push({ title: cleanSub, completed: false });
      } else if (currentTask) {
        currentTask.checklists.push({ title: line, completed: false });
      }
    });
    if (currentTask) parsedTasks.push(currentTask);
    return parsedTasks;
  };

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
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setInputContent(prev => (prev ? `${prev}\n\n${event.target.result}` : event.target.result));
      };
      reader.readAsText(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputContent.trim() && !attachedFile) return;
    if (loading) return;
    const userText = inputContent.trim();
    const fileName = attachedFile ? attachedFile.name : '';
    const displayMsg = userText + (fileName ? ` (📎 ${isJapanese ? '添付' : 'Đính kèm'}: ${fileName})` : '');
    setChatHistory(prev => [...prev, { sender: 'user', textVi: displayMsg, textJa: displayMsg, result: null, extractedTasks: null }]);
    
    setInputContent('');
    if (attachedFile) setAttachedFile(null);
    setLoading(true);
    let apiSuccess = false;
    const isExtractionIntent = userText.toLowerCase().includes('bóc tách') || userText.toLowerCase().includes('tạo task') || userText.toLowerCase().includes('phân tích') || userText.toLowerCase().includes('抽出') || userText.toLowerCase().includes('thêm task') || userText.toLowerCase().includes('ghi chú');

    // 1. Gọi Backend API
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          language: isJapanese ? 'ja' : 'vi',
          isExtraction: isExtractionIntent,
          projectData: { projectName: projectName || 'Dự án', taskList: tasks || [] }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.reply || data.extractedTasks)) {
          setChatHistory(prev => [...prev, {
            sender: 'ai',
            textVi: data.reply || 'Đã bóc tách dữ liệu công việc thành công:',
            textJa: data.reply || 'タスクデータを正常に抽出しました:',
            extractedTasks: data.extractedTasks || null,
            result: null
          }]);
          apiSuccess = true;
        }
      }
    } catch (err) {
      console.log("Backend API offline");
    }

    // 2. Gọi Gemini API trực tiếp (Đã lọc kỹ apiKey để triệt tiêu hoàn toàn lỗi Failed to parse URL)
    if (!apiSuccess && apiKey) {
      try {
        let rawKey = apiKey;
        if (typeof rawKey === 'object' && rawKey !== null) {
          rawKey = rawKey.key || rawKey.apiKey || '';
        }
        const cleanApiKey = typeof rawKey === 'string' ? rawKey.replace(/['"`]/g, '').trim() : '';
        
        if (cleanApiKey && cleanApiKey !== '${apiKey}') {
          const fetchUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + cleanApiKey;
          const promptText = isExtractionIntent 
            ? 'Bạn là trợ lý AI chuyên bóc tách dữ liệu công việc. Hãy đọc đoạn văn bản sau và trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown ```json) theo cấu trúc chính xác:\n{"tasks":[{"titleVi":"Tên công việc tiếng Việt","titleJa":"Tên công việc tiếng Nhật","assignee":"Người thực hiện","status":"Cần Làm","checklists":[{"title":"Bước 1","completed":false}]}]}\nVăn bản đầu vào: "' + userText + '"'
            : 'Bạn là trợ lý quản lý dự án thông minh. Người dùng hỏi: "' + userText + '". Dữ liệu task hiện tại: ' + JSON.stringify(tasks) + '.';
          
          const res = await fetch(fetchUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
          });
          if (res.ok) {
            const data = await res.json();
            let replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (isExtractionIntent) {
              try {
                let cleanJson = replyText.replace(/```json/g, '').replace(/```/g, '').trim();
                const parsed = JSON.parse(cleanJson);
                const tasksArr = parsed.tasks || parsed;
                if (Array.isArray(tasksArr) && tasksArr.length > 0) {
                  setChatHistory(prev => [...prev, {
                    sender: 'ai',
                    textVi: 'Đã bóc tách thành công ' + tasksArr.length + ' công việc:',
                    textJa: tasksArr.length + ' 件のタスクを抽出しました:',
                    extractedTasks: tasksArr,
                    result: null
                  }]);
                  apiSuccess = true;
                }
              } catch (e) {}
            }
            if (!apiSuccess && replyText) {
              setChatHistory(prev => [...prev, { sender: 'ai', textVi: replyText, textJa: replyText, result: null, extractedTasks: null }]);
              apiSuccess = true;
            }
          }
        }
      } catch (err) {
        console.log("Gemini API error");
      }
    }

    // 3. Fallback Local
    if (!apiSuccess) {
      if (isExtractionIntent || userText.length > 35) {
        const localExtracted = parseLocalTextToTasks(userText);
        if (localExtracted.length > 0) {
          setChatHistory(prev => [...prev, {
            sender: 'ai',
            textVi: '(Local Mode) Đã bóc tách thành công ' + localExtracted.length + ' công việc:',
            textJa: '(ローカル) ' + localExtracted.length + ' 件のタスクを抽出しました:',
            extractedTasks: localExtracted,
            result: null
          }]);
          setLoading(false);
          return;
        }
      }
      const matchedTasks = searchLocalTasks(userText);
      if (matchedTasks.length === 0) {
        setChatHistory(prev => [...prev, {
          sender: 'ai',
          textVi: 'Không tìm thấy thông tin liên quan đến: "' + userText + '".',
          textJa: '見つかりませんでした: "' + userText + '"。',
          result: null,
          extractedTasks: null
        }]);
      } else {
        const primaryTask = matchedTasks[0];
        const matchedProj = projects.find(p => p.id === primaryTask.projectId);
        const taskProjectName = matchedProj ? (matchedProj.nameJa || matchedProj.nameVi || matchedProj.name) : (projectName || "Dự án");
        const checklists = primaryTask.checklists || primaryTask.items || [];
        const totalSteps = checklists.length;
        const completedSteps = checklists.filter(c => c.completed || c.done).length;
        const aiResult = {
          taskTitle: primaryTask.titleVi || primaryTask.title || primaryTask.name,
          projectName: taskProjectName,
          status: primaryTask.status || 'Cần Làm',
          progressText: totalSteps > 0 ? `Đã xong ${completedSteps}/${totalSteps} bước checklist` : "Chưa có checklist",
          checklists: checklists,
          attachments: primaryTask.attachments || primaryTask.files || []
        };
        setChatHistory(prev => [...prev, {
          sender: 'ai',
          textVi: `Chi tiết công việc trong dự án "${taskProjectName}":`,
          textJa: `タスク詳細:`,
          result: aiResult,
          extractedTasks: null
        }]);
      }
    }
    setLoading(false);
  };

  const handleApplyExtractedTasks = (tasksToApply) => {
    if (onTasksExtracted && typeof onTasksExtracted === 'function') {
      onTasksExtracted(tasksToApply);
    }
    setChatHistory(prev => [...prev, {
      sender: 'ai',
      textVi: `✅ Đã thêm thành công ${tasksToApply.length} công việc vào dự án!`,
      textJa: `✅ 追加しました！`,
      result: null,
      extractedTasks: null
    }]);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
          💬 {isJapanese ? 'AIアシスタント (チャット & データ抽出)' : 'Trợ Lý AI (Hỏi Đáp & Bóc Tách Dữ Liệu)'}
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
                        <div className="font-bold text-purple-900 flex justify-between items-start gap-1">
                          <span>{tIdx + 1}. {t.titleVi || t.title}</span>
                          {t.assignee && <span className="bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded text-[10px] shrink-0">👤 {t.assignee}</span>}
                        </div>
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
            <div className="bg-purple-100 text-purple-700 p-2 rounded-xl text-[11px] italic animate-pulse">🤖 AI đang xử lý...</div>
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
          placeholder="Nhập câu hỏi tiến độ hoặc dán nội dung bóc tách task..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          className="flex-1 text-xs border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 bg-white"
        />
        <button type="button" onClick={handleSendMessage} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shrink-0 disabled:opacity-50">Gửi</button>
      </div>
    </div>
  );
}
export default AiAssistant;
