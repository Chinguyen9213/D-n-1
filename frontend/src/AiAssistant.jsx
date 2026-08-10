// --- HÀM XỬ LÝ TRỢ LÝ AI (Agent 1 & Agent 2) ---
const handleAiQuery = (userQuery, tasksList) => {
  const query = userQuery.toLowerCase();
  
  // Agent 1: Bóc tách từ khóa mục tiêu (entity) từ câu hỏi tự do
  // Tìm xem câu hỏi nhắc đến từ khóa nào có trong danh sách task
  const matchedTask = tasksList.find(t => {
    const titleVi = (t.titleVi || '').toLowerCase();
    const titleJa = (t.titleJa || '').toLowerCase();
    // Kiểm tra xem tiêu đề task có chứa từ khóa người dùng gõ không (ví dụ: "logo", "bảng giá")
    // Tách các từ trong query để quét tìm kiếm linh hoạt hơn
    const keywords = query.split(/\s+/).filter(word => word.length > 1);
    return keywords.some(kw => titleVi.includes(kw) || titleJa.includes(kw));
  });

  if (!matchedTask) {
    return {
      status: "Không tìm thấy",
      detail: "Không tìm thấy công việc nào khớp với từ khóa bạn hỏi.",
      attachments: []
    };
  }

  // Agent 2: Truy xuất thông tin từ state tasks & checklist
  const totalSteps = matchedTask.checklists ? matchedTask.checklists.length : 0;
  const completedSteps = matchedTask.checklists ? matchedTask.checklists.filter(c => c.completed).length : 0;
  
  return {
    taskTitle: matchedTask.titleVi || matchedTask.titleJa,
    status: matchedTask.status, // "Cần Làm", "Đang Làm", "Đã Xong"
    progressText: totalSteps > 0 ? `Đã xong ${completedSteps}/${totalSteps} bước checklist` : "Chưa có bước checklist chi tiết",
    checklists: matchedTask.checklists || [],
    attachments: matchedTask.attachments || []
  };
};
