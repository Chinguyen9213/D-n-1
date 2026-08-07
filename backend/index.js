const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

async function initData() {
  try {
    const count = await prisma.project.count();
    if (count === 0) {
      await prisma.project.createMany({
        data: [
          { name: 'Hệ thống CRM' },
          { name: 'Website E-commerce' },
          { name: 'App Mobile' }
        ]
      });
      console.log('Đã khởi tạo các dự án mặc định.');
    }
  } catch (err) {
    console.error('Lỗi khởi tạo:', err.message);
  }
}
initData();

app.get('/', (req, res) => {
  res.send('Project Tracker API đang chạy!');
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({ include: { tasks: true } });
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

app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({ include: { project: true } });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, assignee, priority, status, dueDate, projectId } = req.body;
    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || '',
        assignee,
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

app.patch('/api/tasks/:id/status', async (req, res) => {
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

app.delete('/api/tasks/:id', async (req, res) => {
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
