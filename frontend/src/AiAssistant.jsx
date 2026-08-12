import React, { useState } from 'react';

export default function AiAssistant({ tasks, projectName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    // Thu thập dữ liệu tiến độ & danh sách task thực tế
    const projectData = {
      projectName: projectName || "Oishii BBQ",
      progress: tasks ? `${tasks.filter(t => t.completed).length}/${tasks.length} mục` : "0/0 mục",
      taskList: tasks || []
    };

    try {
      // Gọi sang Backend (đã deploy trên Render)
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          projectData: projectData
        })
      });

      const data = await res.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'bot', text: 'Lỗi kết nối tới server AI.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="chat-box">
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
        <button onClick={handleSend}>Gửi</button>
      </div>
    </div>
  );
}
