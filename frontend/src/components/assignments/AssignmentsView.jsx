import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Award,
  Trash2,
  Edit2,
  CheckSquare,
  Square,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { showToast } from '../common/Toast';
import { dataService } from '../../services/dataService';

export const AssignmentsView = ({ assignments, session, simulatedDate }) => {
  const activeSession = session || dataService.getSession();
  const isAdmin = activeSession?.role === 'admin';
  const tenant = activeSession || { dept: 'CSE', semester: '4.1', section: 'B' };

  const activeDate = simulatedDate || '2026-09-09';
  const storageKey = `campusos_completed_assignments_${tenant.dept}_${tenant.semester}_${tenant.section}`;

  // Local storage state for checked / completed assignments
  const [completedMap, setCompletedMap] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Sync to localStorage whenever completedMap changes
  const toggleAssignmentCheck = (assignmentId, title) => {
    setCompletedMap((prev) => {
      const isNowDone = !prev[assignmentId];
      const next = { ...prev, [assignmentId]: isNowDone };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save completed assignment in localStorage', e);
      }
      if (isNowDone) {
        showToast(`Marked "${title}" as completed! Saved in browser local storage.`, 'success');
      } else {
        showToast(`Unchecked "${title}".`, 'info');
      }
      return next;
    });
  };

  // Filter Tabs
  // 'all' | 'pending' | 'exceeded' | 'completed'
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    deadline: '2026-09-14',
    status: 'pending',
    marks: 100,
    description: '',
  });

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({
      course: '',
      title: '',
      deadline: '2026-09-14',
      status: 'pending',
      marks: 100,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({
      course: task.course || '',
      title: task.title || '',
      deadline: task.deadline || '2026-09-14',
      status: task.status || 'pending',
      marks: task.marks || task.total_points || 100,
      description: task.description || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (task) => {
    if (confirm(`Are you sure you want to delete assignment "${task.title}"?`)) {
      try {
        dataService.deleteAssignment(task.id || task._id, tenant, activeSession?.role || 'admin');
        showToast('Assignment removed', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.course.trim() || !formData.title.trim()) {
      showToast('Course and Title are required.', 'error');
      return;
    }

    try {
      if (editingTask) {
        dataService.updateAssignment(
          editingTask.id || editingTask._id,
          {
            ...formData,
            marks: Number(formData.marks),
          },
          tenant,
          activeSession?.role || 'admin'
        );
        showToast('Assignment updated successfully', 'success');
      } else {
        dataService.addAssignment(
          {
            ...formData,
            marks: Number(formData.marks),
          },
          tenant,
          activeSession?.role || 'admin'
        );
        showToast('Assignment created for section', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Classify each assignment
  const getAssignmentState = (task) => {
    const isCheckedDone = Boolean(completedMap[task.id || task._id]);
    const isDeadlineExceeded = task.deadline && task.deadline < activeDate;

    if (isCheckedDone) return 'completed';
    if (isDeadlineExceeded) return 'exceeded';
    return 'pending';
  };

  const allTasks = assignments || [];

  const pendingCount = allTasks.filter((t) => getAssignmentState(t) === 'pending').length;
  const exceededCount = allTasks.filter((t) => getAssignmentState(t) === 'exceeded').length;
  const completedCount = allTasks.filter((t) => getAssignmentState(t) === 'completed').length;

  const filteredTasks = allTasks.filter((task) => {
    const state = getAssignmentState(task);
    if (activeTab === 'pending' && state !== 'pending') return false;
    if (activeTab === 'exceeded' && state !== 'exceeded') return false;
    if (activeTab === 'completed' && state !== 'completed') return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        (task.course && task.course.toLowerCase().includes(q)) ||
        (task.title && task.title.toLowerCase().includes(q)) ||
        (task.description && task.description.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Course Assignments & Tasks
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C5BAFF] text-indigo-950 dark:bg-campus-500/20 dark:text-campus-300 border border-[#C5BAFF] dark:border-campus-500/30 text-xs font-bold">
              {tenant.dept} {tenant.semester} (Sec {tenant.section})
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Simulated Date: <strong className="text-indigo-600 dark:text-indigo-400">{activeDate}</strong>. Check tasks off to persist completion in your browser local storage.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {/* Tabs / Filter Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1">
          {/* All */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Tasks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/20">
              {allTasks.length}
            </span>
          </button>

          {/* Pending Assignment */}
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
              {pendingCount}
            </span>
          </button>

          {/* Deadline Exceeded Assignment */}
          <button
            onClick={() => setActiveTab('exceeded')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'exceeded'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-800 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Deadline Exceeded</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200">
              {exceededCount}
            </span>
          </button>

          {/* Completed / Checked in Browser */}
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-800 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed (Local)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200">
              {completedCount}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative px-2">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter course or title..."
            className="w-full sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Task List Grid */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-dashed border-[#C4D9FF] dark:border-slate-800 space-y-2">
          <BookOpenCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No assignments found in this view</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === 'completed'
              ? 'You have not checked off any assignments yet. Click the checkbox on an assignment card to store your completion progress in browser local storage.'
              : activeTab === 'exceeded'
              ? 'No deadlines have been exceeded relative to the current simulated date.'
              : 'All caught up! Check back later for new assignments.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => {
            const taskId = task.id || task._id;
            const isDone = Boolean(completedMap[taskId]);
            const isExceeded = task.deadline && task.deadline < activeDate && !isDone;

            return (
              <div
                key={taskId}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900/90 border shadow-sm flex flex-col justify-between space-y-3 transition-all ${
                  isDone
                    ? 'border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : isExceeded
                    ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/20 dark:bg-rose-950/10'
                    : 'border-[#C4D9FF] dark:border-slate-800 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top: Course Badge & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {task.course}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {isDone ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          Checked Done
                        </span>
                      ) : isExceeded ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          Deadline Exceeded
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          {task.status || 'Pending'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3
                      className={`text-sm font-bold text-slate-900 dark:text-white leading-snug ${
                        isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>

                  {/* Deadline & Points */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span className={isExceeded ? 'font-bold text-rose-600 dark:text-rose-400' : ''}>
                        Due: {task.deadline}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{task.marks || task.total_points || 100} pts</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Interactive Row: Student Checkbox & Admin CRUD */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  {/* Browser Local Storage Checkbox Button */}
                  <button
                    type="button"
                    onClick={() => toggleAssignmentCheck(taskId, task.title)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      isDone
                        ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Completed (Saved in Local Storage)</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4 text-slate-400" />
                        <span>Mark as Completed</span>
                      </>
                    )}
                  </button>

                  {/* Admin CRUD Actions */}
                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => handleOpenEdit(task)}
                        className="py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(task)}
                        className="py-1.5 rounded-lg text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-rose-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin Add / Edit Modal */}
      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTask ? 'Edit Assignment' : 'Create New Assignment'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Course Code
                </label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  placeholder="e.g. CSE411"
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white uppercase font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Deadline Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Assignment Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Distributed Systems Lab Project"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="graded">Graded</option>
                  <option value="late">Late</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Marks / Total Points
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.marks}
                  onChange={(e) => setFormData({ ...formData, marks: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Description / Guidelines
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Include submission platform, rubric, or instructions..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#C4D9FF] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF] dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                {editingTask ? 'Update Assignment' : 'Create Assignment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
