const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret_kanban_key';

app.use(cors());
app.use(express.json());

// Middleware kiểm tra Token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Phiên làm việc hết hạn' });
  }
};

app.get('/', (req, res) => {
  res.send('Project Tracker API đang chạy!');
});

// API ĐĂNG KÝ
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });

    // Tạo sẵn 1 dự án mẫu cho tài khoản mới
    await prisma.project.create({
      data: { name: 'Dự án đầu tiên', userId: user.id }
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(400).json({ error: 'Email đã tồn tại!' });
  }
});

// API ĐĂNG NHẬP
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Sai tài khoản hoặc mật khẩu' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LẤY DỰ ÁN (Chỉ lấy dự án của người dùng đang đăng nhập)
app.get('/api/projects', authenticate, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId },
      include: { tasks: true }
    });
    const result = projects.map(proj => {
      const total = proj.tasks.length;
      const completed = proj.tasks.filter(t => t.status === 'DONE').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { ...proj, totalTasks: total, completedTasks: completed, progress };
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TẠO TASK MỚI
app.post('/api/tasks', authenticate, async (req, res) => {
  try {
    const { title, description, assignee, priority, status, dueDate, projectId } = req.body;
    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || '',
        assignee: assignee || 'Chưa phân công',
        priority: priority || 'Trung bình',
        status: status || 'TODO',
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        projectId
      }
    });
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CẬP NHẬT TRẠNG THÁI TASK
app.patch('/api/tasks/:id/status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updatedTask = await prisma.task.update({
      where: { id },
      data: { status }
    });
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// XÓA TASK
app.delete('/api/tasks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id } });
    res.json({ message: 'Xóa task thành công' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại cổng: ${PORT}`);
});
