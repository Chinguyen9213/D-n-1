import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageShortcut } from './useLanguageShortcut';

const PRIORITIES = {
  HIGH: { labelVi: 'Cao', labelJa: '高', color: 'text-red-600', bg: 'bg-red-50' },
  MEDIUM: { labelVi: 'Trung bình', labelJa: '中', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  LOW: { labelVi: 'Thấp', labelJa: '低', color: 'text-blue-600', bg: 'bg-blue-50' }
};

export default function App() {
  const { t, i18n } = useTranslation();
  useLanguageShortcut();
  const isJa = i18n.language && i18n.language.startsWith('ja');

  // Khôi phục đồng bộ với key cũ (kanban_projects & kanban_tasks)
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('kanban_projects');
    return saved ? JSON.parse(saved) : [
      { id: 'p1', nameVi: 'Khai Trương Cửa Hàng', nameJa: '店舗オープン' },
      { id: 'p2', nameVi: 'Marketing & Quảng Cáo', nameJa: 'マーケティング＆広告' }
    ];
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('kanban_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Nâng cấp dữ liệu cũ tự động thêm các trường mới (priority, comments, attachments) nếu chưa có
        return parsed.map(t => ({
          ...t,
          priority: t.priority || 'MEDIUM',
          comments: t.comments || [],
          attachments: t.attachments || []
        }));
      } catch (e) { console.error(e); }
    }
    return [
      {
        id: 1,
        projectId: 'p1',
        titleVi: 'Thuê mặt bằng & Thi công',
        titleJa: '物件契約＆施工',
        status: 'Đang Làm',
        priority: 'HIGH',
        assignee: 'Chi',
        dueDate: '2026-08-10',
        checklists: [
          { id: 101, textVi: 'Ký hợp đồng thuê', textJa: '賃貸契約締結', completed: true },
          { id: 102, textVi: 'Thiết kế biển bảng', textJa: '看板デザイン', completed: false }
        ],
        comments: [],
        attachments: []
      }
    ];
  });

  useEffect(() => { localStorage.setItem('kanban_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('kanban_tasks', JSON.stringify(tasks)); }, [tasks]);

  const [currentView, setCurrentView] = useState('p1');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' hoặc 'calendar'

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' hoặc id project

  const getProjName = (p) => isJa ? (p.nameJa || p.nameVi) : (p.nameVi || p.nameJa);
  const getTaskTitle = (task) => isJa ? (task.titleJa || task.titleVi) : (task.titleVi || task.titleJa);
  const getChecklistText = (item) => isJa ? (item.textJa || item.textVi) : (item.textVi || item.textJa);

  // Tính tổng tiến độ chung toàn hệ thống hoặc theo project
  const totalChecklists = tasks.reduce((acc, t) => acc + t.checklists.length, 0);
  const completedChecklists = tasks.reduce((acc, t) => acc + t.checklists.filter(c => c.completed).length, 0);
  const overallProgress = totalChecklists > 0 ? Math.round((completedChecklists / totalChecklists) * 100) : 0;

  // Lọc task theo từ khóa, người thực hiện, mức độ ưu tiên
  const filteredTasks = tasks.filter(t => {
    const matchProj = activeTab === 'overview' || t.projectId === activeTab;
    const title = getTaskTitle(t).toLowerCase();
    const matchSearch = title.includes(searchTerm.toLowerCase()) || (t.assignee && t.assignee.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchAssignee = filterAssignee === 'all' || t.assignee === filterAssignee;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchProj && matchSearch && matchAssignee && matchPriority;
  });

  const toggleChecklist = (taskId, checklistId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          checklists: t.checklists.map(c => c.id === checklistId ? { ...c, completed: !c.completed } : c)
        };
      }
      return t;
    }));
  };

  const updateTaskPriority = (taskId, newPriority) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{isJa ? 'プロジェクト進捗レポート' : 'Báo Cáo Tiến Độ Dự Án Nâng Cao'}</h1>
          <p className="text-xs text-gray-500">Chinguyen Workspace</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => i18n.changeLanguage(isJa ? 'vi' : 'ja')} className="px-3 py-1.5 text-xs font-medium border rounded-lg bg-gray-50">
            🌐 {isJa ? 'JP 日本語' : 'VN Tiếng Việt'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r p-4 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            📊 {isJa ? '総ダッシュボード' : 'Tổng Quan & Tiến Độ'}
          </button>
          <div className="text-xs font-semibold text-gray-400 mt-4 mb-1 uppercase">Dự án</div>
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center ${activeTab === p.id ? 'bg-blue-50 text-blue-600 font-bold' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              <span className="truncate">📁 {getProjName(p)}</span>
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded-full">{tasks.filter(t => t.projectId === p.id).length}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* 1. Thanh tiến độ tổng quan (Overall Progress Bar) */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-bold text-gray-700">🚀 {isJa ? '全体タスク・チェックリスト進捗' : 'Thanh Tiến Độ Tổng Quan Hệ Thống'}</span>
                <span className="text-sm font-bold text-blue-600">{overallProgress}% ({completedChecklists}/{totalChecklists} mục)</span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setViewMode('kanban')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${viewMode === 'kanban' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>Kanban</button>
              <button onClick={() => setViewMode('calendar')} className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${viewMode === 'calendar' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}>📅 Lịch (Calendar)</button>
            </div>
          </div>

          {/* 2. Bộ lọc & Tìm kiếm (Filter & Search) */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center flex-1">
              <input
                type="text"
                placeholder={isJa ? 'タスクを検索...' : '🔍 Tìm kiếm tên task, người thực hiện...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-blue-500"
              />
              <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="border rounded-lg px-3 py-1.5 text-xs bg-white">
                <option value="all">👤 {isJa ? 'すべての担当者' : 'Tất cả nhân sự'}</option>
                <option value="Chi">Chi</option>
              </select>
              <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="border rounded-lg px-3 py-1.5 text-xs bg-white">
                <option value="all">⭐ {isJa ? 'すべての優先度' : 'Tất cả mức ưu tiên'}</option>
                <option value="HIGH">🔥 Cao</option>
                <option value="MEDIUM">⚡ Trung bình</option>
                <option value="LOW">✅ Thấp</option>
              </select>
            </div>
          </div>

          {/* Chế độ hiển thị: Kanban hoặc Lịch */}
          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Cần Làm', 'Đang Làm', 'Đã Xong'].map(status => {
                const colTasks = filteredTasks.filter(t => t.status === status);
                return (
                  <div key={status} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col gap-3">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="font-bold text-sm text-gray-700">{status}</span>
                      <span className="bg-white text-xs px-2 py-0.5 rounded-full border">{colTasks.length}</span>
                    </div>

                    {colTasks.map(task => {
                      const priorityInfo = PRIORITIES[task.priority] || PRIORITIES['MEDIUM'];
                      return (
                        <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm text-gray-800">{getTaskTitle(task)}</h4>
                            <select
                              value={task.priority}
                              onChange={(e) => updateTaskPriority(task.id, e.target.value)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityInfo.bg} ${priorityInfo.color}`}
                            >
                              <option value="HIGH">🔥 Cao</option>
                              <option value="MEDIUM">⚡ Trung</option>
                              <option value="LOW">✅ Thấp</option>
                            </select>
                          </div>

                          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
                            {task.assignee && <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100">👤 {task.assignee}</span>}
                            {task.dueDate && <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100">⏳ {task.dueDate}</span>}
                          </div>

                          {/* Checklists */}
                          <div className="space-y-1 pt-1 border-t border-gray-100">
                            {task.checklists.map(c => (
                              <label key={c.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                <input type="checkbox" checked={c.completed} onChange={() => toggleChecklist(task.id, c.id)} className="w-3.5 h-3.5 rounded text-blue-600" />
                                <span className={c.completed ? 'line-through text-gray-400' : 'text-gray-700'}>{getChecklistText(c)}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800">📅 Lịch biểu công việc theo thời hạn (Deadline)</h3>
              <div className="divide-y">
                {filteredTasks.sort((a,b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')).map(task => (
                  <div key={task.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-gray-800 text-sm block">{getTaskTitle(task)}</span>
                      <span className="text-gray-500">👤 {task.assignee || 'Chưa gán'} | Trạng thái: {task.status}</span>
                    </div>
                    <span className="bg-orange-100 text-orange-800 font-semibold px-2.5 py-1 rounded-lg">⏳ {task.dueDate || 'Không có hạn'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
