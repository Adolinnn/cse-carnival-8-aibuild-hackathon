import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Calendar,
  AlertCircle,
  Clock,
  Trash2,
  Edit2,
  Search,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { showToast } from '../common/Toast';
import { dataService } from '../../services/dataService';

export const AnnouncementsView = ({ announcements, session }) => {
  const activeSession = session || dataService.getSession();
  const isAdmin = activeSession?.role === 'admin';
  const tenant = activeSession || { dept: 'CSE', semester: '3.2', section: 'A' };

  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    priority: 'medium',
    date: '2026-09-09',
  });

  const filtered = (announcements || []).filter((a) => {
    const matchesPriority = selectedPriority === 'All' || a.priority === selectedPriority;
    const matchesSearch =
      a.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      a.body?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      body: '',
      priority: 'medium',
      date: '2026-09-09',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      body: notice.body,
      priority: notice.priority,
      date: notice.date,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this notice?')) {
      try {
        dataService.deleteAnnouncement(id, tenant, activeSession?.role || 'admin');
        showToast('Notice deleted', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingNotice) {
        dataService.updateAnnouncement(editingNotice.id, formData, tenant, activeSession?.role || 'admin');
        showToast('Notice updated successfully', 'success');
      } else {
        dataService.addAnnouncement(formData, tenant, activeSession?.role || 'admin');
        showToast('Notice published to section', 'success');
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
              Announcements & Notice Board
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C5BAFF] text-indigo-950 dark:bg-campus-500/20 dark:text-campus-300 border border-[#C5BAFF] dark:border-campus-500/30 text-xs font-bold">
              {tenant.dept} {tenant.semester} (Sec {tenant.section})
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Official department notices, room shifts, and coursework alerts for your section.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-md shadow-campus-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Post Notice</span>
          </button>
        )}
      </div>

      {/* Admin Action Banner */}
      {isAdmin && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Admin Mode Active: Full CRUD permissions to post, edit, or remove section announcements.
            </span>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Post New Notice</span>
          </button>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'high', 'medium', 'low'].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={'px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-colors ' +
                (selectedPriority === p
                  ? 'bg-[#C5BAFF] text-indigo-950 dark:bg-campus-600 dark:text-white'
                  : 'bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF]')
              }
            >
              {p}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search notice content..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-3">
        {filtered.map((notice) => (
          <div
            key={notice.id}
            className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-2.5 hover:border-campus-400 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={'text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ' +
                  (notice.priority === 'high'
                    ? 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                    : notice.priority === 'medium'
                    ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30'
                    : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30')
                }>
                  {notice.priority} Priority
                </span>
                <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                  <Calendar className="w-3.5 h-3.5" />
                  {notice.date}
                </span>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(notice)}
                    className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#E8F9FF] dark:hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {notice.title}
            </h3>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {notice.body}
            </p>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-slate-500 text-xs">
            No announcements found matching the filter.
          </div>
        )}
      </div>

      {/* Add / Edit Modal (Admin Only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingNotice ? 'Edit Announcement' : 'Post Section Announcement'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Makeup class scheduled for Sunday"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="high">High (Urgent)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Notice Body
            </label>
            <textarea
              rows={4}
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              placeholder="Provide full details..."
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              required
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
              {editingNotice ? 'Save Changes' : 'Broadcast'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
