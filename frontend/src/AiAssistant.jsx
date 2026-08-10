import React, { useState, useRef, useEffect } from 'react';

// --- AGENT 1: Phân tích Ý định (Intent) & Thực thể (Entity) ---
function parseUserIntent(text) {
  const lower = text.toLowerCase();
  
  // Xác định Intent
  let intent = 'UNKNOWN';
  if (
    lower.includes('trạng thái') || lower.includes('tiến độ') || lower.includes('thế nào') ||
    lower.includes('xong chưa') || lower.includes('đã làm') || lower.includes('kiểm tra')
  ) {
    intent = 'CHECK_STATUS';
  } else if (
    lower.includes('file') || lower.includes('link') || lower.includes('tài liệu') ||
    lower.includes('gửi') || lower.includes('tải') || lower.includes('xem')
  ) {
    intent = 'GET_FILE';
  } else {
    // Mặc định nếu gõ chung chung thì hiểu là tìm kiếm task
    intent = 'CHECK_STATUS';
  }

  // Trích xuất Entity (Từ khóa mục tiêu)
  // Lọc bỏ các từ đệm thông dụng để lấy từ khóa chính
  const stopWords = ['đã', 'chưa', 'thế nào', 'nào', 'task', 'của', 'vẽ', 'xong', 'kiểm', 'tra', 'tiến', 'độ', 'cho', 'tôi', 'xem', 'file', 'link', 'ở', 'đâu'];
  const words = lower.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 1);
  const entity = words.join(' ') || lower;

  return { intent, entity };
}

// --- AGENT 2: Truy xuất Dữ liệu (Data Retrieval) & Tổng hợp phản hồi (Responder) ---
function processAgent2Response(intent, entity, tasks) {
  // Tìm kiếm task khớp với entity trong mảng state tasks
  const matchedTasks = tasks.filter(t => {
    const titleVi = (t.titleVi || '').toLowerCase();
    const titleJa = (t.titleJa || '').toLowerCase();
    return titleVi.includes(entity) || titleJa.includes(entity) || entity.split(' ').some(w => titleVi.includes(w));
  });

  if (matchedTasks.length === 0) {
    return {
      text: `Rất tiếc, tôi không tìm thấy công việc nào khớp với từ khóa "${entity}". Bạn hãy kiểm tra lại tên task hoặc thử từ khóa khác nhé!`,
      attachments: []
    };
  }

  // Tổng hợp kết quả từ các task tìm được
  let responseLines = [];
  let allAttachments = [];

  matchedTasks.forEach(task => {
    const totalChecklist = task.checklists ? task.checklists.length : 0;
    const completedChecklist = task.checklists ? task.checklists.filter(c => c.completed).length : 0;
    
    let statusLabel = 'Đang tiến hành';
    if (task.status === 'Đã Xong' || completedChecklist === totalChecklist && totalChecklist > 0) {
      statusLabel = '✅ Đã hoàn thành';
    } else if (task.status === 'Cần Làm') {
      statusLabel = '🟡 Chưa bắt đầu (Cần làm)';
    } else {
      statusLabel = '🔵 Đang thực hiện';
    }

    responseLines.push(`📌 **${task.titleVi}**\n- Trạng thái: ${statusLabel} (${task.status})\n- Tiến độ checklist: ${completedChecklist}/${totalChecklist} bước\n- Người phụ trách: ${task.assignee || 'Chưa gán'}`);

    if (task.attachments && task.attachments.length > 0) {
      allAttachments.push(...task.attachments);
    }
  });

  let finalReply = responseLines.join('\n\n');
  if (intent === 'GET_FILE' && allAttachments.length === 0) {
    finalReply += '\n\n📂 Hiện tại công việc này chưa có file hoặc link đính kèm nào.';
  }

  return {
    text: finalReply,
    attachments: allAttachments
  };
}

// --- COMPONENT CHÍNH: HỆ THỐNG CHATBOT PHỐI HỢP AGENT 1 & AGENT 2 ---
export default function ProjectChatbotAgentSystem({ tasks = [] }) {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      text: 'Xin chào Chi! Tôi là hệ thống Trợ lý AI Quản lý Tiến độ (Agent 1 & Agent 2). Bạn có thể hỏi bất cứ điều gì, ví dụ: "tiến độ task logo" hoặc "lấy file bảng giá".',
      attachments: []
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatLog, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userQuery = inputMessage.trim();
    setChatLog(prev => [...prev, { sender: 'user', text: userQuery, attachments: [] }]);
    setInputMessage('');
    setIsTyping(true);

    // Giả lập độ trễ suy luận của AI (mượt mà trên frontend)
    setTimeout(() => {
      // 1. Kích hoạt Agent 1: Phân tích Ý định & Thực thể
      const agent1Result = parseUserIntent(userQuery);
      
      // 2. Kích hoạt Agent 2: Truy xuất dữ liệu từ state tasks và tạo phản hồi
      const agent2Result = processAgent2Response(agent1Result.intent, agent1Result.entity, tasks);

      setChatLog(prev => [
        ...prev,
        {
          sender: 'ai',
          text: agent2Result.text,
          attachments: agent2Result.attachments,
          debugInfo: `[Agent 1 Parsed] Intent: ${agent1Result.intent} | Entity: "${agent1Result.entity}"`
        }
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[500px] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider">Hệ Thống Đa Agent (Agent 1 & Agent 2)</h3>
            <p className="text-[10px] text-indigo-100">Truy xuất trực tiếp state ứng dụng thời gian thực</p>
          </div>
        </div>
        <span className="text-[10px] bg-white/20 px-2.5 py-1 rounded-full font-semibold">Active Engine</span>
      </div>

      {/* Khung chat cuộn tự động */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-xs">
        {chatLog.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap shadow-sm ${
              msg.sender === 'user'
                ? 'bg-indigo-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
            }`}>
              {msg.debugInfo && (
                <div className="mb-1.5 pb-1 border-b border-gray-100 text-[10px] font-mono text-purple-600 font-semibold">
                  {msg.debugInfo}
                </div>
              )}
              <p>{msg.text}</p>

              {/* Hiển thị tệp đính kèm / file trực tiếp trong khung chat nếu có */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-700">📎 Tài liệu & File kết quả đính kèm:</p>
                  {msg.attachments.map((att, aIdx) => (
                    <div key={aIdx} className="flex items-center justify-between bg-indigo-50/70 border border-indigo-100 px-2.5 py-1.5 rounded-lg">
                      <span className="text-indigo-900 font-medium truncate max-w-[180px]" title={att.name}>
                        {att.type === 'file' ? '💾 ' : '📄 '} {att.name}
                      </span>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        download={att.type === 'file' ? att.name : undefined}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] px-2.5 py-1 rounded shadow-sm transition"
                      >
                        Tải/Xem ngay
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1">
              {msg.sender === 'user' ? 'Bạn' : 'Agent AI System'}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-500 p-3 rounded-2xl rounded-bl-none text-xs italic shadow-sm animate-pulse">
              Agent 1 đang phân tích ý định & Agent 2 đang truy xuất dữ liệu task...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          placeholder="Hỏi AI (VD: 'tiến độ task logo thế nào?', 'gửi file bảng giá')..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-indigo-500 bg-gray-50"
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition shrink-0"
        >
          Gửi yêu cầu
        </button>
      </form>
    </div>
  );
}
