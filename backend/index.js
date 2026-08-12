const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const prisma = new PrismaClient();

// Khởi tạo Gemini AI với biến môi trường GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// API Lấy toàn bộ dữ liệu dự án và task từ Database
app.get('/api/data', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: { tasks: true }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Lưu hoặc cập nhật toàn bộ trạng thái dữ liệu lên Database
app.post('/api/data', async (req, res) => {
  try {
    const { projects } = req.body;
    res.json({ success: true, message: "Đã lưu dữ liệu lên mây thành công!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. API Trò chuyện AI & Hỏi đáp tiến độ Task
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, projectData } = req.body;

    if (!genAI) {
      return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên Render!" });
    }

    const systemInstruction = `
Bạn là Trợ lý AI quản lý tiến độ dự án.
Dữ liệu công việc thực tế hiện tại trong hệ thống:
- Tên dự án: ${projectData?.projectName || 'Oishii BBQ'}
- Tiến độ tổng quan: ${projectData?.progress || '0%'}
- Danh sách công việc (Tasks): ${JSON.stringify(projectData?.taskList || [])}

Nhiệm vụ:
1. Trả lời người dùng bằng tiếng Việt ngắn gọn, rõ ràng, thân thiện.
2. Dựa HOÀN TOÀN vào danh sách task trên để trả lời (ví dụ: task nào đã xong, task nào chưa xong, ai làm).
3. Nếu người dùng hỏi về công việc chưa có trong danh sách, hãy báo rõ là chưa tìm thấy task đó.
`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    const result = await model.generateContent(message);
    res.json({ reply: result.response.text() });

  } catch (error) {
    console.error("Lỗi Chat AI:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. API AI tự động phân tích text thành Task
app.post('/api/ai/parse-task', async (req, res) => {
  try {
    const { text } = req.body;

    if (!genAI) {
      return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY trên Render!" });
    }

    const prompt = `Đọc đoạn mô tả sau và bóc tách thành các trường thông tin chuẩn dưới dạng JSON gồm: title (tên task tiếng Việt), assignee (người phụ trách nếu có), priority (mức độ ưu tiên: Thấp, Trung bình, Cao). Nội dung: "${text}"`;

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const result = await model.generateContent(prompt);
    res.json(JSON.parse(result.response.text()));
  } catch (error) {
    console.error("Lỗi Parse Task:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
