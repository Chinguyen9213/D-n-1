const express = require('express');
const cors = require('cors');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const prisma = new PrismaClient();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

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

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, projectData } = req.body;
    if (!genAI) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên Render!" });

    const systemInstruction = `
Bạn là Trợ lý AI quản lý tiến độ dự án.
Dữ liệu công việc thực tế hiện tại trong hệ thống:
- Tên dự án: ${projectData?.projectName || 'Oishii BBQ'}
- Tiến độ tổng quan: ${projectData?.progress || '0%'}
- Danh sách công việc (Tasks): ${JSON.stringify(projectData?.taskList || [])}

Nhiệm vụ: Trả lời người dùng bằng tiếng Việt ngắn gọn, rõ ràng dựa vào danh sách task.
`;

    // Sử dụng model chuẩn gemini-1.5-flash
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      systemInstruction 
    });

    const result = await model.generateContent(message);
    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error("Lỗi AI Chat:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/parse-task', async (req, res) => {
  try {
    const { text } = req.body;
    if (!genAI) return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên Render!" });

    const prompt = `Đọc đoạn mô tả sau và bóc tách thành các trường thông tin chuẩn dưới dạng JSON gồm: title, assignee, priority. Nội dung: "${text}"`;
    
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(prompt);
    res.json(JSON.parse(result.response.text()));
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
