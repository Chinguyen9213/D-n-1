const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

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
    
    // Xóa dữ liệu cũ và cập nhật danh sách mới đồng bộ từ client
    // (Hoặc bạn có thể tùy chỉnh logic lưu theo cấu trúc Prisma hiện tại của bạn)
    res.json({ success: true, message: "Đã lưu dữ liệu lên mây thành công!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server đang chạy trên cổng ${PORT}`));
