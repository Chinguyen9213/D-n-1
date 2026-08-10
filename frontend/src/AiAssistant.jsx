// --- TRỢ LÝ AI HỎI ĐÁP (Chatbot thông minh) ---
function AiAssistant({ isJa }) {
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      textVi: 'Xin chào Chi! Tôi là Trợ lý AI hỏi đáp. Bạn cần tôi hỗ trợ giải đáp thắc mắc, viết nội dung hay tư vấn vấn đề gì nào?',
      textJa: 'こんにちは！AIチャットアシスタントです。ご質問やサポートが必要なことがあれば何でもどうぞ。'
    }
  ]);

  const handleFileUploadToAi = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
  };

  const handleSendMessage = async () => {
    if (!inputContent.trim() && !attachedFile) return;
    const userText = inputContent.trim();
    const fileName = attachedFile ? attachedFile.name : '';
    
    const displayMsg = userText + (fileName ? ` (📎 Đính kèm: ${fileName})` : '');
    setChatHistory(prev => [...prev, { sender: 'user', textVi: displayMsg, textJa: displayMsg }]);
    
    setInputContent('');
    setLoading(true);

    try {
      // -----------------------------------------------------------------
      // BẠN CÓ THỂ THAY THẾ ĐOẠN NÀY BẰNG LỆNH GỌI API THỰC TẾ (ví dụ: fetch đến OpenAI, Gemini API, v.v.)
      // -----------------------------------------------------------------
      // const response = await fetch('YOUR_API_ENDPOINT', { method: 'POST', body: JSON.stringify({ prompt: userText }) });
      // const data = await response.json();
      // const aiResponseText = data.reply;
      
      // Đoạn giả lập AI thông minh trả lời động dựa trên câu hỏi:
      await new Promise(resolve => setTimeout(resolve, 1000)); // Giả lập độ trễ mạng
      
      let aiReplyVi = `Tôi đã hiểu câu hỏi của bạn về "${userText}". Dựa trên hệ thống quản lý dự án, bạn có thể phân chia các task nhỏ hoặc kiểm tra lại tiến độ ở bảng Kanban phía dưới.`;
      let aiReplyJa = `「${userText}」についての質問ですね。プロジェクト管理システムに基づき、下のカンバンボードでタスクや進捗を確認することをお勧めします。`;

      if (userText.toLowerCase().includes('chào') || userText.toLowerCase().includes('hi')) {
        aiReplyVi = "Chào bạn! Tôi luôn sẵn sàng hỗ trợ bạn tối ưu hóa công việc hàng ngày.";
        aiReplyJa = "こんにちは！毎日の業務効率化を全力でサポートいたします。";
      } else if (userText.toLowerCase().includes('giúp') || userText.toLowerCase().includes('tính năng')) {
        aiReplyVi = "Hệ thống này hỗ trợ bạn quản lý task song ngữ Việt - Nhật, theo dõi deadline qua lịch, và lưu trữ tài liệu đính kèm rất tiện lợi!";
        aiReplyJa = "このシステムでは、日越バイリンガルタスク管理、カレンダーでの期限追跡、添付ファイルの保存などが可能です！";
      }

      setChatHistory(prev => [
        ...prev,
        { 
          sender: 'ai', 
          textVi: aiReplyVi, 
          textJa: aiReplyJa 
        }
      ]);
    } catch (error) {
      setChatHistory(prev => [
        ...prev,
        { 
          sender: 'ai', 
          textVi: 'Xin lỗi, đã có lỗi kết nối xảy ra với AI.', 
          textJa: '申し訳ありませんが、AIとの接続エラーが発生しました。' 
        }
      ]);
    } finally {
      setLoading(false);
      if (attachedFile) setAttachedFile(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
          🤖 {isJa ? 'AIチャットアシスタント' : 'Trợ Lý AI Hỏi Đáp Thông Minh'}
        </h3>
        <span className="text-[10px] bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full font-semibold">Interactive Chat</span>
      </div>

      <div className="bg-white/90 rounded-lg p-3 max-h-56 overflow-y-auto space-y-2 border border-purple-100 text-xs">
        {chatHistory.map((chat, idx) => (
          <div key={idx} className={`flex flex-col ${chat.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[90%] p-2.5 rounded-xl leading-relaxed ${
              chat.sender === 'user' 
                ? 'bg-purple-600 text-white rounded-br-none shadow-sm' 
                : 'bg-purple-100/90 text-purple-900 rounded-bl-none border border-purple-200'
            }`}>
              <p>{isJa ? (chat.textJa || chat.textVi) : (chat.textVi || chat.textJa)}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-purple-100 text-purple-700 p-2 rounded-xl text-[11px] italic animate-pulse">
              💬 AI đang suy nghĩ và trả lời...
            </div>
          </div>
        )}
      </div>

      {attachedFile && (
        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-purple-300 text-xs">
          <span className="text-purple-700 font-semibold truncate">📎 Đã đính kèm: {attachedFile.name}</span>
          <button type="button" onClick={() => setAttachedFile(null)} className="text-red-500 font-bold ml-2">✕</button>
        </div>
      )}

      <div className="flex gap-2 items-center">
        <label className="cursor-pointer bg-white hover:bg-purple-50 border border-purple-300 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg shadow-sm flex items-center gap-1 shrink-0">
          📎 File
          <input type="file" onChange={handleFileUploadToAi} className="hidden" />
        </label>
        
        <input
          type="text"
          placeholder="Nhập câu hỏi hoặc yêu cầu thảo luận với AI..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
          className="flex-1 text-xs border border-purple-200 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500 bg-white"
        />
        
        <button
          type="button"
          onClick={handleSendMessage}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm shrink-0"
        >
          Gửi hỏi
        </button>
      </div>
    </div>
  );
}
