import React, { useState } from 'react';

export default function App() {
  const [projects, setProjects] = useState([
    { id: 'p1', name: 'Khai Trương Cửa Hàng' },
    { id: 'p2', name: 'Marketing & Quảng Cáo' }
  ]);
  const [currentProjectId, setCurrentProjectId] = useState('p1');
  const [newProjectName, setNewProjectName] = useState('');

  const [tasks, setTasks] = useState([
    { id: 1, projectId: 'p1', title: 'Thuê mặt bằng', status: 'Đã Xong' },
    { id: 2, projectId: 'p1', title: 'Trang trí & Nội thất', status: 'Đang Làm' },
    { id: 3, projectId: 'p1', title: 'Tuyển dụng nhân sự', status: 'Cần Làm' },
    { id: 4, projectId: 'p2', title: 'Lên kế hoạch Facebook Ads', status: 'Cần Làm' }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Lọc task theo dự án hiện tại
  const activeTasks = tasks.filter(t => t.projectId === currentProjectId);

  // Thêm dự án/thư mục mới
  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newProj = { id: Date.now().toString(), name: newProjectName };
    setProjects([...projects, newProj]);
    setCurrentProjectId(newProj.id);
    setNewProjectName('');
  };

  // Thêm Task mới vào dự án hiện tại
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      projectId: currentProjectId,
      title: newTaskTitle,
      status: 'Cần Làm'
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  // Đổi trạng thái task
  const handleStatusChange = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  // Xóa task
  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const columns = ['Cần Làm', 'Đang Làm', 'Đã Xong'];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Tiến Độ Dự Án</h1>
          <p className="text-sm text-gray-500">Hệ thống theo dõi & quản lý công việc real-time</p>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Danh sách Thư mục / Dự án */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Danh Mục Dự Án</h2>
          
          <div className="flex-1 overflow-y-auto space-y-1">
            {projects.map(p => (
              <button
                key={p.id}
                onClick={() => setCurrentProjectId(p.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentProjectId === p.id 
                    ? 'bg-blue-50 text-blue-600 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                📁 {p.name}
              </button>
            ))}
          </div>

          {/* Form thêm dự án mới */}
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

        {/* Main Content - Kanban Board */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Header Dự án hiện tại & Thêm Task */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              📂 {projects.find(p => p.id === currentProjectId)?.name || 'Dự Án'}
            </h2>

            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập tên task mới..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map(status => {
              const statusTasks = activeTasks.filter(t => t.status === status);
              return (
                <div key={status} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
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

                  {/* Tasks List */}
                  <div className="space-y-3">
                    {statusTasks.map(task => (
                      <div key={task.id} className="bg-white p-3.5 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow">
                        <p className="text-sm font-medium text-gray-800 mb-3">{task.title}</p>
                        
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1 bg-gray-50 text-gray-600"
                          >
                            <option value="Cần Làm">Cần Làm</option>
                            <option value="Đang Làm">Đang Làm</option>
                            <option value="Đã Xong">Đã Xong</option>
                          </select>

                          <button 
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}

                    {statusTasks.length === 0 && (
                      <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                        Chưa có task nào
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
