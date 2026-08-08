// 👉 Thêm file/link đính kèm vào Task
app.post('/api/tasks/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, url } = req.body;

    // 1. Lấy thông tin task hiện tại
    const task = await prisma.task.findUnique({ where: { id: String(id) } });
    if (!task) return res.status(404).json({ error: 'Không tìm thấy Task' });

    // 2. Thêm file mới vào mảng attachments hiện có
    const currentAttachments = Array.isArray(task.attachments) ? task.attachments : [];
    const newAttachment = {
      id: Date.now().toString(),
      name,
      url,
      uploadedAt: new Date().toISOString()
    };
    
    const updatedAttachments = [...currentAttachments, newAttachment];

    // 3. Cập nhật lại vào Database
    const updatedTask = await prisma.task.update({
      where: { id: String(id) },
      data: { attachments: updatedAttachments }
    });

    res.json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
