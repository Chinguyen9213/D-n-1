const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const prisma = new PrismaClient();

const apiKey = process.env.GEMINI_API_KEY;

// Trỏ chính xác ra thư mục frontend/dist tính từ thư mục gốc dự án
const frontendPath = path.resolve(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

// --- CÁC ROUTE API CỦA BẠN ---
app.get('/api/data', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ include: { tasks: true } });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const { projects } = req.body;
    res.json({ success: true, message: "Đã lưu dữ liệu lên mây thành công!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route Trợ lý AI Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, projectData } = req.body;
    if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên Render!" });

    const systemPrompt = `
Bạn là Trợ lý AI quản lý tiến độ dự án.
Dữ liệu công việc thực tế hiện tại trong hệ thống:
- Tên dự án: ${projectData?.projectName || 'Oishii BBQ'}
- Tiến độ tổng quan: ${projectData?.progress || '0%'}
- Danh sách công việc (Tasks): ${JSON.stringify(projectData?.taskList || [])}

Nhiệm vụ: Trả lời người dùng bằng tiếng Việt ngắn gọn, rõ ràng dựa vào danh sách task.
`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\nCâu hỏi người dùng: " + message }] }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Không nhận được phản hồi từ AI.";
    res.json({ reply });
  } catch (error) {
    console.error("Lỗi AI Chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route Phân tích Task
app.post('/api/ai/parse-task', async (req, res) => {
  try {
    const { text } = req.body;
    if (!apiKey) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên Render!" });

    const prompt = `Đọc đoạn mô tả sau và bóc tách thành các trường thông tin chuẩn dưới dạng JSON (chỉ trả về JSON thuần) gồm các field: title, assignee, priority. Nội dung: "${text}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    res.json(JSON.parse(jsonText));
  } catch (error) {
    console.error("Lỗi Parse Task:", error);
    res.status(500).json({ error: error.message });
  }
});

// Trả về index.html nếu truy cập các trang giao diện
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'), (err) => {
    if (err) {
      res.status(404).send("Not Found");
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
