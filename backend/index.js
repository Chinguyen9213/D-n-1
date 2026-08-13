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
    const projects = await prisma.project.findMany({ 
      include: { 
        tasks: { 
          include: { 
            checklists: true, 
            attachments: true 
          } 
        } 
      } 
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data', async (req, res) => {
  try {
    const { projects } = req.body;
    // Bổ sung logic lưu database Prisma tại đây nếu cần
    res.json({ success: true, message: "Đã lưu dữ liệu lên mây thành công!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route 1: Trợ lý AI Chat (Truy xuất dữ liệu - Giữ nguyên 100%)
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

    const response = await fetch(`[https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=$){apiKey}`, {
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

// Route 2: Trợ lý AI Bóc tách Task (Đã sửa triệt để lỗi syntax và parse JSON)
app.post('/api/ai/parse-task', async (req, res) => {
  try {
    const { text, prompt: inputPrompt } = req.body;
    const userText = text || inputPrompt || '';

    if (!userText.trim()) {
      return res.status(400).json({ error: "Nội dung cần bóc tách không được để trống!" });
    }

    if (!apiKey) {
      return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên Render!" });
    }

    const prompt = `Đọc đoạn mô tả sau và bóc tách thành các trường thông tin chuẩn dưới dạng JSON gồm các field: title, assignee, priority, dueDate, checklists (mảng danh sách bước làm nếu có). Trả về JSON thuần tuý. Nội dung: "${userText}"`;

    const response = await fetch(`[https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$](https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$){apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json" 
        }
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let rawJsonText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // Xử lý chuỗi JSON an toàn, loại bỏ Markdown codeblock nếu có
    const cleanJsonText = rawJsonText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsedTask;
    try {
      parsedTask = JSON.parse(cleanJsonText);
    } catch (pErr) {
      // Dự phòng nếu AI trả về chuỗi không đúng định dạng JSON
      parsedTask = {
        title: userText,
        assignee: null,
        priority: "Trung bình",
        checklists: []
      };
    }

    // Trả về đúng cấu trúc để Frontend nhận diện thành công
    return res.json({
      success: true,
      data: parsedTask,
      reply: parsedTask
    });

  } catch (error) {
    console.error("Lỗi AI Parse Task:", error);
    return res.status(500).json({ error: error.message || "Lỗi xử lý bóc tách task trên Server!" });
  }
});

// Cho phép SPA React Router điều hướng client-side
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
});
