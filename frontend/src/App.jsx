import React, { useState } from 'react';

export default function App() {
  const [projects, setProjects] = useState([
    { id: 'p1', name: 'Khai Trương Cửa Hàng' },
    { id: 'p2', name: 'Marketing & Quảng Cáo' }
  ]);
  const [currentView, setCurrentView] = useState('overview'); // 'overview' hoặc 'p1', 'p2'...
  const [newProjectName, setNewProjectName] = useState('');

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

  // Thêm Dự án / Thư mục mới
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newProj = { id: Date.now().toString(), name: newProjectName };
    setProjects([...projects, newProj]);
    setCurrentView(newProj.id);
    setNewProjectName('');
  };

  // Thêm Task mới
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

  // Thống kê tổng quan cho Toàn bộ ứng dụng
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Đã Xong').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Tiến Độ Dự Án</h1>
          <p className="text-sm text-gray-500">Hệ thống theo dõi công việc & Tổng hợp tiến độ</p>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
          {/* Nút Trang Tổng Hợp */}
          <button
            onClick={() => setCurrentView('overview')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold mb-4 flex items-center gap-2 transition-colors ${
              currentView === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📊 Trang Tổng Hợp
          </button>

          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Danh Mục Dự Án</h2>
          
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

          {/* Form thêm dự án */}
          <form onSubmit={handleAddProject} className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <input
              type="text"
              placeholder="+ Thêm thư mục..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full text-sm border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
              Thêm
            </button>
          </form>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* VIEW 1: TRANG TỔNG HỢP (OVERVIEW) */}
          {currentView === 'overview' ? (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-800">📊 Tổng Quan Tất Cả Các Hạng Mục</h2>

              {/* Card Thống kê nhanh */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Tổng Thư Mục / Dự Án</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{projects.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Tổng Cong Việc (Tasks)</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">{totalTasks}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Đã Hoàn Thành</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{completedTasks}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-xs text-gray-500 font-medium">Tiến Độ Chung</p>
                  <p className="text-2xl font-bold text-indigo-600 mt-1">{overallProgress}%</p>
                </div>
              </div>

              {/* Bảng Danh Sách Hạng Mục Đã Liệt Kê */}
              <div className="space-y-4">
                {projects.map(project => {
                  const projectTasks = tasks.filter(t => t.projectId === project.id);
                  const pTotal = projectTasks.length;
                  const pDone = projectTasks.filter(t => t.status === 'Đã Xong').length;
                  const pDoing = projectTasks.filter(t => t.status === 'Đang Làm').length;
                  const pTodo = projectTasks.filter(t => t.status === 'Cần Làm').length;
                  const pPercent = pTotal > 0 ? Math.round((pDone / pTotal) * 100) : 0;

                  return (
                    <div key={project.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-3 border-b border-gray-100">
                        <div>
                          <h3 
                            onClick={() => setCurrentView(project.id)}
                            className="text-lg font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-2"
                          >
                            📁 {project.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Tổng số công việc: <span className="font-semibold">{pTotal}</span> | Cần làm: <span className="text-yellow-600">{pTodo}</span> | Đang làm: <span className="text-blue-600">{pDoing}</span> | Hoàn thành: <span className="text-green-600">{pDone}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-64">
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Tiến độ</span>
                              <span className="font-semibold">{pPercent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${pPercent}%` }}></div>
                            </div>
                          </div>
                          <button 
                            onClick={() => setCurrentView(project.id)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap"
                          >
                            Xem Chi Tiết $\rightarrow$
                          </button>
                        </div>
                      </div>

                      {/* Danh sách Task thu gọn trong Hạng Mục */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {projectTasks.map(task => (
                          <div key={task.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs flex justify-between items-center">
                            <span className="font-medium text-gray-700 truncate">{task.title}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                              task.status === 'Đã Xong' ? 'bg-green-100 text-green-700' :
                              task.status === 'Đang Làm' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {task.status}
                            </span>
                          </div>
                        ))}
                        {projectTasks.length === 0 && (
                          <p className="text-xs text-gray-400 italic">Thư mục này chưa có công việc nào.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* VIEW 2: KHANBAN BOARD CHI TIẾT TỪNG THƯ MỤC */
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  📂 {projects.find(p => p.id === currentView)?.name || 'Dự Án'}
                </h2>

                <form onSubmit={handleAddTask} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nhập tên công việc mới..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 w-64 shadow-sm"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm">
                    + Tạo Task Mới
                  </button>
                </form>
              </div>

              {/* Kanban Columns */}
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
                          {status}
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
                              <button onClick={() => handleDeleteTask(task.id)} className="text-xs text-red-400 hover:text-red-600">Xóa</button>
                            </div>

                            {totalItems > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span>Tiến độ Checklist</span>
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
                                placeholder="+ Thêm mục nhỏ..."
                                value={newChecklistText[task.id] || ''}
                                onChange={(e) => setNewChecklistText({ ...newChecklistText, [task.id]: e.target.value })}
                                className="text-xs border border-gray-200 rounded px-2 py-1 flex-1 focus:outline-none focus:border-blue-400"
                              />
                              <button type="submit" className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded font-medium">
                                Thêm
                              </button>
                            </form>

                            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                              <span className="text-[11px] text-gray-400">Trạng thái:</span>
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                className="text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50 text-gray-600 focus:outline-none"
                              >
                                <option value="Cần Làm">Cần Làm</option>
                                <option value="Đang Làm">Đang Làm</option>
                                <option value="Đã Xong">Đã Xong</option>
                              </select>
                            </div>
                          </div>
                        );
                      })}

                      {statusTasks.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                          Chưa có công việc
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
