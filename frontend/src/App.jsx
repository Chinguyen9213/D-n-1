import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageShortcut } from './useLanguageShortcut';

const PRIORITIES = {
  HIGH: { labelVi: '🔥 Cao', labelJa: '🔥 高', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  MEDIUM: { labelVi: '⚡ Trung bình', labelJa: '⚡ 中', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  LOW: { labelVi: '✅ Thấp', labelJa: '✅ 低', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' }
};

// --- COMPONENT TRỢ LÝ AI BÓC TÁCH CÔNG VIỆC ---
function AiAssistant({ onParsed, isJa }) {
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAiParse = () => {
    if (!inputContent.trim()) return;
    setLoading(true);
    // Giả lập quá trình AI phân tích văn bản/ghi chú thô thành task
    setTimeout(() => {
      const lines = inputContent.split('\n').filter(l => l.trim().length > 0);
      const title = lines[0] ? lines[0].replace(/^[-*•]\s*/, '') : (isJa ? 'AIからのタスク' : 'Công việc từ AI');
      
      onParsed({
        titleVi: title,
        titleJa: title,
        priority: 'MEDIUM',
        assignee: 'Chi',
        checklists: lines.slice(1).map(l => ({
          textVi: l.replace(/^[-*•]\s*/, ''),
          textJa: l.replace(/^[-*•]\s*/, '')
        }))
      });

      setInputContent('');
      setLoading(false);
      alert(isJa ? 'AIがタスクを正常に解析しました！' : 'AI đã bóc tách dữ liệu và điền vào form thành công!');
    }, 800);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 shadow-sm space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
          🤖 {isJa ? 'AIアシスタント (タスク自動分解)' : 'Trợ lý AI Bóc Tách Công Việc'}
        </h3>
        <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-semibold">Smart AI</span>
      </div>
      <textarea
        rows="2"
        placeholder={isJa ? 'ここに文章や議事録を貼り付けてください。AIがタスクとチェックリストに分解します...' : 'Dán nội dung email, ghi chú hoặc cuộc họp vào đây để AI tự động phân tích thành tiêu đề và danh sách việc cần làm...'}
        value={inputContent}
        onChange={(e) => setInputContent(e.target.value)}
        className="w-full text-xs border border-blue-200 rounded-lg p-2.5 focus:outline-none focus:border-blue-500 bg-white"
      />
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleAiParse}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1"
        >
          {loading ? (isJa ? '解析中...' : 'Đang phân tích...') : (isJa ? '✨ AIで解析してフォームに反映' : '✨ AI Bóc Tách & Điền Form')}
        </button>
      </div>
    </div>
  );
}

function MainApp({ user, onLogout }) {
  const { t, i18n } = useTranslation();
  useLanguageShortcut();
  const isJa = i18n.language && i18n.language.startsWith('ja');
  
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('kanban_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return [
      { id: 'p1', nameVi: 'Oishii BBQ', nameJa: 'Oishii BBQ' },
      { id: 'p2', nameVi: 'Marketing & Quảng Cáo', nameJa: 'マーケティング＆広告' }
    ];
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('kanban_tasks');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(t => ({
            ...t,
            titleVi: t.titleVi || t.title || 'Công việc',
            titleJa: t.titleJa || t.title || 'タスク',
            checklists: (t.checklists || []).map(c => ({
              ...c,
              textVi: c.textVi || c.text || 'Mục con',
              textJa: c.textJa || c.text || '小項目'
            })),
            attachments: t.attachments || []
          }));
        }
      } catch (e) { console.error(e); }
    }
    return [
      {
        id: 1,
        projectId: 'p1',
        titleVi: 'Xây dựng quy trình SOP',
        titleJa: 'SOPプロセスの構築',
        status: 'Cần Làm',
        priority: 'HIGH',
        assignee: 'Chi',
        dueDate: '2026-08-10',
        checklists: [],
        attachments: []
      }
    ];
  });

  useEffect(() => { localStorage.setItem('kanban_projects', JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem('kanban_tasks', JSON.stringify(tasks)); }, [tasks]);

  // --- TÍNH NĂNG BACKUP & RESTORE DỮ LIỆU ---
  const exportData = () => {
    const data = JSON.stringify({ projects, tasks }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (imported.projects && imported.tasks) {
          setProjects(imported.projects);
          setTasks(imported.tasks);
          alert(isJa ? 'データを正常に復元しました！' : 'Đã khôi phục dữ liệu thành công!');
        } else {
          alert(isJa ? 'エラー: ファイル形式が正しくありません。' : 'Lỗi: Cấu trúc file dữ liệu không đúng!');
        }
      } catch (err) { 
        alert(isJa ? 'エラー: ファイルを解析できません。' : 'Lỗi: Không thể đọc file JSON!'); 
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };
  // ------------------------------------------

  const [currentView, setCurrentView] = useState('p1');
  const [newProjectNameVi, setNewProjectNameVi] = useState('');
  const [newProjectNameJa, setNewProjectNameJa] = useState('');
  
  const [checklistFilter, setChecklistFilter] = useState('all');
  
  const [newTaskTitleVi, setNewTaskTitleVi] = useState('');
  const [newTaskTitleJa, setNewTaskTitleJa] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newChecklistTextVi, setNewChecklistTextVi] = useState({});
  const [newChecklistTextJa, setNewChecklistTextJa] = useState({});
  const [attNameInputs, setAttNameInputs] = useState({});
  const [attUrlInputs, setAttUrlInputs] = useState({});
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTitleVi, setEditTitleVi] = useState('');
  const [editTitleJa, setEditTitleJa] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [viewMode, setViewMode] = useState('kanban');

  const toggleLanguage = () => {
    const currentLang = i18n.language || 'vi';
    i18n.changeLanguage(currentLang.startsWith('vi') ? 'ja' : 'vi');
  };

  const getProjName = (p) => (isJa ? (p.nameJa || p.nameVi) : (p.nameVi || p.nameJa));
  const getTaskTitle = (task) => (isJa ? (task.titleJa || task.titleVi) : (task.titleVi || task.titleJa));
  const getChecklistText = (item) => (isJa ? (item.textJa || item.textVi) : (item.textVi || item.textJa));

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

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectNameVi.trim() && !newProjectNameJa.trim()) return;
    const nameVi = newProjectNameVi.trim() || newProjectNameJa.trim();
    const nameJa = newProjectNameJa.trim() || newProjectNameVi.trim();
    
    const newProj = { id: 'p_' + Date.now(), nameVi, nameJa };
    setProjects(prev => [...prev, newProj]);
    setCurrentView(newProj.id);
    setNewProjectNameVi('');
    setNewProjectNameJa('');
  };

  const handleAddTask = (e) => {
    if (e) e.preventDefault();
    if (!newTaskTitleVi.trim() && !newTaskTitleJa.trim()) return;
    const titleVi = newTaskTitleVi.trim() || newTaskTitleJa.trim();
    const titleJa = newTaskTitleJa.trim() || newTaskTitleVi.trim();
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
    setNewTaskTitleVi('');
    setNewTaskTitleJa('');
    setNewTaskAssignee('');
    setNewTaskDueDate('');
    setNewTaskPriority('MEDIUM');
  };

  // Callback nhận kết quả từ trợ lý AI để điền vào form thêm task mới
  const handleAiParsedResult = (data) => {
    setNewTaskTitleVi(data.titleVi);
    setNewTaskTitleJa(data.titleJa);
    setNewTaskPriority(data.priority);
    setNewTaskAssignee(data.assignee || user);
  };

  const handleSaveTaskTitle = (taskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          titleVi: editTitleVi.trim() || t.titleVi,
          titleJa: editTitleJa.trim() || t.titleJa
        };
      }
      return t;
    }));
    setEditingTaskId(null);
  };

  const handleAddAttachmentUrl = (taskId) => {
    const name = attNameInputs[taskId];
    const url = attUrlInputs[taskId];
    if (!name || !name.trim() || !url || !url.trim()) {
      alert(isJa ? '資料名とURLの両方を入力してください。' : 'Vui lòng nhập đầy đủ tên tài liệu và URL!');
      return;
    }
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newAtt = { id: 'att_' + Date.now(), type: 'url', name: name.trim(), url: url.trim() };
        return { ...t, attachments: [...(t.attachments || []), newAtt] };
      }
      return t;
    }));
    setAttNameInputs(prev => ({ ...prev, [taskId]: '' }));
    setAttUrlInputs(prev => ({ ...prev, [taskId]: '' }));
  };

  const handleFileUpload = (taskId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const fileDataUrl = uploadEvent.target.result;
      setTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          const newAtt = { id: 'file_' + Date.now(), type: 'file', name: file.name, url: fileDataUrl };
          return { ...t, attachments: [...(t.attachments || []), newAtt] };
        }
        return t;
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleDeleteAttachment = (taskId, attId) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, attachments: t.attachments.filter(a => a.id !== attId) };
      }
      return t;
    }));
  };

  const handleAddChecklist = (taskId, e) => {
    e.preventDefault();
    const textVi = (newChecklistTextVi[taskId] || '').trim();
    const textJa = (newChecklistTextJa[taskId] || '').trim();
    if (!textVi && !textJa) return;
    const finalVi = textVi || textJa;
    const finalJa = textJa || textVi;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, checklists: [...t.checklists, { id: Date.now(), textVi: finalVi, textJa: finalJa, completed: false }] };
      }
      return t;
    }));
    setNewChecklistTextVi(prev => ({ ...prev, [taskId]: '' }));
    setNewChecklistTextJa(prev => ({ ...prev, [taskId]: '' }));
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
      projectName: proj ? getProjName(proj) : 'Chưa phân loại'
    }));
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
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isJa ? 'プロジェクト進捗レポート' : 'Báo Cáo Tiến Độ Dự Án'}</h1>
          <p className="text-sm text-gray-500">{isJa ? 'タスク追跡システム＆チェックリスト総合' : 'Hệ thống theo dõi công việc nâng cao'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportData} 
            className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold shadow-sm transition"
            title="Lưu file backup dữ liệu về máy"
          >
            📥 Backup
          </button>
          <label 
            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg font-bold shadow-sm cursor-pointer transition"
            title="Khôi phục dữ liệu từ file backup"
          >
            📤 Restore
            <input type="file" accept=".json" onChange={importData} className="hidden" />
          </label>
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

          <form onSubmit={handleAddProject} className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <input
              type="text"
              placeholder={isJa ? 'フォルダ名 (Tiếng Việt)' : 'Tên dự án (Tiếng Việt)'}
              value={newProjectNameVi}
              onChange={(e) => setNewProjectNameVi(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder={isJa ? 'フォルダ名 (日本語)' : 'Tên dự án (Tiếng Nhật)'}
              value={newProjectNameJa}
              onChange={(e) => setNewProjectNameJa(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="w-full bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-lg">{isJa ? 'フォルダ追加' : '+ Thêm danh mục'}</button>
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
            </div>
          ) : (
            <div className="space-y-6">
              {/* TÍCH HỢP TRỢ LÝ AI Ở ĐÂY */}
              <AiAssistant onParsed={handleAiParsedResult} isJa={isJa} />

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
                <h3 className="text-sm font-bold text-gray-800">✨ {isJa ? '新しいタスクを追加' : 'Thêm Công Việc Mới (Song ngữ Tiếng Việt & Tiếng Nhật)'}</h3>
                <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <input type="text" placeholder={isJa ? 'タスク名 (Tiếng Việt)' : 'Tên task (Tiếng Việt)'} value={newTaskTitleVi} onChange={(e) => setNewTaskTitleVi(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 md:col-span-2" />
                  <input type="text" placeholder={isJa ? 'タスク名 (日本語)' : 'Tên task (Tiếng Nhật)'} value={newTaskTitleJa} onChange={(e) => setNewTaskTitleJa(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 md:col-span-2" />
                  <input type="text" placeholder={isJa ? '担当者' : 'Người phụ trách'} value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500" />
                  <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-600" />
                  <div className="flex gap-2 md:col-span-6 justify-between items-center pt-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-gray-500 font-medium">{isJa ? '優先度:' : 'Mức ưu tiên:'}</span>
                      <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white text-gray-700 font-semibold">
                        <option value="HIGH">🔥 Cao</option>
                        <option value="MEDIUM">⚡ Trung bình</option>
                        <option value="LOW">✅ Thấp</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-6 py-2 rounded-lg">{isJa ? '追加' : 'Tạo Công Việc'}</button>
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
                                {editingTaskId === task.id ? (
                                  <div className="space-y-1.5 flex-1">
                                    <input
                                      type="text"
                                      placeholder="Tên Tiếng Việt"
                                      value={editTitleVi}
                                      onChange={(e) => setEditTitleVi(e.target.value)}
                                      className="border border-blue-500 rounded px-2 py-1 text-xs w-full focus:outline-none"
                                      autoFocus
                                    />
                                    <input
                                      type="text"
                                      placeholder="Tên Tiếng Nhật"
                                      value={editTitleJa}
                                      onChange={(e) => setEditTitleJa(e.target.value)}
                                      className="border border-blue-500 rounded px-2 py-1 text-xs w-full focus:outline-none"
                                    />
                                    <div className="flex justify-end gap-1">
                                      <button type="button" onClick={() => setEditingTaskId(null)} className="bg-gray-200 text-gray-700 text-[11px] px-2 py-0.5 rounded font-bold">Hủy</button>
                                      <button type="button" onClick={() => handleSaveTaskTitle(task.id)} className="bg-blue-600 text-white text-[11px] px-3 py-0.5 rounded font-bold">{isJa ? '保存' : 'Lưu'}</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2 flex-1">
                                    <h3 className="font-semibold text-gray-800 text-sm leading-snug flex-1">{getTaskTitle(task)}</h3>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingTaskId(task.id);
                                        setEditTitleVi(task.titleVi || '');
                                        setEditTitleJa(task.titleJa || '');
                                      }}
                                      className="text-gray-400 hover:text-blue-600 text-xs"
                                      title="Sửa tên task"
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                )}
                                <button type="button" onClick={() => handleDeleteTask(task.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
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
                                    <button type="button" onClick={() => deleteChecklistItem(task.id, item.id)} className="text-gray-300 hover:text-red-500 hidden group-hover:block">✕</button>
                                  </div>
                                ))}
                              </div>

                              <form onSubmit={(e) => handleAddChecklist(task.id, e)} className="space-y-1 pt-1">
                                <div className="grid grid-cols-2 gap-1">
                                  <input 
                                    type="text" 
                                    placeholder={isJa ? '小項目 (Tiếng Việt)' : '+ Mục con (Tiếng Việt)'} 
                                    value={newChecklistTextVi[task.id] || ''} 
                                    onChange={(e) => setNewChecklistTextVi({ ...newChecklistTextVi, [task.id]: e.target.value })} 
                                    className="text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none" 
                                  />
                                  <input 
                                    type="text" 
                                    placeholder={isJa ? '小項目 (日本語)' : '+ Mục con (Tiếng Nhật)'} 
                                    value={newChecklistTextJa[task.id] || ''} 
                                    onChange={(e) => setNewChecklistTextJa({ ...newChecklistTextJa, [task.id]: e.target.value })} 
                                    className="text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none" 
                                  />
                                </div>
                                <div className="flex justify-end">
                                  <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] px-3 py-1 rounded font-medium">{isJa ? '追加' : 'Thêm mục con'}</button>
                                </div>
                              </form>

                              <div className="pt-2 border-t border-gray-100 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-[11px] font-bold text-gray-600">📎 {isJa ? '添付資料' : 'Tài liệu đính kèm'}</p>
                                  <label className="cursor-pointer bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                                    📁 {isJa ? 'ファイルアップロード' : '+ Tải file lên'}
                                    <input type="file" onChange={(e) => handleFileUpload(task.id, e)} className="hidden" />
                                  </label>
                                </div>
                                {task.attachments && task.attachments.length > 0 ? (
                                  <div className="space-y-1">
                                    {task.attachments.map(att => (
                                      <div key={att.id} className="flex items-center justify-between text-xs bg-gray-50 px-2 py-1 rounded border border-gray-100 group">
                                        <a href={att.url} target="_blank" rel="noreferrer" download={att.type === 'file' ? att.name : undefined} className="text-blue-600 hover:underline truncate pr-2 max-w-[170px]" title={att.name}>
                                          {att.type === 'file' ? '💾 ' : '📄 '} {att.name}
                                        </a>
                                        <button type="button" onClick={() => handleDeleteAttachment(task.id, att.id)} className="text-gray-400 hover:text-red-500 text-[10px]">✕</button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-gray-400 italic">{isJa ? '資料なし' : 'Chưa có file hay link nào'}</p>
                                )}
                                <div className="space-y-1 pt-1 border-t border-dashed border-gray-200">
                                  <input type="text" placeholder={isJa ? '資料名 (例: 契約書)' : 'Tên link (VD: Tài liệu thiết kế)'} value={attNameInputs[task.id] || ''} onChange={(e) => setAttNameInputs({ ...attNameInputs, [task.id]: e.target.value })} className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none" />
                                  <div className="flex gap-1">
                                    <input type="text" placeholder="URL (https://...)" value={attUrlInputs[task.id] || ''} onChange={(e) => setAttUrlInputs({ ...attUrlInputs, [task.id]: e.target.value })} className="w-full text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none" />
                                    <button type="button" onClick={() => handleAddAttachmentUrl(task.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] px-3 py-1 rounded font-bold shrink-0 shadow-sm">+ Link</button>
                                  </div>
                                </div>
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
