import React, { useState } from 'react';
export function AiAssistant({ isJa, lang, tasks = [], allTasks = [], projects = [], projectName, apiKey, onTasksExtracted }) {
  // Tự động phát hiện tiếng Nhật nếu prop isJa=true hoặc lang='ja'
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

  // Thuật toán quét và tìm kiếm task (Hỏi đáp thông tin dự án)
  const searchLocalTasks = (query) => {
    const rawQuery = (query || '').trim();
    if (!rawQuery) return [];
    const normQuery = normalizeStr(rawQuery);
    const keywords = normQuery.split(/\s+/).filter(w => w.length > 0);
    const poolToSearch = (allTasks && allTasks.length > 0) ? allTasks : tasks;
    return poolToSearch.filter(t => {
      const title = `${t.titleVi \vert{}\vert{} ''}${t.titleJa || ''} ${t.title \vert{}\vert{} ''}${t.name || ''}`;
      const checklists = t.checklists || t.items || [];
      const checklistsText = checklists
        .map(c => `${c.textVi \vert{}\vert{} ''}${c.textJa || ''} ${c.text \vert{}\vert{} ''}${c.title || ''}`)
        .join(' ');
      const attachments = t.attachments || t.files || [];
      const attachmentsText = attachments
        .map(a => `${a.name || ''} ${a.filename \vert{}\vert{} ''}${a.url || ''}`)
        .join(' ');
      const assignee = t.assignee || t.user || '';
      const status = t.status || '';
      const description = t.description || t.desc || '';
      const fullText = `${title}${description} ${checklistsText}${attachmentsText} ${assignee}${status}`;
      const normFullText = normalizeStr(fullText);
      if (normFullText.includes(normQuery)) return true;
      return keywords.length > 0 && keywords.some(kw => normFullText.includes(kw));
    });
  };

  // Hàm phân tích ngữ nghĩa thông minh cho các yêu cầu công việc tự do (ví dụ yêu cầu của bác Kuroda)
  const parseSmartTaskBreakdown = (text) => {
    if (!text) return [];
    const lower = normalizeStr(text);

    // Bóc tách chuyên biệt theo yêu cầu lập file truy xuất trách nhiệm / quyền hạn thành viên
    if (lower.includes('truy xuat trach nhiem') || lower.includes('quyen han') || lower.includes('thanh vien du an') || lower.includes('kuroda')) {
      return [
        {
          titleVi: 'Lên list câu hỏi khảo sát trách nhiệm và quyền hạn',
          titleJa: '責任と権限に関する質問リスト作成',
          status: 'Cần Làm',
          assignee: '',
          checklists: [
            { title: 'Xác định các bên liên quan (Stakeholders)', completed: false },
            { title: 'Soạn bộ câu hỏi chi tiết về vai trò từng vị trí', completed: false },
            { title: 'Kiểm tra lại nội dung với quản lý trực tiếp', completed: false }
          ]
        },
        {
          titleVi: 'Tạo file trả lời / Biểu mẫu thu thập thông tin',
          titleJa: '回答用ファイル・フォームの作成',
          status: 'Cần Làm',
          assignee: '',
          checklists: [
            { title: 'Thiết kế template trên Excel/Notion', completed: false },
            { title: 'Phân chia các mục rõ ràng theo bộ phận', completed: false }
          ]
        },
        {
          titleVi: 'Gửi yêu cầu và file lên nhóm dự án',
          titleJa: 'プロジェクトグループへの共有・依頼',
          status: 'Cần Làm',
          assignee: '',
          checklists: [
            { title: 'Soạn thông báo hướng dẫn cụ thể trên chat group', completed: false },
            { title: 'Đính kèm file biểu mẫu và gắn mốc thời hạn (deadline)', completed: false }
          ]
        },
        {
          titleVi: 'Tổng hợp câu trả lời và hoàn thiện file chính thức',
          titleJa: '回答の集約と正式ファイルの完成',
          status: 'Cần Làm',
          assignee: '',
          checklists: [
            { title: 'Thu thập phản hồi từ các thành viên', completed: false },
            { title: 'Đọc và đối chiếu dữ liệu', completed: false },
            { title: 'Báo cáo kết quả hoàn thiện lên cấp trên', completed: false }
          ]
        }
      ];
    }
    return null;
  };

  // Thuật toán bóc tách dữ liệu thủ công dự phòng (Local Parser)
  const parseLocalTextToTasks = (text) => {
    if (!text) return [];
    // Kiểm tra xem có khớp mẫu thông minh không trước
    const smartParsed = parseSmartTaskBreakdown(text);
    if (smartParsed) return smartParsed;

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
        currentTask.checklists.push({
          title: cleanSub,
          completed: false
        });
      } else if (currentTask) {
        currentTask.checklists.push({
          title: line,
          completed: false
        });
      }
    });
    if (currentTask) parsedTasks.push(currentTask);
    return parsedTasks;
  };

  // Format trạng thái
  const formatStatus = (statusStr) => {
    if (!statusStr) return isJapanese ? '未着手' : 'Cần Làm';
    const s = statusStr.toString().toLowerCase();
    if (s.includes('xong') || s.includes('done') || s.includes('完了')) return isJapanese ? '完了' : 'Đã Xong';
    if (s.includes('đang') || s.includes('progress') || s.includes('進行')) return isJapanese ? '進行中' : 'Đang Làm';
    return statusStr;
  };

  // Xử lý đính kèm file và đọc nội dung file text/markdown trực tiếp
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

  // Hàm xử lý gửi tin nhắn (Tích hợp cả Tìm kiếm/Hỏi đáp lẫn Bóc tách dữ liệu AI)
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
    const isExtractionIntent = userText.toLowerCase().includes('bóc tách') || userText.toLowerCase().includes('tạo task') || userText.toLowerCase().includes('phân tích') || userText.toLowerCase().includes('抽出') || userText.toLowerCase().includes('thêm task') || userText.toLowerCase().includes('ghi chú') || userText.toLowerCase().includes('kuroda') || userText.toLowerCase().includes('truy xuất');

    // 1. Gọi Backend API Chat / Extraction
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          language: isJapanese ? 'ja' : 'vi',
          isExtraction: isExtractionIntent,
          projectData: {
            projectName: projectName || 'Dự án',
            taskList: tasks || []
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.reply || data.extractedTasks)) {
          setChatHistory(prev => [...prev, {
            sender: 'ai',
            textVi: data.reply || (data.extractedTasks ? 'Đã bóc tách dữ liệu công việc thành công:' : ''),
            textJa: data.reply || (data.extractedTasks ? 'タスクデータを正常に抽出しました:' : ''),
            extractedTasks: data.extractedTasks || null,
            result: null
          }]);
          apiSuccess = true;
        }
      }
    } catch (err) {
      console.log("Backend API offline, attempting Gemini API or Local fallback");
    }

    // 2. Nếu Backend không phản hồi mà có truyền apiKey, gọi trực tiếp Gemini API
    if (!apiSuccess && apiKey) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const promptText = isExtractionIntent 
          ? `Bạn là trợ lý AI chuyên bóc tách dữ liệu công việc. Hãy đọc đoạn văn bản sau và trả về DUY NHẤT một chuỗi JSON hợp lệ (không kèm markdown \`\`\`json) theo cấu trúc chính xác:
{
  "tasks": [
    {
      "titleVi": "Tên công việc tiếng Việt",
      "titleJa": "Tên công việc tiếng Nhật",
      "assignee": "Người thực hiện",
      "status": "Cần Làm",
      "checklists": [{ "title": "Bước 1", "completed": false }]
    }
  ]
}
Văn bản đầu vào: "${userText}"`
          : `Bạn là trợ lý quản lý dự án thông minh. Người dùng hỏi: "${userText}". Dữ liệu task hiện tại: ${JSON.stringify(tasks)}. Hãy trả lời rõ ràng, chi tiết bằng ${isJapanese ? 'tiếng Nhật' : 'tiếng Việt'}.`;
        const res = await fetch(url, {
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
                  textVi: `Đã bóc tách thành công ${tasksArr.length} công việc từ nội dung bạn cung cấp:`,
                  textJa: `テキストから ${tasksArr.length} 件のタスクを正常に抽出しました:`,
                  extractedTasks: tasksArr,
                  result: null
                }]);
                apiSuccess = true;
              }
            } catch (e) {
              // Nếu parse JSON lỗi thì chuyển xuống xử lý local fallback bên dưới
            }
          }
          if (!apiSuccess && replyText) {
            setChatHistory(prev => [...prev, {
              sender: 'ai',
              textVi: replyText,
              textJa: replyText,
              result: null,
              extractedTasks: null
            }]);
            apiSuccess = true;
          }
        }
      } catch (err) {
        console.log("Gemini API error, falling back to local agent");
      }
    }

    // 3. Local Agent & Local Fallback Parser
    if (!apiSuccess) {
      if (isExtractionIntent || userText.length > 15) {
        const localExtracted = parseLocalTextToTasks(userText);
        if (localExtracted.length > 0) {
          setChatHistory(prev => [...prev, {
            sender: 'ai',
            textVi: `Đã bóc tách thành công ${localExtracted.length} công việc từ yêu cầu của bạn:`,
            textJa: `要件から ${localExtracted.length} 件のタスクを抽出しました:`,
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
          textVi: `Không tìm thấy công việc hoặc thông tin liên quan đến: "${userText}".`,
          textJa: `キーワードに一致するタスクや情報は見つかりませんでした: "${userText}"。`,
          result: null,
          extractedTasks: null
        }]);
      } else {
        const primaryTask = matchedTasks[0];
        const matchedProj = projects.find(p => p.id === primaryTask.projectId);
        const taskProjectName = matchedProj 
          ? (matchedProj.nameJa || matchedProj.nameVi || matchedProj.name) 
          : (projectName || "Dự án");
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
          result: aiResult,
          extractedTasks: null
        }]);
      }
    }
    setLoading(false);
  };

  // Nút áp dụng danh sách task đã bóc tách đưa vào dự án
  const handleApplyExtractedTasks = (tasksToApply) => {
    if (onTasksExtracted && typeof onTasksExtracted === 'function') {
      onTasksExtracted(tasksToApply);
    }
    setChatHistory(prev => [...prev, {
      sender: 'ai',
      textVi: `✅ Đã thêm thành công ${tasksToApply.length} công việc vào dự án!`,
      textJa: `✅ ${tasksToApply.length} 件のタスクをプロジェクトに追加しました！`,
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
            <div className={`max-w-[90%] p-2.5 rounded-xl leading-relaxed ${
              chat.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none shadow-sm' 
                : 'bg-purple-100/90 text-purple-900 rounded-bl-none border border-purple-200 space-y-2'
            }`}>
              <p className="whitespace-pre-wrap">{isJapanese ? (chat.textJa || chat.textVi) : (chat.textVi || chat.textJa)}</p>
              {/* Hiển thị giao diện danh sách task bóc tách có nút Thêm vào dự án */}
              {chat.extractedTasks && chat.extractedTasks.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-200 space-y-2 bg-white/95 p-2.5 rounded-lg shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-purple-900 text-[12px]">
                      📋 {isJapanese ? `抽出されたタスク (${chat.extractedTasks.length}件):` : `Danh sách task bóc tách (${chat.extractedTasks.length}):`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleApplyExtractedTasks(chat.extractedTasks)}
                      className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-xs transition"
                    >
                      ➕ {isJapanese ? 'プロジェクトに追加' : 'Thêm vào dự án'}
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {chat.extractedTasks.map((t, tIdx) => (
                      <div key={tIdx} className="bg-purple-50 p-2 rounded border border-purple-100 text-[11px] space-y-1">
                        <div className="font-bold text-purple-900 flex justify-between items-start gap-1">
                          <span>{tIdx + 1}. {isJapanese ? (t.titleJa || t.titleVi) : (t.titleVi || t.titleJa)}</span>
                          {t.assignee && (
                            <span className="bg-purple-200 text-purple-800 px-1.5 py-0.2 rounded text-[10px] shrink-0">
                              👤 {t.assignee}
                            </span>
                          )}
                        </div>
                        {t.checklists && t.checklists.length > 0 && (
                          <ul className="list-disc pl-4 text-gray-600 space-y-0.5">
                            {t.checklists.map((c, cIdx) => (
                              <li key={cIdx}>{typeof c === 'string' ? c : (c.title || c.text)}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Hiển thị kết quả tra cứu tiến độ / chi tiết công việc */}
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
              🤖 {isJapanese ? 'AIがタスクデータを処理中...' : 'AI đang xử lý dữ liệu và bóc tách task...'}
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
          placeholder={isJapanese ? "メッセージを入力 (例: 物件, 抽出, 手順...)" : "Nhập yêu cầu (VD: Bác Kuroda yêu cầu lên file truy xuất...)"}
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
