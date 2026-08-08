import React, { useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageShortcut } from './useLanguageShortcut';

// Hàm helper tự động dịch bằng MyMemory Translate API miễn phí
async function autoTranslateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  try {
    const langPair = targetLang === 'ja' ? 'vi|ja' : 'ja|vi';
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
    );
    const data = await res.json();
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
  } catch (error) {
    console.error('Lỗi tự động dịch:', error);
  }
  return text;
}

function MainApp() {
  const { t, i18n } = useTranslation();
  useLanguageShortcut();

  const isJa = i18n.language && i18n.language.startsWith('ja');

  // Danh sách dự án (Có thể xóa toàn bộ)
  const [projects, setProjects] = useState([
    { id: 'p1', nameVi: 'Khai Trương Cửa Hàng', nameJa: '店舗オープン' },
    { id: 'p2', nameVi: 'Marketing & Quảng Cáo', nameJa: 'マーケティング＆広告' }
  ]);

  const [currentView, setCurrentView] = useState('overview');
  const [newProjectName, setNewProjectName] = useState('');
  const [checklistFilter, setChecklistFilter] = useState('all');
  const [isTranslating, setIsTranslating] = useState(false);

  // Danh sách Task mẫu
  const [tasks, setTasks] = useState([
    {
      id: 1,
      projectId: 'p1',
      titleVi: 'Thuê mặt bằng & Thi công',
      titleJa: '物件契約＆施工',
      status: 'Đang Làm',
      checklists: [
        { id: 101, textVi: 'Ký hợp đồng thuê', textJa: '賃貸契約締結', completed: true },
        { id: 102, textVi: 'Thiết kế biển bảng', textJa: '看板デザイン', completed: false },
        { id: 103, textVi: 'Sơn sửa lại cửa hàng', textJa: '店舗内装・塗装', completed: false }
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
    },
    {
      id: 3,
      projectId: 'p2',
      titleVi: 'Chạy quảng cáo Facebook',
      titleJa: 'Facebook広告運用',
      status: 'Đang Làm',
      checklists: [
        { id: 301, textVi: 'Tạo Fanpage', textJa: 'Fanpage作成', completed: true },
        { id: 302, textVi: 'Nạp ngân sách QC', textJa: '広告予算チャージ', completed: false }
      ]
    }
  ]);

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

  // XÓA DỰ ÁN (Xóa triệt để khỏi State và chọn lại trang Tổng Quan)
  const handleDeleteProject = (projectId, e) => {
    if (e) {
      e.stopPropagation(); // Chống kích hoạt sự kiện click chọn dự án khi bấm nút xóa
      e.preventDefault();
    }
    
    const confirmMsg = isJa 
      ? 'このプロジェクトと全てのタスクを削除しますか？' 
      : 'Bạn có chắc chắn muốn xóa dự án này cùng tất cả công việc liên quan?';

    if (window.confirm(confirmMsg)) {
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      setTasks(prevTasks => prevTasks.filter(t => t.projectId !== projectId));
      if (currentView === projectId) {
        setCurrentView('overview');
      }
    }
  };

  // THÊM DỰ ÁN MỚI
  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsTranslating(true);
    const textInput = newProjectName.trim();
    let nameVi = textInput;
    let nameJa = textInput;

    if (isJa) {
      nameVi = await autoTranslateText(textInput, 'vi');
    } else {
      nameJa = await autoTranslateText(textInput, 'ja');
    }

    const newProj = { id: 'p_' + Date.now(), nameVi, nameJa };
    setProjects(prev => [...prev, newProj]);
    setCurrentView(newProj.id);
    setNewProjectName('');
    setIsTranslating(false);
  };

  // THÊM TASK MỚI
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsTranslating(true);
    const textInput = newTaskTitle.trim();
    let titleVi = textInput;
    let titleJa = textInput;

    if (isJa) {
      titleVi = await autoTranslateText(textInput, 'vi');
    } else {
      titleJa = await autoTranslateText(textInput, 'ja');
    }

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
  };

  // THÊM CHECKLIST MỚI
  const handleAddChecklist = async (taskId, e) => {
    e.preventDefault();
    const text = newChecklistText[taskId];
    if (!text || !text.trim()) return;

    setIsTranslating(true);
    const textInput = text.trim();
    let textVi = textInput;
    let textJa = textInput;

    if (isJa) {
      textVi = await autoTranslateText(textInput, 'vi');
    } else {
      textJa = await autoTranslateText(textInput, 'ja');
    }

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
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const toggleChecklist = (taskId, itemId) => {
    setTasks(tasks.map(t => {
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
    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          checklists: t.checklists.filter(c => c.id !== itemId)
        };
      }
      return t;
    }));
  };

  const columns = ['Cần Làm', 'Đang Làm', 'Đã Xong'];

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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans relative">
      {/* Thông báo đang tự dịch */}
      {isTranslating && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 animate-bounce">
          ⚡ {isJa ? '自動翻訳中...' : 'Đang tự động dịch...'}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('report_title')}</h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 hidden sm:inline-block">
            💡 {t('shortcut_hint')}
          </span>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg bg-white hover:bg-gray-50 shadow-sm transition-colors"
          >
            🌐 {isJa ? '🇯🇵 日本語' : '🇻🇳 Tiếng Việt'}
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
            📊 {t('overview_tab')}
          </button>

          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {t('project_category')}
          </h2>

          <div className="flex-1 overflow-y-auto space-y-1">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => setCurrentView(p.id)}
                className={`group w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center cursor-pointer ${
                  currentView === p.id 
                    ? 'bg-blue-50 text-blue-600 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="truncate pr-2">📁 {getProjName(p)}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {tasks.filter(t => t.projectId === p.id).length}
                  </span>
                  {/* Nút Xóa Dự Án trong Sidebar */}
                  <button
                    onClick={(e) => handleDeleteProject(p.id, e)}
                    className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                    title={isJa ? '削除' : 'Xóa dự án'}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {projects.length === 0 && (
              <p className="text-xs text-gray-400 italic p-2 text-center">
                {isJa ? 'プロジェクトがありません' : 'Chưa có dự án nào'}
              </p>
            )}
          </div>

          <form onSubmit={handleAddProject} className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder={t('add_folder_placeholder')}
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" disabled={isTranslating} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
              {t('add_btn')}
            </button>
          </form>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {currentView === 'overview' ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">📊 {t('report_overview_heading')}</h2>

              {/* Cards Thống kê */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{t('stat_total_projects')}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{projects.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{t('stat_total_tasks')}</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{totalTasks}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{t('stat_total_checklists')}</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{allChecklistItems.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">{t('stat_overall_progress')}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{overallProgress}%</p>
                </div>
              </div>

              {/* BẢNG TỔNG HỢP CHECKLIST */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      📋 {t('checklist_table_title')}
                    </h3>
                    <p className="text-xs text-gray-500">{t('checklist_table_sub')}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setChecklistFilter('all')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        checklistFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('filter_all')} ({allChecklistItems.length})
                    </button>
                    <button
                      onClick={() => setChecklistFilter('pending')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        checklistFilter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('filter_pending')} ({allChecklistItems.filter(i => !i.completed).length})
                    </button>
                    <button
                      onClick={() => setChecklistFilter('completed')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        checklistFilter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t('filter_completed')} ({allChecklistItems.filter(i => i.completed).length})
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                        <th className="p-3 w-10">{t('status_label')}</th>
                        <th className="p-3">{t('th_checklist_content')}</th>
                        <th className="p-3">{t('th_task_category')}</th>
                        <th className="p-3">{t('th_project_folder')}</th>
                        <th className="p-3 text-right">{t('th_action')}</th>
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
                              {t('delete_btn')}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {filteredChecklist.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-gray-400 italic">
                            {t('empty_checklist')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Danh sách các Dự Án Chi Tiết ở Trang Tổng Quan */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-gray-800">📁 {t('project_list_heading')}</h3>
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
                          className="font-bold text-blue-600 hover:underline cursor-pointer text-base"
                        >
                          📁 {getProjName(project)}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('total_tasks_label')}: {pTotal} | {t('completed_label')}: {pDone}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-600">{pPercent}%</span>
                        <button 
                          onClick={() => setCurrentView(project.id)}
                          className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg font-medium"
                        >
                          {t('open_kanban')}
                        </button>
                        {/* Nút Xóa Dự Án ở Card Overview */}
                        <button 
                          onClick={(e) => handleDeleteProject(project.id, e)}
                          className="text-xs text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg font-medium border border-red-200 flex items-center gap-1 transition-colors"
                          title={isJa ? '削除' : 'Xóa dự án'}
                        >
                          🗑️ {isJa ? '削除' : 'Xóa'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {projects.length === 0 && (
                  <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
                    {isJa ? 'プロジェクトがありません。新しいプロジェクトを追加してください。' : 'Chưa có dự án nào. Vui lòng tạo dự án mới ở góc dưới menu bên trái.'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW DỰ ÁN CHI TIẾT (KANBAN) */
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    📂 {projects.find(p => p.id === currentView) ? getProjName(projects.find(p => p.id === currentView)) : 'Dự Án'}
                  </h2>
                  {/* Nút Xóa Dự Án trong View Chi Tiết */}
                  <button
                    onClick={(e) => handleDeleteProject(currentView, e)}
                    className="text-xs text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 font-medium flex items-center gap-1 transition-colors"
                  >
                    🗑️ {isJa ? 'プロジェクトを削除' : 'Xóa dự án này'}
                  </button>
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('new_task_placeholder')}
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64 shadow-sm"
                  />
                  <button type="submit" disabled={isTranslating} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm disabled:opacity-50">
                    {t('add_task_btn')}
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 align-top">
                {columns.map(status => {
                  const statusTasks = tasks.filter(t => t.projectId === currentView && t.status === status);
                  return (
                    <div key={status} className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col gap-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                        <span className="font-semibold text-gray-700 text-sm flex items-center gap-2">
                          {status === 'Cần Làm' && '🟡'}
                          {status === 'Đang Làm' && '🔵'}
                          {status === 'Đã Xong' && '🟢'}
                          {status === 'Đã Xong' ? t('status_done') : status === 'Đang Làm' ? t('status_pending') : t('status_todo')}
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
                              <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-red-400 hover:text-red-600">{t('delete_btn')}</button>
                            </div>

                            {totalItems > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>{t('checklist_progress')}</span>
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

                            <form onSubmit={(e) => handleAddChecklist(task.id, e)} className="flex gap-1 pt-1">
                              <input
                                type="text"
                                placeholder={t('add_subitem_placeholder')}
                                value={newChecklistText[task.id] || ''}
                                onChange={(e) => setNewChecklistText({ ...newChecklistText, [task.id]: e.target.value })}
                                className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 focus:outline-none focus:border-blue-400"
                              />
                              <button type="submit" disabled={isTranslating} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded font-medium disabled:opacity-50">
                                {t('add_btn')}
                              </button>
                            </form>

                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                              <span className="text-[11px] text-gray-400">{t('status_label')}</span>
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50 text-gray-600 focus:outline-none"
                              >
                                <option value="Cần Làm">{t('status_todo')}</option>
                                <option value="Đang Làm">{t('status_pending')}</option>
                                <option value="Đã Xong">{t('status_done')}</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}

                      {statusTasks.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                          {t('empty_task_col')}
                        </div>
                      )}
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

export default function App() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Đang tải ứng dụng...</div>}>
      <MainApp />
    </Suspense>
  );
}
