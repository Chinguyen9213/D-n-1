import React, { useState } from 'react';

export default function AiAssistant({ tasks, projectName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    // Thu thập dữ liệu tiến độ & danh sách task thực tế
    const projectData = {
      projectName: projectName || "Oishii BBQ",
      progress: tasks && tasks.length > 0 
        ? `${tasks.filter(t => t.completed || t.status === 'Done').length}/${tasks.length} mục (${Math.round((tasks.filter(t => t.completed || t.status === 'Done').length / tasks.length) * 100)}%)` 
        : "0/0 mục (0%)",
      taskList: tasks || []
    };

    try {
      // Đã sửa đường dẫn thành /api/ai/chat cho khớp với Backend
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          projectData: projectData
        })
      });

      const data = await res.json();

      if (res.ok && data.reply) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: data.error || 'Có lỗi xảy ra khi xử lý phản hồi từ AI.' }]);
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn AI:", err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Lỗi kết nối tới server AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="chat-box">
        {messages.length === 0 && (
          <div className="message bot">
            Xin chào! Tôi là Trợ lý AI trò chuyện. Bạn có thể hỏi về tiến độ, công việc hoặc bất kỳ thông tin gì trong dự án!
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="message bot">AI đang kiểm tra tiến độ...</div>}
      </div>

      <div className="chat-input-area">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Nhập nội dung trao đổi với AI..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={loading}>Gửi</button>
      </div>
    </div>
  );
}
