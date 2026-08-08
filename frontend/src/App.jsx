import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageShortcut } from './useLanguageShortcut';

async function autoTranslateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const langPair = targetLang === 'ja' ? 'vi|ja' : 'ja|vi';
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (error) {
    console.warn('Translate fallback:', error);
  }
  return text;
}

const PRIORITIES = {
  HIGH: { labelVi: '🔥 Cao', labelJa: '🔥 高', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  MEDIUM: { labelVi: '⚡ Trung bình', labelJa: '⚡ 中', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  LOW: { labelVi: '✅ Thấp', labelJa: '✅ 低', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
};

function MainApp({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  useLanguageShortcut();
  const isJa = i18n.language && i18n.language.startsWith('ja');

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('kanban_projects');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      { id: 'p1', nameVi: 'Khai Trương Cửa Hàng', nameJa: '店舗オープン' },
      { id: 'p2', nameVi: 'Marketing & Quảng Cáo', nameJa: 'マーケティング＆広告' }
    ];
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('kanban_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(t => ({
          ...t,
          priority: t.priority || 'MEDIUM',
          attachments: t.attachments || [] // Đảm bảo luôn có mảng attachments
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
        attachments: [
          { id: 'a1', name: 'Hop_dong_thue_mat_bang.pdf', url: 'https://example.com' }
        ]
      },
      {
        id: 2,
        projectId: 'p1',
        titleVi: 'Xây dựng quy trình SOP',
        titleJa: 'SOPプロセスの構築',
        status: 'Cần Làm',
        priority: 'MEDIUM',
        assignee: 'Chi',
        dueDate: '2026-08-15',
        checklists: [
          { id: 201, textVi: 'Viết quy định phục vụ', textJa: '接客ルールの作成', completed: false }
        ],
        attachments: []
      }
    ];
  });

  useEffect(() => { localStorage.setItem('kanban_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('kanban_tasks', JSON.stringify(tasks)); }, [tasks]);

  const [currentView, setCurrentView] = useState('p1');
  const [newProjectName, setNewProjectName] = useState('');
  const [checklistFilter, setChecklistFilter] = useState('all');
  const [isTranslating, setIsTranslating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newChecklistText, setNewChecklistText] = useState({});

  // State hỗ trợ nhập tài liệu đính kèm cho từng task
  const [newAttName, setNewAttName] = useState({});
  const [newAttUrl, setNewAttUrl] = useState({});

  // Các state cho tính năng mới (Lọc & Chế độ hiển thị)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' hoặc 'calendar'

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi';
    i18n.changeLanguage(currentLang.startsWith('vi') ? 'ja' : 'vi');
  };

  const getProjName = (p) => isJa ? (p.nameJa || p.nameVi) : (p.nameVi || p.nameJa);
  const getTaskTitle = (task) => isJa ? (task.titleJa || task.titleVi) : (task.titleVi || task.titleJa);
  const getChecklistText = (item) => isJa ? (item.textJa || item.textVi) : (item.textVi || item.textJa);

  const handleDeleteProject = (projectId, e) => {
    if (e) { e.stopPropagation(); e.preventDefault(); }
    const targetProj = projects.find(p => p.id === projectId);
    const projName = targetProj ? getProjName(targetProj) : '';
    if (window.confirm(isJa ? `「${projName}」を削除しますか？` : `Xóa dự án "${projName}"?`)) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.projectId !== projectId));
      if (currentView === projectId) setCurrentView('overview');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsTranslating(true);
    const textInput = newProjectName.trim();
    let nameVi = textInput, nameJa = textInput;
    try {
      if (isJa) nameVi = await autoTranslateText(textInput, 'vi');
      else nameJa = await autoTranslateText(textInput, 'ja');
    } finally {
      const newProj = { id: 'p_' + Date.now(), nameVi, nameJa };
      setProjects(prev => [...prev, newProj]);
      setCurrentView(newProj.id);
      setNewProjectName('');
      setIsTranslating(false);
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsTranslating(true);
    const textInput = newTaskTitle.trim();
    let titleVi = textInput, titleJa = textInput;
    try {
      if (isJa) titleVi = await autoTranslateText(textInput, 'vi');
      else nameJa = await autoTranslateText(textInput, 'ja');
    } finally {
      const newTask = {
        id: Date.now(),
        projectId: currentView,
        titleVi,
        titleJa,
        status: 'Cần Làm',
        priority: newTaskPriority,
        assignee: newTaskAssignee.trim() || user,
        dueDate: newTaskDueDate || '',
        checklists: [],
        attachments: []
      };
      setTasks(prev => [...prev, newTask]);
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskDueDate('');
      setNewTaskPriority('MEDIUM');
      setIsTranslating(false);
    }
  };

  const handleAddChecklist = async (taskId, e) => {
    e.preventDefault();
    const text = newChecklistText[taskId];
    if (!text || !text.trim()) return;
    setIsTranslating(true);
    const textInput = text.trim();
    let textVi = textInput, textJa = textInput;
    try {
      if (isJa) textVi = await autoTranslateText(textInput, 'vi');
      else nameJa = await autoTranslateText(textInput, 'ja');
    } finally {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return { ...t, checklists: [...t.checklists, { id: Date.now(), textVi, textJa, completed: false }] };
        }
        return t;
      }));
      setNewChecklistText(prev => ({ ...prev, [taskId]: '' }));
      setIsTranslating(false);
    }
  };

  // Hàm xử lý thêm tài liệu đính kèm vào Task
  const handleAddAttachment = (taskId, e) => {
    e.preventDefault();
    const name = newAttName[taskId];
    const url = newAttUrl[taskId];
    if (!name || !name.trim() || !url || !url.trim()) return;

    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newAtt = { id: 'att_' + Date.now(), name: name.trim(), url: url.trim() };
        return { ...t, attachments: [...(t.attachments || []), newAtt] };
      }
      return t;
    }));

    setNewAttName(prev => ({ ...prev, [taskId]: '' }));
    setNewAttUrl(prev => ({ ...prev, [taskId]: '' }));
  };

  // Hàm xóa tài liệu đính kèm khỏi Task
  const handleDeleteAttachment = (taskId, attId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, attachments: t.attachments.filter(a => a.id !== attId) };
      }
      return t;
    }));
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handlePriorityChange = (taskId, newPriority) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, priority: newPriority } : t));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const toggleChecklist = (taskId, itemId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          checklists: t.checklists.map(c => c.id === itemId ? { ...c, completed: !c.completed } : c)
        };
      }
      return t;
    }));
  };

  const deleteChecklistItem = (taskId, itemId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, checklists: t.checklists.filter(c => c.id !== itemId) };
      }
      return t;
    }));
  };

  const allChecklistItems = tasks.flatMap(task => {
    const proj = projects.find(p => p.id === task.projectId);
    return task.checklists.map(c => ({
      ...c,
      taskId: task.id,
      taskTitle: getTaskTitle(task),
      projectName: proj ? getProjName(proj) : (isJa ? '未分類' : 'Chưa phân loại')
    }));
  });

  const filteredChecklist = allChecklistItems.filter(item => {
    if (checklistFilter === 'pending') return !item.completed;
    if (checklistFilter === 'completed') return item.completed;
    return true;
  });

  const totalChecklistsCount = tasks.reduce((acc, t) => acc + t.checklists.length, 0);
  const completedChecklistsCount = tasks.reduce((acc, t) => acc + t.checklists.filter(c => c.completed).length, 0);
  const overallProgress = totalChecklistsCount > 0 ? Math.round((completedChecklistsCount / totalChecklistsCount) * 100) : 0;

  const currentProjectObj = projects.find(p => p.id === currentView);
  const currentProjectTasks = tasks.filter(t => t.projectId === currentView);
  
  const filteredTasks = currentProjectTasks.filter(t => {
    const title = getTaskTitle(t).toLowerCase();
    const assigneeName = (t.assignee || '').toLowerCase();
    const matchSearch = title.includes(searchTerm.toLowerCase()) || assigneeName.includes(searchTerm.toLowerCase());
    const matchAssignee = filterAssignee === 'all' || t.assignee === filterAssignee;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchSearch && matchAssignee && matchPriority;
  });

  const uniqueAssignees = Array.from(new Set(tasks.map(t => t.assignee).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans relative">
      {isTranslating && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          ⚡ {isJa ? '自動翻訳中...' : 'Đang tự động dịch...'}
        </div>
      )}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isJa ? 'プロジェクト進捗レポート' : 'Báo Cáo Tiến Độ Dự Án'}</h1>
          <p className="text-sm text-gray-500">{isJa ? 'タスク追跡システム＆チェックリスト総合' : 'Hệ thống theo dõi công việc nâng cao'}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">👤 {user}</span>
          <button onClick={onLogout} className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-semibold">Đăng xuất</button>
          <button onClick={toggleLanguage} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 shadow-sm">
            🌐 {isJa ? 'JP 日本語' : 'VN Tiếng Việt'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
          <button
            onClick={() => setCurrentView('overview')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold mb-4 flex items-center gap-2 ${
              currentView === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 {isJa ? 'ダッシュボード' : 'Trang Tổng Hợp'}
          </button>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{isJa ? 'プロジェクト一覧' : 'DANH MỤC DỰ ÁN'}</h2>
          
          <div className="flex-1 overflow-y-auto space-y-1">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => setCurrentView(p.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex justify-between items-center cursor-pointer ${
                  currentView === p.id ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="truncate pr-1">📁 {getProjName(p)}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {tasks.filter(t => t.projectId === p.id).length}
                  </span>
                  <button onClick={(e) => handleDeleteProject(p.id, e)} className="text-red-400 hover:text-red-600 p-1 text-xs">🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddProject} className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder={isJa ? '+ フォルダを追加...' : '+ Thêm danh mục...'}
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={isTranslating} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg">{isJa ? '追加' : 'Thêm'}</button>
          </form>
        </aside>

        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {currentView === 'overview' ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">📊 {isJa ? '全体レポート概要' : 'Báo Cáo Tổng Quan'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{isJa ? '総プロジェクト数' : 'Tổng số dự án'}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{projects.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{isJa ? '総タスク数' : 'Tổng số Task'}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{tasks.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{isJa ? '総チェックリスト数' : 'Tổng mục nhỏ'}</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{allChecklistItems.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{isJa ? '全体の進捗率' : 'Tiến độ chung (Checklist)'}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{overallProgress}%</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">🚀 {isJa ? '全体チェックリスト進捗バー' : 'Thanh Tiến Độ Tổng Quan Toàn Bộ Dự Án'}</span>
                  <span className="text-sm font-bold text-blue-600">{completedChecklistsCount} / {totalChecklistsCount} {isJa ? '完了' : 'mục hoàn thành'} ({overallProgress}%)</span>
                </div>
                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800">📋 {isJa ? '全チェックリスト一覧' : 'Bảng Tổng Hợp Checklist'}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setChecklistFilter('all')} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${checklistFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{isJa ? 'すべて' : 'Tất cả'}</button>
                    <button onClick={() => setChecklistFilter('pending')} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${checklistFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{isJa ? '未完了' : 'Chưa xong'}</button>
                    <button onClick={() => setChecklistFilter('completed')} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${checklistFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>{isJa ? '完了済み' : 'Đã xong'}</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                        <th className="p-3 w-10">{isJa ? '状態' : 'Trạng thái'}</th>
                        <th className="p-3">{isJa ? '項目内容' : 'Nội dung'}</th>
                        <th className="p-3">{isJa ? 'タスク名' : 'Tên Task'}</th>
                        <th className="p-3">{isJa ? '所属フォルダ' : 'Dự án'}</th>
                        <th className="p-3 text-right">{isJa ? '操作' : 'Thao tác'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredChecklist.map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="p-3"><input type="checkbox" checked={item.completed} onChange={() => toggleChecklist(item.taskId, item.id)} className="w-4 h-4 cursor-pointer" /></td>
                          <td className={`p-3 font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>{getChecklistText(item)}</td>
                          <td className="p-3 text-gray-600 font-medium">{item.taskTitle}</td>
                          <td className="p-3"><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">📁 {item.projectName}</span></td>
                          <td className="p-3 text-right"><button onClick={() => deleteChecklistItem(item.taskId, item.id)} className="text-red-400 hover:text-red-600">{isJa ? '削除' : 'Xóa'}</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const projChecklists = currentProjectTasks.flatMap(t => t.checklists);
                const projTotal = projChecklists.length;
                const projCompleted = projChecklists.filter(c => c.completed).length;
                const projPercent = projTotal > 0 ? Math.round((projCompleted / projTotal) * 100) : 0;
                return (
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-700">📌 {isJa ? 'このプロジェクトの進捗' : 'Tiến độ dự án hiện tại'}</span>
                        <span className="text-xs font-bold text-blue-600">{projCompleted}/{projTotal} mục ({projPercent}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${projPercent}%` }}></div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setViewMode('kanban')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${viewMode === 'kanban' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        Kanban View
                      </button>
                      <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${viewMode === 'calendar' ? 'bg-gray-800 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        📅 {isJa ? 'カレンダー' : 'Lịch (Calendar)'}
                      </button>
                    </div>
                  </div>
                );
              })()}

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h3 className="text-sm font-bold text-gray-800">✨ {isJa ? '新しいタスクを追加' : 'Thêm Công Việc Mới'}</h3>
                <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <input type="text" placeholder={isJa ? 'タスク名を入力...' : 'Nhập tên công việc...'} value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 md:col-span-2" required />
                  <input type="text" placeholder={isJa ? '担当者' : 'Người phụ trách'} value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
                  <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600" />
                  <div className="flex gap-2">
                    <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="border border-gray-300 rounded-lg px-2 py-2 text-xs bg-white text-gray-700 font-semibold flex-1">
                      <option value="HIGH">🔥 Cao</option>
                      <option value="MEDIUM">⚡ Trung bình</option>
                      <option value="LOW">✅ Thấp</option>
                    </select>
                    <button type="submit" disabled={isTranslating} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shrink-0">{isJa ? '追加' : 'Tạo'}</button>
                  </div>
                </form>
              </div>

              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3 justify-between">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <input
                    type="text"
                    placeholder={isJa ? 'タスクを検索...' : '🔍 Tìm kiếm tên task, nhân sự...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-64 focus:outline-none focus:border-blue-500"
                  />
                  <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700">
                    <option value="all">👤 {isJa ? 'すべての担当者' : 'Tất cả nhân sự'}</option>
                    {uniqueAssignees.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700">
                    <option value="all">⭐ {isJa ? 'すべての優先度' : 'Tất cả mức ưu tiên'}</option>
                    <option value="HIGH">🔥 Cao</option>
                    <option value="MEDIUM">⚡ Trung bình</option>
                    <option value="LOW">✅ Thấp</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">📁 {currentProjectObj ? getProjName(currentProjectObj) : ''}</h2>
                {currentProjectObj && (
                  <button onClick={(e) => handleDeleteProject(currentProjectObj.id, e)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs px-3 py-1.5 rounded-lg font-semibold">
                    🗑️ {isJa ? 'このプロジェクトを削除' : 'Xóa dự án này'}
                  </button>
                )}
              </div>

              {viewMode === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 align-top">
                  {[
                    { id: 'Cần Làm', labelVi: 'Cần Làm', labelJa: '未着手', icon: '🟡' },
                    { id: 'Đang Làm', labelVi: 'Đang Làm', labelJa: '進行中', icon: '🔵' },
                    { id: 'Đã Xong', labelVi: 'Đã Xong', labelJa: '完了', icon: '🟢' }
                  ].map(col => {
                    const statusTasks = filteredTasks.filter(t => t.status === col.id);
                    return (
                      <div key={col.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col gap-3">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                          <span className="font-semibold text-gray-700 text-sm">{col.icon} {isJa ? col.labelJa : col.labelVi}</span>
                          <span className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200">{statusTasks.length}</span>
                        </div>
                        {statusTasks.map(task => {
                          const totalItems = task.checklists.length;
                          const completedItems = task.checklists.filter(c => c.completed).length;
                          const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                          const priorityInfo = PRIORITIES[task.priority] || PRIORITIES['MEDIUM'];
                          return (
                            <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-semibold text-gray-800 text-sm leading-snug">{getTaskTitle(task)}</h3>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
                              </div>
                              <div className="flex flex-wrap gap-1.5 text-xs items-center justify-between">
                                <div className="flex flex-wrap gap-1.5">
                                  {task.assignee && <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md font-medium">👤 {task.assignee}</span>}
                                  {task.dueDate && <span className="bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-md font-medium">⏳ {task.dueDate}</span>}
                                </div>
                                <select
                                  value={task.priority || 'MEDIUM'}
                                  onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${priorityInfo.bg} ${priorityInfo.color} ${priorityInfo.border}`}
                                >
                                  <option value="HIGH">🔥 Cao</option>
                                  <option value="MEDIUM">⚡ Trung</option>
                                  <option value="LOW">✅ Thấp</option>
                                </select>
                              </div>

                              {totalItems > 0 && (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{isJa ? '進捗' : 'Tiến độ'}</span>
                                    <span>{completedItems}/{totalItems} ({progressPercent}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }}></div>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-1.5 pt-1">
                                {task.checklists.map(item => (
                                  <div key={item.id} className="flex items-center justify-between text-xs group">
                                    <label className="flex items-center gap-2 cursor-pointer flex-1 pr-2">
                                      <input type="checkbox" checked={item.completed} onChange={() => toggleChecklist(task.id, item.id)} className="rounded text-blue-600 w-3.5 h-3.5" />
                                      <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>{getChecklistText(item)}</span>
                                    </label>
                                    <button onClick={() => deleteChecklistItem(task.id, item.id)} className="text-gray-300 hover:text-red-500 hidden group-hover:block">✕</button>
                                  </div>
                                ))}
                              </div>

                              <form onSubmit={(e) => handleAddChecklist(task.id, e)} className="flex gap-1 pt-1">
                                <input type="text" placeholder={isJa ? '+ 追加...' : '+ Thêm mục con...'} value={newChecklistText[task.id] || ''} onChange={(e) => setNewChecklistText({ ...newChecklistText, [task.id]: e.target.value })} className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none" />
                                <button type="submit" disabled={isTranslating} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded font-medium">{isJa ? '追加' : 'Thêm'}</button>
                              </form>

                              {/* 👉 KHU VỰC TÀI LIỆU VÀ FILE ĐÍNH KÈM TRONG MỖI TASK */}
                              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                                <p className="text-[11px] font-bold text-gray-600">📎 {isJa ? '添付資料' : 'Tài liệu / File đính kèm'}</p>
                                {task.attachments && task.attachments.length > 0 ? (
                                  <div className="space-y-1">
                                    {task.attachments.map(att => (
                                      <div key={att.id} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 group">
                                        <a href={att.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate pr-2 max-w-[170px]" title={att.name}>
                                          📄 {att.name}
                                        </a>
                                        <button onClick={() => handleDeleteAttachment(task.id, att.id)} className="text-gray-400 hover:text-red-500 text-[10px]">✕</button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-400 italic">{isJa ? '資料なし' : 'Chưa có file nào'}</p>
                                )}

                                <form onSubmit={(e) => handleAddAttachment(task.id, e)} className="space-y-1 pt-1">
                                  <input 
                                    type="text" 
                                    placeholder={isJa ? '資料名 (例: 契約書)' : 'Tên tài liệu (VD: Hợp đồng)'} 
                                    value={newAttName[task.id] || ''} 
                                    onChange={(e) => setNewAttName({ ...newAttName, [task.id]: e.target.value })} 
                                    className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none" 
                                  />
                                  <div className="flex gap-1">
                                    <input 
                                      type="text" 
                                      placeholder="URL (https://...)" 
                                      value={newAttUrl[task.id] || ''} 
                                      onChange={(e) => setNewAttUrl({ ...newAttUrl, [task.id]: e.target.value })} 
                                      className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none" 
                                    />
                                    <button type="submit" className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] px-2 py-1 rounded font-medium shrink-0">+</button>
                                  </div>
                                </form>
                              </div>

                              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[11px] text-gray-400">{isJa ? 'ステータス' : 'Trạng thái'}</span>
                                <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1 bg-white text-gray-700 font-medium">
                                  <option value="Cần Làm">{isJa ? '未着手' : 'Cần Làm'}</option>
                                  <option value="Đang Làm">{isJa ? '進行中' : 'Đang Làm'}</option>
                                  <option value="Đã Xong">{isJa ? '完了' : 'Đã Xong'}</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                  <h3 className="font-bold text-gray-800 text-base">📅 {isJa ? '期限別カレンダーリスト' : 'Lịch Biểu Sắp Xếp Theo Hạn Chót (Deadline)'}</h3>
                  <div className="divide-y divide-gray-100">
                    {filteredTasks.sort((a, b) => new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')).map(task => {
                      const priorityInfo = PRIORITIES[task.priority] || PRIORITIES['MEDIUM'];
                      return (
                        <div key={task.id} className="py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800 text-sm">{getTaskTitle(task)}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priorityInfo.bg} ${priorityInfo.color} ${priorityInfo.border}`}>{priorityInfo.labelVi}</span>
                            </div>
                            <p className="text-gray-500">👤 {task.assignee || 'Chưa gán'} | Trạng thái: <span className="font-semibold text-gray-700">{task.status}</span></p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="bg-orange-50 text-orange-700 border border-orange-200 font-semibold px-3 py-1 rounded-lg">⏳ {task.dueDate || (isJa ? '期限なし' : 'Không có hạn chót')}</span>
                          </div>
                        </div>
                      );
                    })}
                    {filteredTasks.length === 0 && (
                      <p className="text-center text-gray-400 py-6 text-sm">{isJa ? 'タスクがありません' : 'Không có công việc nào phù hợp với bộ lọc.'}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [user] = useState("Chi");
  const handleLogout = () => {};
  return <MainApp user={user} onLogout={handleLogout} />;
}
