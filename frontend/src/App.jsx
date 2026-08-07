import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const API = 'https://project-tracker-api.onrender.com/api';

export default function App() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'Trung bình',
    dueDate: new Date().toISOString().split('T')[0],
    projectId: ''
  });

  const loadData = async () => {
    try {
      const [resProj, resTask] = await Promise.all([
        axios.get(`${API}/projects`),
        axios.get(`${API}/tasks`)
      ]);
      setProjects(resProj.data);
      setTasks(resTask.data);
      if (resProj.data.length > 0 && !form.projectId) {
        setForm(prev => ({ ...prev, projectId: resProj.data[0].id }));
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!form.title || !form.assignee) return alert("Vui lòng điền đủ thông tin!");
    await axios.post(`${API}/tasks`, form);
    setShowModal(false);
    setForm({ ...form, title: '', description: '', assignee: '' });
    loadData();
  };

  const handleMoveStatus = async (taskId, newStatus) => {
    await axios.patch(`${API}/tasks/${taskId}/status`, { status: newStatus });
    loadData();
  };

  const handleDeleteTask = async (id) => {
    if (confirm("Bạn có chắc muốn xóa task này?")) {
      await axios.delete(`${API}/tasks/${id}`);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Quản Lý Tiến Độ Dự Án</h1>
            <p className="text-slate-500 text-sm mt-1">Hệ thống theo dõi & quản lý công việc real-time</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition"
          >
            <Plus size={18} /> Tạo Task Mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {projects.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-lg">{p.name}</h3>
              <div className="flex justify-between items-center mt-3 text-sm text-slate-600">
                <span>Hoàn thành: {p.completedTasks}/{p.totalTasks} task</span>
                <span className="font-semibold text-blue-600">{p.progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
                <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${p.progress}%` }} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { id: 'TODO', title: 'Cần Làm', color: 'border-amber-400', icon: <Clock size={18} className="text-amber-500" /> },
            { id: 'IN_PROGRESS', title: 'Đang Làm', color: 'border-blue-400', icon: <AlertCircle size={18} className="text-blue-500" /> },
            { id: 'DONE', title: 'Đã Xong', color: 'border-emerald-400', icon: <CheckCircle2 size={18} className="text-emerald-500" /> }
          ].map(col => {
            const colTasks = tasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className={`bg-slate-50 p-4 rounded-xl border-t-4 ${col.color} border-slate-200 shadow-sm`}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 font-bold text-slate-700">
                    {col.icon}
                    <h2>{col.title}</h2>
                  </div>
                  <span className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-full font-bold">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map(t => (
                    <div key={t.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow transition">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-600 mb-2 inline-block">
                          {t.project?.name}
                        </span>
                        <button onClick={() => handleDeleteTask(t.id)} className="text-slate-400 hover:text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-1">{t.title}</h4>
                      {t.description && <p className="text-xs text-slate-500 mb-3">{t.description}</p>}
                      <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t">
                        <span>👤 {t.assignee}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'Cao' ? 'bg-red-100 text-red-600' :
                          t.priority === 'Trung bình' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <div className="mt-3 flex gap-1 pt-2">
                        {col.id !== 'TODO' && (
                          <button onClick={() => handleMoveStatus(t.id, 'TODO')} className="text-[10px] bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">
                            ← Cần làm
                          </button>
                        )}
                        {col.id !== 'IN_PROGRESS' && (
                          <button onClick={() => handleMoveStatus(t.id, 'IN_PROGRESS')} className="text-[10px] bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">
                            {col.id === 'TODO' ? 'Bắt đầu →' : '← Đang làm'}
                          </button>
                        )}
                        {col.id !== 'DONE' && (
                          <button onClick={() => handleMoveStatus(t.id, 'DONE')} className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100 font-medium">
                            Hoàn thành ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center p-4">
            <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl border">
              <h3 className="text-lg font-bold mb-4 text-slate-800">Tạo Công Việc Mới</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tên Task</label>
                  <input 
                    type="text" required 
                    className="w-full border rounded-lg p-2 text-sm mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Dự án</label>
                  <select 
                    className="w-full border rounded-lg p-2 text-sm mt-1"
                    value={form.projectId} onChange={e => setForm({...form, projectId: e.target.value})}
                  >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Người thực hiện</label>
                    <input 
                      type="text" required 
                      className="w-full border rounded-lg p-2 text-sm mt-1"
                      value={form.assignee} onChange={e => setForm({...form, assignee: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Mức độ ưu tiên</label>
                    <select 
                      className="w-full border rounded-lg p-2 text-sm mt-1"
                      value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    >
                      <option value="Thấp">Thấp</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Cao">Cao</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Mô tả</label>
                  <textarea 
                    rows="2"
                    className="w-full border rounded-lg p-2 text-sm mt-1"
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Tạo Task
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
