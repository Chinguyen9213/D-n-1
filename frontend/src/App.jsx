import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// --- HÀM HỖ TRỢ & DỮ LIỆU MẪU ---
const PRIORITIES = {
  HIGH: { label: '🔥 Cao', color: 'text-red-600', bg: 'bg-red-50' },
  MEDIUM: { label: '⚡ Trung', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  LOW: { label: '✅ Thấp', color: 'text-blue-600', bg: 'bg-blue-50' }
};

export default function AdvancedKanban() {
  const { t, i18n } = useTranslation();
  const isJa = i18n.language?.startsWith('ja');

  // Khởi tạo dữ liệu với các trường mới
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('adv_tasks');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        title: 'Thiết kế Logo Oishii BBQ',
        status: 'Đã Xong',
        priority: 'HIGH',
        assignee: 'Chi',
        dueDate: '2026-08-10',
        checklists: [{ id: 1, text: 'Vẽ phác thảo', done: true }],
        comments: [{ id: 1, user: 'Chi', text: 'Logo cần màu đỏ tươi' }],
        attachments: 2
      }
    ];
  });

  useEffect(() => localStorage.setItem('adv_tasks', JSON.stringify(tasks)), [tasks]);

  // --- CÁC TÍNH NĂNG MỚI ---
  const calculateProgress = (taskList) => {
    const total = taskList.reduce((acc, t) => acc + t.checklists.length, 0);
    const done = taskList.reduce((acc, t) => acc + t.checklists.filter(c => c.done).length, 0);
    return total === 0 ? 0 : Math.round((done / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 1. DASHBOARD TỔNG QUAN */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">Tiến độ chung</p>
          <div className="text-2xl font-bold text-blue-600">{calculateProgress(tasks)}%</div>
          <div className="w-full bg-gray-200 h-2 rounded mt-2">
            <div className="bg-blue-600 h-2 rounded" style={{ width: `${calculateProgress(tasks)}%` }}></div>
          </div>
        </div>
        {/* Thêm các chỉ số báo cáo khác ở đây */}
      </div>

      {/* 2. THANH CÔNG CỤ (Filter & View) */}
      <div className="flex gap-4 mb-6">
        <input className="border p-2 rounded w-64" placeholder="🔍 Tìm kiếm task..." />
        <select className="border p-2 rounded"><option>Lọc theo người thực hiện</option></select>
        <button className="bg-gray-800 text-white px-4 py-2 rounded">Chế độ Lịch (Calendar)</button>
      </div>

      {/* 3. BẢNG KANBAN */}
      <div className="grid grid-cols-3 gap-6">
        {['Cần Làm', 'Đang Làm', 'Đã Xong'].map(status => (
          <div key={status} className="bg-gray-100 p-4 rounded-xl">
            <h3 className="font-bold mb-4">{status} ({tasks.filter(t => t.status === status).length})</h3>
            {tasks.filter(t => t.status === status).map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border mb-3">
                <div className="flex justify-between">
                  <h4 className="font-semibold">{task.title}</h4>
                  <span className={`text-[10px] px-2 py-1 rounded ${PRIORITIES[task.priority].bg} ${PRIORITIES[task.priority].color}`}>
                    {PRIORITIES[task.priority].label}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                  <span>👤 {task.assignee}</span>
                  <span>📅 {task.dueDate}</span>
                  <span>📎 {task.attachments} file</span>
                  <span>💬 {task.comments.length}</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
