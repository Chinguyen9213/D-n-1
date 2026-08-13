import React, { useState } from 'react';

// Hàm hỗ trợ chuẩn hóa chuỗi: xóa dấu tiếng Việt, chuyển chữ thường để so sánh chính xác
const normalizeText = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
};

export default function AiAssistant({ tasks, projectName }) {
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Xin chào Chi! Tôi là Trợ lý AI. Bạn có thể hỏi về tiến độ công việc (ví dụ: "đã vẽ xong logo chưa?", "bảng giá...").', 
      result: null 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg, result: null }]);
    setLoading(true);

    setTimeout(() => {
      const normalizedQuery = normalizeText(userMsg);
      const currentTasks = tasks || [];

      // --- LOGIC TÌM KIẾM CẢ TASK LỚN LẪN MỤC CON (SUBTASKS / CHECKLISTS) ---
      const matchedTask = currentTasks.find(t => {
        const titleVi = normalizeText(t.titleVi || t.title || '');
        const titleJa = normalizeText(t.titleJa || '');
        const assignee = normalizeText(t.assignee || '');

        // 1. Kiểm tra khớp ở Tiêu đề Task lớn hoặc Người phụ trách
        const matchTitleOrAssignee = titleVi.includes(normalizedQuery) || 
                                     titleJa.includes(normalizedQuery) || 
                                     assignee.includes(normalizedQuery);

        // 2. Kiểm tra khớp ở bất kỳ Mục con (Checklist / Subtask) nào
        const subitems = t.checklists || t.subtasks || [];
        const matchSubitem = subitems.some(item => {
          const itemTextVi = normalizeText(item.textVi || item.text || item.name || item.title || '');
          const itemTextJa = normalizeText(item.textJa || item.titleJa || '');
          return itemTextVi.includes(normalizedQuery) || itemTextJa.includes(normalizedQuery);
        });

        // 3. Kiểm tra khớp ở tên File/Link đính kèm
        const attachments = t.attachments || [];
        const matchAttachment = attachments.some(att => 
          normalizeText(att.name || att.title || '').includes(normalizedQuery)
        );

        return matchTitleOrAssignee || matchSubitem || matchAttachment;
      });

      if (!matchedTask) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: `Không tìm thấy công việc nào khớp với từ khóa trong câu hỏi: "${userMsg}".`,
          result: null
        }]);
        setLoading(false);
        return;
      }

      // --- TRUY XUẤT THÔNG TIN TASK ĐÃ TÌM THẤY ---
      const checklists = matchedTask.checklists || matchedTask.subtasks || [];
      const totalSteps = checklists.length;
      const completedSteps = checklists.filter(c => c.completed || c.status === 'Done').length;

      const aiResult = {
        taskTitle: matchedTask.titleVi || matchedTask.title || matchedTask.titleJa,
        status: matchedTask.status || (matchedTask.completed ? 'Đã Xong' : 'Đang Làm'),
        progressText: totalSteps > 0 ? `Đã xong ${completedSteps}/${totalSteps} bước checklist` : "Chưa có bước checklist chi tiết",
        checklists: checklists,
        attachments: matchedTask.attachments || []
      };

      setMessages(prev => [...prev, {
        sender: 'bot',
        text: `Dưới đây là thông tin chi tiết cho công việc bạn yêu cầu trong dự án "${projectName || "Oishii BBQ"}":`,
        result: aiResult
      }]);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 flex flex-col h-[480px] shadow-sm">
      <div className="flex justify-between items-center pb-3 border-b border-purple-200 mb-3">
        <span className="font-bold text-purple-900 text-sm flex items-center gap-1.5">
          💬 Trợ Lý AI Trò Chuyện & Hỗ Trợ (Local Agent)
        </span>
        <span className="text-[11px] bg-purple-200 text-purple-800 font-bold px-2 py-0.5 rounded-full">Active</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-xs ${
              msg.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none' 
                : 'bg-white border border-purple-200 text-gray-800 rounded-bl-none shadow-sm space-y-2'
            }`}>
              <p>{msg.text}</p>
              
              {msg.result && (
                <div className="mt-2.5 pt-2.5 border-t border-purple-100 space-y-2 text-xs">
                  <div className="font-bold text-purple-900 text-[13px]">📌 Công việc: "{msg.result.taskTitle}"</div>
                  
                  <div>
                    <span className="font-semibold text-gray-500">Trạng thái: </span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      msg.result.status === 'Đã Xong' || msg.result.status === 'Done' ? 'bg-green-100 text-green-700' :
                      msg.result.status === 'Đang Làm' || msg.result.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {msg.result.status}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold text-gray-500">Tiến độ chi tiết: </span>
                    <span className="font-medium text-gray-700">{msg.result.progressText}</span>
                    {msg.result.checklists.length > 0 && (
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-gray-600">
                        {msg.result.checklists.map((c, i) => (
                          <li key={i} className={c.completed || c.status === 'Done' ? "line-through text-gray-400" : ""}>
                            {c.textVi || c.text || c.name} {c.completed || c.status === 'Done' ? "✓" : "..."}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {msg.result.attachments && msg.result.attachments.length > 0 && (
                    <div className="pt-2 border-t border-purple-100 space-y-1.5">
                      <span className="font-semibold text-gray-500 block">File/Kết quả đính kèm:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.result.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att.url || att.link}
                            target="_blank"
                            rel="noreferrer"
                            download={att.type === 'file' ? (att.name || 'download') : undefined}
                            className="inline-flex items-center gap-1 bg-purple-50 border border-purple-300 text-purple-700 hover:bg-purple-100 font-semibold px-2.5 py-1 rounded-md shadow-xs transition"
                          >
                            {att.type === 'file' ? '💾' : '🔗'} {att.name || att.title || 'Tập tin đính kèm'}
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
          <div className="flex items-start">
            <div className="bg-white border border-purple-200 text-gray-500 rounded-2xl rounded-bl-none px-4 py-2 text-xs shadow-sm">
              🤖 AI đang quét trạng thái và checklist công việc...
            </div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-purple-200 flex gap-2 mt-2">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Nhập nội dung trao đổi (VD: logo, bảng giá...)"
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 border border-purple-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-600 bg-white"
        />
        <button 
          onClick={handleSend} 
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow-sm transition disabled:opacity-50"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}
