import React, { useState, useEffect, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageShortcut } from './useLanguageShortcut';

// Thay bằng URL Backend Render của bạn sau khi deploy
const API_URL = 'https://kanban-backend-xxxx.onrender.com/api';

// Helper dịch có Timeout (không lo đơ app nếu API lỗi)
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
    console.warn('Tự động dịch bỏ qua/lỗi timeout, dùng chuỗi gốc:', error);
  }
  return text;
}

// -------------------------------------------------------------
// FORM ĐĂNG NHẬP / ĐĂNG KÝ
// -------------------------------------------------------------
function AuthForm({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const endpoint = isRegister ? '/register' : '/login';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Có lỗi xảy ra');

      if (isRegister) {
        setMessage('Đăng ký thành công! Hãy đăng nhập.');
        setIsRegister(false);
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        onLoginSuccess(data.username);
      }
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          {isRegister ? '📝 Đăng ký Tài khoản' : '🔑 Đăng nhập Kanban'}
        </h2>
        {message && (
          <div className={`p-3 rounded-lg text-xs font-semibold mb-4 text-center ${
            message.includes('thành công') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tên tài khoản</label>
            <input 
              type="text" 
              required
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Nhập username"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mật khẩu</label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm"
          >
            {isRegister ? 'Tạo Tài Khoản' : 'Đăng Nhập'}
          </button>
        </form>
        <p 
          onClick={() => setIsRegister(!isRegister)} 
          className="mt-4 text-center text-xs text-blue-600 hover:underline cursor-pointer font-medium"
        >
          {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký ngay'}
        </p>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// GIAO DIỆN CHÍNH KANBAN APP
// -------------------------------------------------------------
function MainApp({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  useLanguageShortcut();

  const isJa = i18n.language && i18n.language.startsWith('ja');

  // 1. ĐỌC DỮ LIỆU TỪ LOCALSTORAGE KHI MỞ TRANG
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
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [
      {
        id: 1,
        projectId: 'p1',
        titleVi: 'Thuê mặt bằng & Thi công',
        titleJa: '物件契約＆施工',
        status: 'Đang Làm',
        checklists: [
          { id: 101, textVi: 'Ký hợp đồng thuê', textJa: '賃貸契約締結', completed: true },
          { id: 102, textVi: 'Thiết kế biển bảng', textJa: '看板デザイン', completed: true },
          { id: 103, textVi: 'Sơn sửa lại cửa hàng', textJa: '店舗内装・塗装', completed: true }
        ]
      },
      {
        id: 2,
        projectId: 'p1',
        titleVi: 'Tuyển dụng nhân sự',
        titleJa: '採用・人材募集',
        status: 'Cần Làm',
        checklists: [
          { id: 201, textVi: 'Đăng tin tuyển dụng', textJa: '求人情報掲載', completed: true },
          { id: 202, textVi: 'Phỏng vấn thu ngân', textJa: 'レジ担当面接', completed: false }
        ]
      }
    ];
  });

  // 2. TỰ ĐỘNG LƯU VÀO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem('kanban_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const [currentView, setCurrentView] = useState('p1');
  const [newProjectName, setNewProjectName] = useState('');
  const [checklistFilter, setChecklistFilter] = useState('all');
  const [isTranslating, setIsTranslating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newChecklistText, setNewChecklistText] = useState({});

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi';
    const nextLang = currentLang.startsWith('vi') ? 'ja' : 'vi';
    i18n.changeLanguage(nextLang);
  };

  const getProjName = (p) => isJa ? (p.nameJa || p.nameVi) : (p.nameVi || p.nameJa);
  const getTaskTitle = (task) => isJa ? (task.titleJa || task.titleVi) : (task.titleVi || task.titleJa);
  const getChecklistText = (item) => isJa ? (item.textJa || item.textVi) : (item.textVi || item.textJa);

  const handleDeleteProject = (projectId, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const targetProj = projects.find(p => p.id === projectId);
    const projName = targetProj ? getProjName(targetProj) : '';
    
    const confirmMsg = isJa 
      ? `「${projName}」を削除してもよろしいですか？` 
      : `Bạn có chắc muốn xóa dự án "${projName}" cùng toàn bộ task bên trong?`;

    if (window.confirm(confirmMsg)) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.projectId !== projectId));
      if (currentView === projectId) {
        setCurrentView('overview');
      }
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsTranslating(true);
    const textInput = newProjectName.trim();
    let nameVi = textInput;
    let nameJa = textInput;

    try {
      if (isJa) {
        nameVi = await autoTranslateText(textInput, 'vi');
      } else {
        nameJa = await autoTranslateText(textInput, 'ja');
      }
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
    let titleVi = textInput;
    let titleJa = textInput;

    try {
      if (isJa) {
        titleVi = await autoTranslateText(textInput, 'vi');
      } else {
        titleJa = await autoTranslateText(textInput, 'ja');
      }
    } finally {
      const newTask = {
        id: Date.now(),
        projectId: currentView,
        titleVi,
        titleJa,
        status: 'Cần Làm',
        checklists: []
      };
      setTasks(prev => [...prev, newTask]);
      setNewTaskTitle('');
      setIsTranslating(false);
    }
  };

  const handleAddChecklist = async (taskId, e) => {
    e.preventDefault();
    const text = newChecklistText[taskId];
    if (!text || !text.trim()) return;

    setIsTranslating(true);
    const textInput = text.trim();
    let textVi = textInput;
    let textJa = textInput;

    try {
      if (isJa) {
        textVi = await autoTranslateText(textInput, 'vi');
      } else {
        textJa = await autoTranslateText(textInput, 'ja');
      }
    } finally {
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            checklists: [...t.checklists, { id: Date.now(), textVi, textJa, completed: false }]
          };
        }
        return t;
      }));
      setNewChecklistText(prev => ({ ...prev, [taskId]: '' }));
      setIsTranslating(false);
    }
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
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
        return {
          ...t,
          checklists: t.checklists.filter(c => c.id !== itemId)
        };
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

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Đã Xong').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const currentProjectObj = projects.find(p => p.id === currentView);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans relative">
      {/* Indicator đang dịch */}
      {isTranslating && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          ⚡ {isJa ? '自動翻訳中...' : 'Đang tự động dịch...'}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isJa ? 'プロジェクト進捗レポート' : 'Báo Cáo Tiến Độ Dự Án'}</h1>
          <p className="text-sm text-gray-500">{isJa ? 'タスク追跡システム＆チェックリスト総合' : 'Hệ thống theo dõi công việc & Bảng tổng hợp Checklist'}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg">
            👤 {user}
          </span>
          <button
            onClick={onLogout}
            className="text-xs text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
          >
            Đăng xuất
          </button>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-colors"
          >
            🌐 {isJa ? 'JP 日本語' : 'VN Tiếng Việt'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
          <button
            onClick={() => setCurrentView('overview')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold mb-4 flex items-center gap-2 transition-colors ${
              currentView === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 {isJa ? 'ダッシュボード' : 'Trang Tổng Hợp'}
          </button>

          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {isJa ? 'プロジェクト一覧' : 'DANH MỤC DỰ ÁN'}
          </h2>

          <div className="flex-1 overflow-y-auto space-y-1">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => setCurrentView(p.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center cursor-pointer ${
                  currentView === p.id 
                    ? 'bg-blue-50 text-blue-600 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="truncate pr-1">📁 {getProjName(p)}</span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {tasks.filter(t => t.projectId === p.id).length}
                  </span>
                  <button
                    onClick={(e) => handleDeleteProject(p.id, e)}
                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded text-xs transition-colors"
                    title={isJa ? '削除' : 'Xóa dự án này'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <p className="text-xs text-gray-400 italic p-2 text-center">{isJa ? 'プロジェクトがありません' : 'Chưa có dự án nào'}</p>
            )}
          </div>

          <form onSubmit={handleAddProject} className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder={isJa ? '+ フォルダを追加...' : '+ Thêm danh mục...'}
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={isTranslating} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {isJa ? '追加' : 'Thêm'}
            </button>
          </form>
        </aside>

        {/* Main Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {currentView === 'overview' ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">📊 {isJa ? '全体レポート概要' : 'Báo Cáo Tổng Quan'}</h2>

              {/* Cards Thống kê */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{isJa ? '総プロジェクト数' : 'Tổng số dự án'}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{projects.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{isJa ? '総タスク数' : 'Tổng số Task'}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{totalTasks}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{isJa ? '総チェックリスト数' : 'Tổng mục nhỏ'}</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{allChecklistItems.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{isJa ? '全体の進捗率' : 'Tiến độ chung'}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{overallProgress}%</p>
                </div>
              </div>

              {/* Bảng Checklist */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    📋 {isJa ? '全チェックリスト一覧' : 'Bảng Tổng Hợp Checklist'}
                  </h3>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setChecklistFilter('all')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        checklistFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isJa ? 'すべて' : 'Tất cả'} ({allChecklistItems.length})
                    </button>
                    <button
                      onClick={() => setChecklistFilter('pending')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        checklistFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isJa ? '未完了' : 'Chưa xong'} ({allChecklistItems.filter(i => !i.completed).length})
                    </button>
                    <button
                      onClick={() => setChecklistFilter('completed')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        checklistFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isJa ? '完了済み' : 'Đã xong'} ({allChecklistItems.filter(i => i.completed).length})
                    </button>
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
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => toggleChecklist(item.taskId, item.id)}
                              className="rounded text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer"
                            />
                          </td>
                          <td className={`p-3 font-medium ${item.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {getChecklistText(item)}
                          </td>
                          <td className="p-3 text-gray-600 font-medium">{item.taskTitle}</td>
                          <td className="p-3">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                              📁 {item.projectName}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => deleteChecklistItem(item.taskId, item.id)}
                              className="text-red-400 hover:text-red-600 font-medium"
                            >
                              {isJa ? '削除' : 'Xóa'}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredChecklist.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-400 italic">
                            {isJa ? 'チェックリストはありません' : 'Không có mục checklist nào'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Danh sách Thư mục Overview */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800">📁 {isJa ? 'プロジェクト詳細' : 'Danh sách Dự Án Chi Tiết'}</h3>
                {projects.map(project => {
                  const projectTasks = tasks.filter(t => t.projectId === project.id);
                  const pTotal = projectTasks.length;
                  const pDone = projectTasks.filter(t => t.status === 'Đã Xong').length;
                  const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

                  return (
                    <div key={project.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex justify-between items-center">
                      <div>
                        <h4 
                          onClick={() => setCurrentView(project.id)}
                          className="font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          📁 {getProjName(project)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {isJa ? 'タスク数' : 'Tổng task'}: {pTotal} | {isJa ? '完了' : 'Đã xong'}: {pDone}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-600">{pPercent}%</span>
                        <button 
                          onClick={() => setCurrentView(project.id)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium"
                        >
                          {isJa ? '開く' : 'Mở Kanban'}
                        </button>
                        <button 
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium border border-red-200"
                        >
                          🗑️ {isJa ? '削除' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW DỰ ÁN CHI TIẾT (KANBAN) */
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    📁 {currentProjectObj ? getProjName(currentProjectObj) : (isJa ? 'プロジェクト' : 'Dự Án')}
                  </h2>

                  {currentProjectObj && (
                    <button
                      onClick={(e) => handleDeleteProject(currentProjectObj.id, e)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors shadow-sm cursor-pointer"
                    >
                      🗑️ {isJa ? 'このプロジェクトを削除' : 'Xóa dự án này'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={isJa ? '新しいタスクを入力...' : 'Nhập tên công việc mới...'}
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64 shadow-sm"
                  />
                  <button type="submit" disabled={isTranslating} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm disabled:opacity-50">
                    {isJa ? '+ 新しいタスクを作成' : '+ Tạo Task Mới'}
                  </button>
                </form>
              </div>

              {/* BẢNG KANBAN 3 CỘT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 align-top">
                {[
                  { id: 'Cần Làm', labelVi: 'Cần Làm', labelJa: '未着手', icon: '🟡' },
                  { id: 'Đang Làm', labelVi: 'Đang Làm', labelJa: '進行中', icon: '🔵' },
                  { id: 'Đã Xong', labelVi: 'Đã Xong', labelJa: '完了', icon: '🟢' }
                ].map(col => {
                  const statusTasks = tasks.filter(t => t.projectId === currentView && t.status === col.id);

                  return (
                    <div key={col.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                          {col.icon} {isJa ? col.labelJa : col.labelVi}
                        </span>
                        <span className="bg-white text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium border border-gray-200 shadow-sm">
                          {statusTasks.length}
                        </span>
                      </div>

                      {statusTasks.map(task => {
                        const totalItems = task.checklists.length;
                        const completedItems = task.checklists.filter(c => c.completed).length;
                        const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

                        return (
                          <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                              <h3 className="font-semibold text-gray-800 text-sm">{getTaskTitle(task)}</h3>
                              <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-red-400 hover:text-red-600">
                                {isJa ? '削除' : 'Xóa'}
                              </button>
                            </div>

                            {totalItems > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>{isJa ? 'チェックリスト進捗' : 'Tiến độ Checklist'}</span>
                                  <span>{completedItems}/{totalItems} ({progressPercent}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-300 ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                    style={{ width: `${progressPercent}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            <div className="space-y-1.5 pt-1">
                              {task.checklists.map(item => (
                                <div key={item.id} className="flex items-center justify-between text-xs group">
                                  <label className="flex items-center gap-2 cursor-pointer flex-1 pr-2">
                                    <input
                                      type="checkbox"
                                      checked={item.completed}
                                      onChange={() => toggleChecklist(task.id, item.id)}
                                      className="rounded text-blue-600 focus:ring-0 w-3.5 h-3.5"
                                    />
                                    <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                                      {getChecklistText(item)}
                                    </span>
                                  </label>
                                  <button 
                                    onClick={() => deleteChecklistItem(task.id, item.id)}
                                    className="text-gray-300 hover:text-red-500 hidden group-hover:block"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>

                            {/* Form thêm mục con checklist hoàn chỉnh */}
                            <form onSubmit={(e) => handleAddChecklist(task.id, e)} className="flex gap-1 pt-1">
                              <input
                                type="text"
                                placeholder={isJa ? '+ サブ項目を追加...' : '+ Thêm mục con...'}
                                value={newChecklistText[task.id] || ''}
                                onChange={(e) => setNewChecklistText({ ...newChecklistText, [task.id]: e.target.value })}
                                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                              />
                              <button type="submit" disabled={isTranslating} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded font-medium disabled:opacity-50">
                                {isJa ? '追加' : 'Thêm'}
                              </button>
                            </form>

                            {/* Thay đổi trạng thái Task */}
                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[11px] text-gray-400">{isJa ? 'ステータス' : 'Trạng thái'}</span>
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white focus:outline-none text-gray-700 font-medium"
                              >
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// MAIN COMPONENT ROOT
// -------------------------------------------------------------
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    if (token && username) {
      setUser(username);
    }
  }, []);

  const handleLoginSuccess = (username) => {
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };

  if (!user) {
    return <AuthForm onLoginSuccess={handleLoginSuccess} />;
  }

  return <MainApp user={user} onLogout={handleLogout} />;
}
