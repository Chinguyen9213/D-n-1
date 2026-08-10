import React, { useState, useRef, useEffect } from 'react';

function parseUserIntent(text) {
  const lower = text.toLowerCase();
  let intent = 'CHECK_STATUS';
  if (lower.includes('file') || lower.includes('link') || lower.includes('tài liệu') || lower.includes('gửi') || lower.includes('tải') || lower.includes('xem')) {
    intent = 'GET_FILE';
  }
  const stopWords = ['đã', 'chưa', 'thế nào', 'nào', 'task', 'của', 'vẽ', 'xong', 'kiểm', 'tra', 'tiến', 'độ', 'cho', 'tôi', 'xem', 'file', 'link', 'ở', 'đâu', 'đến'];
  const words = lower.split(/\s+/).filter(w => !stopWords.includes(w) && w.length > 1);
  const entity = words.join(' ') || lower;
  return { intent, entity };
}

function processAgent2Response(intent, entity, tasks = []) {
  const matchedTasks = tasks.filter(t => {
    const titleVi = (t.titleVi || t.title || '').toLowerCase();
    const titleJa = (t.titleJa || '').toLowerCase();
    return titleVi.includes(entity) || titleJa.includes(entity) || entity.split(' ').some(w => titleVi.includes(w));
  });

  if (matchedTasks.length === 0) {
    return {
      text: `Rất tiếc, tôi không tìm thấy công việc nào khớp với từ khóa "${entity}". Bạn hãy kiểm tra lại tên task hoặc thử từ khóa khác nhé!`,
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

  let finalReply = responseLines.join('\n\n');
  if (intent === 'GET_FILE' && allAttachments.length === 0) {
    finalReply += '\n\n📂 Hiện tại công việc này chưa có file hoặc link đính kèm nào.';
  }

  return {
    text: finalReply,
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
        ? 'こんにちは！AI進捗アシスタントです。タスクの状況やファイルについて何でも聞いてください（例：「ロゴの進捗は？」）。' 
        : 'Xin chào Chi! Tôi là Trợ lý AI tra cứu thông tin. Bạn có thể hỏi về tiến độ, trạng thái hoặc tài liệu của bất kỳ task nào (VD: "mặt bằng đến đâu rồi?").',
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
          attachments: agent2.attachments
        }
      ]);
      setIsTyping(false);
    }, 400);
  };

  return (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm flex flex-col h-[480px] overflow-hidden my-4">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white flex justify-between items-center">
        <h3 className="text-xs font-bold flex items-center gap-1.5">
          🤖 {isJa ? 'AI進捗・情報アシスタント' : 'Trợ lý AI Tra Cứu Thông Tin & Tiến Độ'}
        </h3>
        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Active</span>
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50 text-xs">
        {chatLog.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl leading-relaxed whitespace-pre-wrap shadow-sm ${
              msg.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 border border-purple-200 rounded-bl-none'
            }`}>
              <p>{msg.text}</p>

              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-gray-100 space-y-1.5">
                  <p className="font-bold text-[10px] text-gray-600">📎 Tài liệu đính kèm:</p>
                  {msg.attachments.map((att, aIdx) => (
                    <div key={aIdx} className="flex justify-between items-center bg-purple-50 p-1.5 rounded border border-purple-100">
                      <span className="truncate max-w-[160px] font-medium">{att.name}</span>
                      <a href={att.url} target="_blank" rel="noreferrer" className="bg-purple-600 text-white px-2.5 py-1 rounded text-[10px] font-bold">
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
            <div className="bg-purple-100 text-purple-700 p-2.5 rounded-xl text-[11px] italic animate-pulse">
              🤖 AI đang tra cứu dữ liệu...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-purple-100 flex gap-2 items-center">
        <input
          type="text"
          placeholder={isJa ? "タスクについて質問する..." : "Hỏi AI (VD: 'mặt bằng đến đâu rồi', 'tiến độ task logo')..."}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 text-xs border border-purple-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-purple-500 bg-gray-50"
        />
        <button 
          type="submit" 
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm shrink-0"
        >
          Hỏi AI
        </button>
      </form>
    </div>
  );
}
