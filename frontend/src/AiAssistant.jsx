import React, { useState } from 'react';

export default function AiAssistant() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleParseTask = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Lỗi kết nối đến server AI!" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6">
      <h3 className="font-bold text-base text-gray-800 mb-3 flex items-center gap-2">
        <span>🤖</span> Trợ lý AI Bóc tách Công việc Nhanh
      </h3>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nhập yêu cầu (VD: Nhắc Anh Take chuẩn bị nguyên liệu lẩu gấp...)"
          className="flex-1 border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleParseTask}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition duration-200 disabled:opacity-50"
        >
          {loading ? 'Đang phân tích...' : 'Gửi AI'}
        </button>
      </div>

      {result && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs font-mono text-gray-700 border border-gray-200 whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </div>
      )}
    </div>
  );
}
