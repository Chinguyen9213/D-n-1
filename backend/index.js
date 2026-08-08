const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- API PROJECTS ---
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { id, nameVi, nameJa } = req.body;
    const newProj = await prisma.project.create({
      data: { id, nameVi, nameJa }
    });
    res.status(201).json(newProj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({ where: { id } });
    res.json({ message: 'Đã xóa dự án thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API TASKS ---
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { checklists: true, attachments: true }
    });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { id, projectId, titleVi, titleJa, status, priority, assignee, dueDate, checklists, attachments } = req.body;
    const newTask = await prisma.task.create({
      data: {
        id,
        projectId,
        titleVi,
        titleJa,
        status: status || 'Cần Làm',
        priority: priority || 'MEDIUM',
        assignee: assignee || '',
        dueDate: dueDate || '',
        checklists: {
          create: (checklists || []).map(c => ({ id: c.id, textVi: c.textVi, textJa: c.textJa, completed: c.completed }))
        },
        attachments: {
          create: (attachments || []).map(a => ({ id: a.id, name: a.name, url: a.url }))
        }
      },
      include: { checklists: true, attachments: true }
    });
    res.status(201).json(newTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { titleVi, titleJa, status, priority, assignee, dueDate, checklists, attachments } = req.body;

    // Xóa checklist và attachment cũ đi để tạo mới lại cho đồng bộ
    await prisma.checklist.deleteMany({ where: { taskId } });
    await prisma.attachment.deleteMany({ where: { taskId } });

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        titleVi,
        titleJa,
        status,
        priority,
        assignee,
        dueDate,
        checklists: {
          create: (checklists || []).map(c => ({ id: c.id, textVi: c.textVi, textJa: c.textJa, completed: c.completed }))
        },
        attachments: {
          create: (attachments || []).map(a => ({ id: a.id, name: a.name, url: a.url }))
        }
      },
      include: { checklists: true, attachments: true }
    });
    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    await prisma.task.delete({ where: { id: taskId } });
    res.json({ message: 'Đã xóa task thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server Prisma đang chạy tại cổng http://localhost:${PORT}`);
});
