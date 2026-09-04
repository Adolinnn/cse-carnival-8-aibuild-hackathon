import React, { useState } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  User,
  Trash2,
  Edit2,
  Search,
  Filter,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { showToast } from '../common/Toast';
import { dataService } from '../../services/dataService';

export const SchedulesView = ({ schedules, session }) => {
  const activeSession = session || dataService.getSession();
  const isAdmin = activeSession?.role === 'admin';
  const tenant = activeSession || { dept: 'CSE', semester: '3.2', section: 'A' };

  const [selectedDay, setSelectedDay] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' or 'list'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    day: 'Sunday',
    start_time: '09:00',
    end_time: '10:30',
    room: '7A01',
    instructor: '',
  });

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];

  const filteredSchedules = (schedules || []).filter((s) => {
    const matchesDay = selectedDay === 'All' || s.day === selectedDay;
    const matchesSearch =
      s.course?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.title?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.instructor?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.room?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesDay && matchesSearch;
  });

  const handleOpenAdd = () => {
    setEditingSchedule(null);
    setFormData({
      course: '',
      title: '',
      day: 'Sunday',
      start_time: '09:00',
      end_time: '10:30',
      room: '7A01',
      instructor: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sched) => {
    setEditingSchedule(sched);
    setFormData({
      course: sched.course,
      title: sched.title,
      day: sched.day,
      start_time: sched.start_time,
      end_time: sched.end_time,
      room: sched.room,
      instructor: sched.instructor,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to remove this schedule slot?')) {
      try {
        dataService.deleteSchedule(id, tenant, activeSession?.role || 'admin');
        showToast('Schedule removed successfully', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        dataService.updateSchedule(editingSchedule.id, formData, tenant, activeSession?.role || 'admin');
        showToast('Schedule updated successfully', 'success');
      } else {
        dataService.addSchedule(formData, tenant, activeSession?.role || 'admin');
        showToast('Schedule added to routine', 'success');
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Class Schedules & Timetable
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C5BAFF] text-indigo-950 dark:bg-campus-500/20 dark:text-campus-300 border border-[#C5BAFF] dark:border-campus-500/30 text-xs font-bold">
              {tenant.dept} {tenant.semester} (Sec {tenant.section})
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Weekly academic routine filtered strictly to your section tenant.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Matrix / List toggle */}
          <div className="p-1 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 flex text-xs">
            <button
              onClick={() => setViewMode('matrix')}
              className={'px-3 py-1.5 rounded-lg font-bold transition-colors ' +
                (viewMode === 'matrix'
                  ? 'bg-campus-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
              }
            >
              Matrix
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={'px-3 py-1.5 rounded-lg font-bold transition-colors ' +
                (viewMode === 'list'
                  ? 'bg-campus-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
              }
            >
              List
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-md shadow-campus-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Action Banner */}
      {isAdmin && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Admin Mode Active: Full CRUD permissions to add, edit, or delete class slots from the routine.
            </span>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add New Class</span>
          </button>
        </div>
      )}

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['All', ...DAYS].map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={'px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ' +
                (selectedDay === day
                  ? 'bg-[#C5BAFF] text-indigo-950 font-bold border border-[#C5BAFF] dark:bg-campus-600 dark:text-white dark:border-campus-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF] dark:hover:bg-slate-800')
              }
            >
              {day}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter course or instructor..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-campus-500"
          />
        </div>
      </div>

      {/* Routine Content */}
      {viewMode === 'matrix' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(selectedDay === 'All' ? DAYS : [selectedDay]).map((day) => {
            const daySchedules = filteredSchedules
              .filter((s) => s.day === day)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));

            return (
              <div
                key={day}
                className="rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 overflow-hidden shadow-sm"
              >
                <div className="p-3.5 bg-[#E8F9FF] dark:bg-slate-950 border-b border-[#C4D9FF] dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{day}</h3>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
                  </span>
                </div>

                <div className="p-3 space-y-2.5">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-800/80 hover:border-campus-400 transition-all space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-indigo-950 dark:text-campus-300 font-mono">
                            {s.course}
                          </span>
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1 font-mono">
                            <Clock className="w-3 h-3 text-campus-500" />
                            {s.start_time} - {s.end_time}
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {s.title}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-300">
                            <MapPin className="w-3 h-3 text-campus-500" />
                            Room {s.room}
                          </span>
                          <span className="truncate max-w-[140px] text-right">{s.instructor}</span>
                        </div>

                        {isAdmin && (
                          <div className="flex justify-end gap-1 pt-1.5 border-t border-[#C4D9FF]/60 dark:border-slate-800">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#E8F9FF] dark:hover:text-white"
                              title="Edit Class"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400"
                              title="Delete Class"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No classes on this day.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table List View */
        <div className="rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#E8F9FF] dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-b border-[#C4D9FF] dark:border-slate-800 uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3.5">Course</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Day</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Room</th>
                <th className="p-3.5">Instructor</th>
                {isAdmin && <th className="p-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C4D9FF]/60 dark:divide-slate-800">
              {filteredSchedules.map((s) => (
                <tr key={s.id} className="hover:bg-[#E8F9FF]/40 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-indigo-950 dark:text-campus-300">{s.course}</td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{s.title}</td>
                  <td className="p-3.5 font-medium text-slate-700 dark:text-slate-300">{s.day}</td>
                  <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">{s.start_time} - {s.end_time}</td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">Room {s.room}</td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">{s.instructor}</td>
                  {isAdmin && (
                    <td className="p-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-[#E8F9FF] dark:hover:text-white"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Class Modal (Admin Only) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Class Schedule' : 'Add Class to Routine'}
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
                placeholder="e.g. CSE301"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Day of Week
              </label>
              <select
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Course Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Operating Systems"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                End Time
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Room
              </label>
              <input
                type="text"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="7A01"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Instructor Name
            </label>
            <input
              type="text"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
              placeholder="e.g. Dr. Kazi Sakib"
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
              {editingSchedule ? 'Save Changes' : 'Add Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
