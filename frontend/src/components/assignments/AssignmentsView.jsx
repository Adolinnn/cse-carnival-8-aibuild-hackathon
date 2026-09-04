import React, { useState } from 'react';
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
  ArrowRight,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { showToast } from '../common/Toast';
import { dataService } from '../../services/dataService';

export const AssignmentsView = ({ assignments, session }) => {
  const activeSession = session || dataService.getSession();
  const isAdmin = activeSession?.role === 'admin';
  const tenant = activeSession || { dept: 'CSE', semester: '3.2', section: 'A' };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    deadline: '2026-09-14',
    status: 'pending',
    total_points: 100,
    description: '',
  });

  const COLUMNS = [
    { id: 'pending', title: 'Pending', border: 'border-amber-400/40', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300' },
    { id: 'submitted', title: 'Submitted', border: 'border-blue-400/40', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' },
    { id: 'graded', title: 'Graded', border: 'border-emerald-400/40', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' },
    { id: 'late', title: 'Late / Overdue', border: 'border-rose-400/40', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300' },
  ];

  const handleOpenAdd = () => {
    setEditingTask(null);
    setFormData({
      course: '',
      title: '',
      deadline: '2026-09-14',
      status: 'pending',
      total_points: 100,
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setFormData({
      course: task.course,
      title: task.title,
      deadline: task.deadline,
      status: task.status,
      total_points: task.total_points || 100,
      description: task.description || '',
    });
    setIsModalOpen(true);
  };

  const handleStatusChange = (task, newStatus) => {
    if (!isAdmin) {
      showToast('Students cannot change assignment status directly.', 'info');
      return;
    }
    try {
      dataService.updateAssignment(task.id, { status: newStatus }, tenant, activeSession?.role || 'admin');
      showToast('Moved to ' + newStatus, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      try {
        dataService.deleteAssignment(id, tenant, activeSession?.role || 'admin');
        showToast('Assignment removed', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        dataService.updateAssignment(editingTask.id, formData, tenant, activeSession?.role || 'admin');
        showToast('Assignment updated successfully', 'success');
      } else {
        dataService.addAssignment(formData, tenant, activeSession?.role || 'admin');
        showToast('Assignment created for section', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assignments & Coursework
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C5BAFF] text-indigo-950 dark:bg-campus-500/20 dark:text-campus-300 border border-[#C5BAFF] dark:border-campus-500/30 text-xs font-bold">
              {tenant.dept} {tenant.semester} (Sec {tenant.section})
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Section coursework status tracking from pending to graded.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-md shadow-campus-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {/* Admin Action Banner */}
      {isAdmin && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Admin Mode Active: Full CRUD permissions to create, edit, move status, or delete coursework tasks.
            </span>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create New Assignment</span>
          </button>
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = (assignments || []).filter((a) => a.status === col.id);

          return (
            <div
              key={col.id}
              className={'rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm flex flex-col'}
            >
              <div className="p-3.5 bg-[#E8F9FF] dark:bg-slate-950 border-b border-[#C4D9FF] dark:border-slate-800 flex items-center justify-between rounded-t-3xl">
                <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                  {col.title}
                </span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + col.badge}>
                  {colTasks.length}
                </span>
              </div>

              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[600px]">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-800/80 hover:border-campus-400 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-indigo-950 dark:text-campus-300 font-mono">
                        {task.course}
                      </span>
                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono font-semibold">
                        {task.total_points || 100} pts
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono pt-1">
                      <Clock className="w-3 h-3 text-campus-500" />
                      <span>Due: {task.deadline}</span>
                    </div>

                    {/* Admin Move Status & Edit */}
                    {isAdmin && (
                      <div className="pt-2 border-t border-[#C4D9FF]/60 dark:border-slate-800 flex items-center justify-between">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value)}
                          className="text-[10px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-700 py-1 px-1.5 text-slate-800 dark:text-slate-200"
                        >
                          <option value="pending">Move: Pending</option>
                          <option value="submitted">Move: Submitted</option>
                          <option value="graded">Move: Graded</option>
                          <option value="late">Move: Late</option>
                        </select>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(task)}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#E8F9FF] dark:hover:text-white"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {colTasks.length === 0 && (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No assignments in {col.title}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal (Admin Only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Assignment' : 'Create Assignment'}
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
                placeholder="e.g. CSE302"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Total Marks / Points
              </label>
              <input
                type="number"
                value={formData.total_points}
                onChange={(e) => setFormData({ ...formData, total_points: parseInt(e.target.value) || 100 })}
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
              placeholder="e.g. Lab Project Milestone 1"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Deadline Date
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Initial Pipeline Status
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
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Instructions
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Submission guidelines..."
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white"
            >
              {editingTask ? 'Save Changes' : 'Publish Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
