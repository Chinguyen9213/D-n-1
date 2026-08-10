import React, { useState, useRef, useEffect } from 'react';

// --- AGENT 1: Phân tích Ý định & Thực thể ---
function parseUserIntent(text) {
  const lower = text.toLowerCase();
  let intent = 'CHECK_STATUS';
  if (lower.includes('file') || lower.includes('link') || lower.includes('tài liệu') || lower.includes('gửi') || lower.includes('tải')) {
    intent = 'GET_FILE';
  }
  const stopWords = ['đã', 'chưa', 'thế nào', 'nào', 'task', 'của', 'vẽ', 'xong', 'kiểm', 'tra', 'tiến', 'độ', 'cho', 'tôi', 'xem', 'file', 'link'];
  const words = lower.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 1);
  const entity = words.join(' ') || lower;
  return { intent, entity };
}

// --- AGENT 2: Truy xuất Dữ liệu từ mảng tasks ---
function processAgent2Response(intent, entity, tasks = []) {
  const matchedTasks = tasks.filter(t => {
    const titleVi = (t.titleVi || '').toLowerCase();
    const titleJa = (t.titleJa || '').toLowerCase();
    return titleVi.includes(entity) || titleJa.includes(entity) || entity.split(' ').some(w => titleVi.includes(w));
  });

  if (matchedTasks.length === 0) {
    return {
      text: `Rất tiếc, tôi không tìm thấy công việc nào khớp với từ khóa "${entity}". Bạn hãy kiểm tra lại tên task nhé!`,
      attachments: []
    };
  }

  let responseLines = [];
  let allAttachments = [];

  matchedTasks.forEach(task => {
    const totalChecklist = task.checklists ? task.checklists.length : 0;
    const completedChecklist = task.checklists ? task.checklists.filter(c => c.completed).length : 0;
    
    let statusLabel = 'Đang tiến hành';
    if (task.status === 'Đã Xong' || (completedChecklist === totalChecklist && totalChecklist > 0)) {
      statusLabel = '✅ Đã hoàn thành';
    } else if (task.status === 'Cần Làm') {
      statusLabel = '🟡 Chưa bắt đầu (Cần làm)';
    }

    responseLines.push(`📌 **${task.titleVi || task.title}**\n- Trạng thái: ${statusLabel}\n- Tiến độ checklist: ${completedChecklist}/${totalChecklist} bước\n- Người phụ trách: ${task.assignee || 'Chi'}`);

    if (task.attachments && task.attachments.length > 0) {
      allAttachments.push(...task.attachments);
    }
  });

  return {
    text: responseLines.join('\n\n'),
    attachments: allAttachments
  };
}

export default function AiAssistant({ tasks = [], isJa }) {
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState([
    {
      sender: 'ai',
      text: isJa 
        ? 'こんにちは！AIタスクアシスタントです。タスクの進捗状況について何でも聞いてください（例：「ロゴの進捗は？」）。' 
        : 'Xin chào Chi! Tôi là Trợ lý AI quản lý tiến độ. Bạn có thể hỏi bất cứ lúc nào (VD: "tiến độ task logo thế nào?").',
      attachments: []
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isTyping]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userQuery = inputMessage.trim();
    setChatLog(prev => [...prev, { sender: 'user', text: userQuery, attachments: [] }]);
    setInputMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const agent1 = parseUserIntent(userQuery);
      const agent2 = processAgent2Response(agent1.intent, agent1.entity, tasks);

      setChatLog(prev => [
        ...prev,
        {
          sender: 'ai',
          text: agent2.text,
          attachments: agent2.attachments,
          debug: `[Agent Parsed] Intent: ${agent1.intent} | Entity: "${agent1.entity}"`
        }
      ]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm flex flex-col h-[450px] overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white flex justify-between items-center">
        <h3 className="text-xs font-bold flex items-center gap-1.5">
          🤖 {isJa ? 'AIタスク進捗アシスタント' : 'Trợ lý AI Bóc tách & Quản lý Công việc'}
        </h3>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Ready</span>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-gray-50 text-xs">
        {chatLog.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-2.5 rounded-xl leading-relaxed whitespace-pre-wrap shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-purple-200 rounded-bl-none'
            }`}>
              {msg.debug && (
                <div className="mb-1 text-[9px] font-mono text-purple-600 border-b pb-0.5">
                  {msg.debug}
                </div>
              )}
              <p>{msg.text}</p>

              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                  <p className="font-bold text-[10px] text-gray-600">📎 Tài liệu đính kèm:</p>
                  {msg.attachments.map((att, aIdx) => (
                    <div key={aIdx} className="flex justify-between items-center bg-purple-50 p-1.5 rounded border border-purple-100">
                      <span className="truncate max-w-[150px]">{att.name}</span>
                      <a href={att.url} target="_blank" rel="noreferrer" className="bg-purple-600 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                        Xem/Tải
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-purple-100 text-purple-700 p-2 rounded-xl text-[11px] italic animate-pulse">
              🤖 AI đang truy xuất dữ liệu task...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-purple-100 flex gap-2">
        <input
          type="text"
          placeholder={isJa ? "タスクについて質問する..." : "Hỏi AI (VD: 'tiến độ task logo', 'trạng thái bảng giá')..."}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 text-xs border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 bg-gray-50"
        />
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm">
          Gửi cho Bot
        </button>
      </form>
    </div>
  );
}
