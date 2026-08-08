import React, { useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageShortcut } from './useLanguageShortcut';

function MainApp() {
  const { t, i18n } = useTranslation();
  useLanguageShortcut();

  const [projects, setProjects] = useState([
    { id: 'p1', name: 'Khai Trương Cửa Hàng' },
    { id: 'p2', name: 'Marketing & Quảng Cáo' }
  ]);
  const [currentView, setCurrentView] = useState('overview');
  const [newProjectName, setNewProjectName] = useState('');
  const [checklistFilter, setChecklistFilter] = useState('all');

  const [tasks, setTasks] = useState([
    {
      id: 1,
      projectId: 'p1',
      title: 'Thuê mặt bằng & Thi công',
      status: 'Đang Làm',
      checklists: [
        { id: 101, text: 'Ký hợp đồng thuê', completed: true },
        { id: 102, text: 'Thiết kế biển bảng', completed: false },
        { id: 103, text: 'Sơn sửa lại cửa hàng', completed: false }
      ]
    },
    {
      id: 2,
      projectId: 'p1',
      title: 'Tuyển dụng nhân sự',
      status: 'Cần Làm',
      checklists: [
        { id: 201, text: 'Đăng tin tuyển dụng', completed: true },
        { id: 202, text: 'Phỏng vấn thu ngân', completed: false }
      ]
    },
    {
      id: 3,
      projectId: 'p2',
      title: 'Chạy quảng cáo Facebook',
      status: 'Đang Làm',
      checklists: [
        { id: 301, text: 'Tạo Fanpage', completed: true },
        { id: 302, text: 'Nạp ngân sách QC', completed: false }
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

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newProj = { id: Date.now().toString(), name: newProjectName };
    setProjects([...projects, newProj]);
    setCurrentView(newProj.id);
    setNewProjectName('');
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      projectId: currentView,
      title: newTaskTitle,
      status: 'Cần Làm',
      checklists: []
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleAddChecklist = (taskId, e) => {
    e.preventDefault();
    const text = newChecklistText[taskId];
    if (!text || !text.trim()) return;

    setTasks(tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          checklists: [...t.checklists, { id: Date.now(), text: text.trim(), completed: false }]
        };
      }
      return t;
    }));

    setNewChecklistText({ ...newChecklistText, [taskId]: '' });
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
      taskTitle: task.title,
      projectName: proj ? proj.name : 'Chưa phân loại'
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
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
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
            🌐 {i18n.language && i18n.language.startsWith('ja') ? '🇯🇵 日本語' : '🇻🇳 Tiếng Việt'}
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
              <button
                key={p.id}
                onClick={() => setCurrentView(p.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex justify-between items-center ${
                  currentView === p.id 
                    ? 'bg-blue-50 text-blue-600 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="truncate">📁 {p.name}</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {tasks.filter(t => t.projectId === p.id).length}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleAddProject} className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder={t('add_folder_placeholder')}
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
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

              {/* BẢNG TỔNG HỢP CHECKLIST TOÀN BỘ CÔNG VIỆC */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      📋 {t('checklist_table_title')}
                    </h3>
                    <p className="text-xs text-gray-500">{t('checklist_table_sub')}</p>
                  </div>

                  {/* Bộ lọc trạng thái */}
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

                {/* Danh sách Table Checklist */}
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
                            {item.text}
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

              {/* Danh sách Thư Mục Chi Tiết bên dưới */}
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
                          className="font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          📁 {project.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('total_tasks_label')}: {pTotal} | {t('completed_label')}: {pDone}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-gray-600">{pPercent}%</span>
                        <button 
                          onClick={() => setCurrentView(project.id)}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium"
                        >
                          {t('open_kanban')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW CHI TIẾT DỰ ÁN (KANBAN BOARD) */
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  📂 {projects.find(p => p.id === currentView)?.name || 'Dự Án'}
                </h2>

                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('new_task_placeholder')}
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64 shadow-sm"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm">
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
                              <h3 className="font-semibold text-gray-800 text-sm">{task.title}</h3>
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
                                      {item.text}
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
                              <button type="submit" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded font-medium">
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
