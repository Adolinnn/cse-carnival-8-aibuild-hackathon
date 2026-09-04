import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Tag,
  Share2,
  Edit2,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { showToast } from '../common/Toast';
import { dataService, DEFAULT_STUDENT } from '../../services/dataService';

export const EventsView = ({ events, session }) => {
  const activeSession = session || dataService.getSession();
  const isAdmin = activeSession?.role === 'admin';
  const tenant = activeSession || { dept: 'CSE', semester: '3.2', section: 'A' };

  const [searchFilter, setSearchFilter] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Add Event Modal (Admin Only)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Workshop',
    date: '2026-09-15',
    time: '14:00',
    location: 'Auditorium 7C01',
    capacity: 50,
    description: '',
    url: '',
    is_global: true,
  });

  // Edit Event Modal (Admin Only)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'Workshop',
    date: '2026-09-15',
    time: '14:00',
    location: 'Auditorium 7C01',
    capacity: 50,
    description: '',
    url: '',
    is_global: true,
  });

  // Roster Modal
  const [rosterEvent, setRosterEvent] = useState(null);

  const filteredEvents = (events || []).filter((e) => {
    const eventType =
      e.type ||
      (e.name?.toLowerCase().includes('hackathon')
        ? 'Hackathon'
        : e.name?.toLowerCase().includes('lecture')
        ? 'Guest Lecture'
        : e.name?.toLowerCase().includes('meeting')
        ? 'Club Meeting'
        : 'Workshop');
    const matchesType = filterType === 'All' || eventType === filterType;
    const venueOrLocation = e.location || e.venue || '';
    const matchesSearch =
      e.name?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      venueOrLocation.toLowerCase().includes(searchFilter.toLowerCase()) ||
      e.description?.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleRegister = (event) => {
    const res = dataService.registerForEvent(
      event.id,
      { student_id: DEFAULT_STUDENT.student_id, name: DEFAULT_STUDENT.name },
      tenant
    );
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleCancelRegister = (event) => {
    const res = dataService.cancelEventRegistration(
      event.id,
      DEFAULT_STUDENT.student_id,
      tenant
    );
    if (res.success) {
      showToast(res.message, 'info');
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleDeleteEvent = (id) => {
    if (confirm('Are you sure you want to remove this campus event?')) {
      try {
        dataService.deleteEvent(id, tenant, activeSession?.role || 'admin');
        showToast('Event removed', 'info');
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    try {
      dataService.addEvent(
        {
          ...formData,
          registered_students: [],
        },
        tenant,
        activeSession?.role || 'admin'
      );
      showToast('Event published successfully', 'success');
      setIsAddOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setEditFormData({
      name: event.name || '',
      type: event.type || 'Workshop',
      date: event.date || '2026-09-15',
      time: event.time || event.start_time || '14:00',
      location: event.location || event.venue || 'Auditorium 7C01',
      capacity: event.capacity || 50,
      description: event.description || '',
      url: event.url || '',
      is_global: event.is_global ?? true,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      dataService.updateEvent(
        editingEvent.id || editingEvent._id,
        {
          ...editFormData,
          capacity: Number(editFormData.capacity),
          venue: editFormData.location,
        },
        tenant,
        activeSession?.role || 'admin'
      );
      showToast('Event updated successfully', 'success');
      setIsEditOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCancel = handleCancelRegister;
  const handleCreateEvent = handleAddSubmit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Campus Events & RSVP
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-[#C5BAFF] text-indigo-950 dark:bg-campus-500/20 dark:text-campus-300 border border-[#C5BAFF] dark:border-campus-500/30 text-xs font-bold">
              Campus-Wide & Section Events
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Discover workshops, hackathons, and guest lectures with 1-click registration.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-md shadow-campus-600/30 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Admin Action Banner */}
      {isAdmin && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Admin Mode Active: Full CRUD permissions to create events, manage participant rosters, or remove events.
            </span>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Create New Event</span>
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'Workshop', 'Hackathon', 'Guest Lecture', 'Club Meeting'].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={'px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ' +
                (filterType === t
                  ? 'bg-[#C5BAFF] text-indigo-950 dark:bg-campus-600 dark:text-white'
                  : 'bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF]')
              }
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search events or venue..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const regs = event.registrations || [];
          const currentStudentId =
            activeSession?.user?.student_id ||
            activeSession?.student_id ||
            DEFAULT_STUDENT.student_id;
          const isRegistered = regs.some((r) => r.student_id === currentStudentId);
          const percent = event.capacity ? Math.min(100, Math.round((regs.length / event.capacity) * 100)) : 0;
          const isFull = event.capacity ? regs.length >= event.capacity : false;
          const eventType =
            event.type ||
            (event.name?.toLowerCase().includes('hackathon')
              ? 'Hackathon'
              : event.name?.toLowerCase().includes('lecture')
              ? 'Guest Lecture'
              : event.name?.toLowerCase().includes('meeting')
              ? 'Club Meeting'
              : 'Workshop');

          return (
            <div
              key={event.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#E8F9FF] dark:bg-slate-800 text-[11px] font-bold text-campus-700 dark:text-campus-300 border border-[#C4D9FF] dark:border-slate-700">
                    {eventType}
                  </span>
                  <span className={'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ' +
                    (event.is_global
                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800')
                  }>
                    {event.is_global ? 'Campus-Wide' : 'Section Only'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {event.name}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {event.description}
                </p>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-campus-500" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{event.date}</span> at {event.time || event.start_time || '10:00'}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-campus-500" />
                    <span>{event.location || event.venue || 'Campus Venue'}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    <button
                      onClick={() => setRosterEvent(event)}
                      className="hover:underline text-campus-600 dark:text-campus-400 font-bold"
                    >
                      {regs.length} Registered (View Roster)
                    </button>
                    <span>{event.capacity ? event.capacity + ' seats' : 'Open'}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E8F9FF] dark:bg-slate-800 overflow-hidden">
                    <div
                      className={'h-full rounded-full transition-all ' + (isFull ? 'bg-rose-500' : 'bg-campus-600')}
                      style={{ width: percent + '%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {/* Event URL / Details Button */}
                {event.url ? (
                  <button
                    onClick={() => {
                      const targetUrl = event.url.startsWith('http') ? event.url : `https://${event.url}`;
                      window.open(targetUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-[#E8F9FF] hover:bg-[#C4D9FF] dark:bg-slate-800 dark:hover:bg-slate-700 text-campus-700 dark:text-campus-300 border border-[#C4D9FF] dark:border-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    title="Open official event link in new tab"
                  >
                    <span>Open Event Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                ) : null}

                {/* RSVP / Registration Button */}
                {isRegistered ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{"You're Registered"}</span>
                    </div>
                    <button
                      onClick={() => handleCancel(event)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-300 dark:border-rose-900 transition-colors"
                      title="Cancel RSVP"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (event.url && !isRegistered) {
                        // Open URL and register
                        const targetUrl = event.url.startsWith('http') ? event.url : `https://${event.url}`;
                        window.open(targetUrl, '_blank', 'noopener,noreferrer');
                      }
                      handleRegister(event);
                    }}
                    disabled={isFull}
                    className={'w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 ' +
                      (isFull
                        ? 'bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed'
                        : 'bg-campus-600 hover:bg-campus-500 text-white shadow-campus-600/20')
                    }
                  >
                    {isFull ? (
                      'Event Full (Waitlist)'
                    ) : event.url ? (
                      <>
                        <span>Register / View Event</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      '1-Click RSVP'
                    )}
                  </button>
                )}

                {isAdmin && (
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#C4D9FF]/40 dark:border-slate-800">
                    <button
                      onClick={() => handleOpenEdit(event)}
                      className="py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id || event._id)}
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

      {/* Roster Modal */}
      <Modal
        isOpen={Boolean(rosterEvent)}
        onClose={() => setRosterEvent(null)}
        title={rosterEvent ? 'Attendee Roster: ' + rosterEvent.name : ''}
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-600 dark:text-slate-400">
            Total Registrations: <strong>{rosterEvent?.registrations?.length || 0}</strong>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-[#C4D9FF]/60 dark:divide-slate-800 border border-[#C4D9FF] dark:border-slate-800 rounded-xl">
            {(rosterEvent?.registrations || []).map((r, i) => (
              <div key={i} className="p-3 text-xs flex items-center justify-between">
                <div className="font-bold text-slate-900 dark:text-white">{r.name}</div>
                <div className="text-[11px] text-slate-500">{r.student_id} · {r.dept} {r.semester}-{r.section}</div>
              </div>
            ))}
            {(rosterEvent?.registrations || []).length === 0 && (
              <div className="p-4 text-center text-xs text-slate-500">
                No students have registered yet. Be the first!
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Create Event Modal (Admin Only) */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Campus Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Event Title
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Workshop on Cloud Architecture"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Event Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="Workshop">Workshop</option>
                <option value="Hackathon">Hackathon</option>
                <option value="Guest Lecture">Guest Lecture</option>
                <option value="Club Meeting">Club Meeting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Audience Scope
              </label>
              <select
                value={formData.is_global ? 'global' : 'section'}
                onChange={(e) => setFormData({ ...formData, is_global: e.target.value === 'global' })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              >
                <option value="global">Campus-Wide (All Sections)</option>
                <option value="section">Section-Only ({tenant.dept} {tenant.semester} {tenant.section})</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Capacity
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Venue / Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Auditorium 7C01"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Event Website / Registration URL
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://example.com/event-details-or-rsvp"
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief details about the event..."
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#C4D9FF] dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF] dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white"
            >
              Publish Event
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Event Modal */}
      {isAdmin && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Edit Event: ${editingEvent?.name || ''}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Event Name
              </label>
              <input
                type="text"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Event Type
                </label>
                <select
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="Workshop">Workshop</option>
                  <option value="Hackathon">Hackathon</option>
                  <option value="Guest Lecture">Guest Lecture</option>
                  <option value="Club Meeting">Club Meeting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Audience Scope
                </label>
                <select
                  value={editFormData.is_global ? 'global' : 'section'}
                  onChange={(e) => setEditFormData({ ...editFormData, is_global: e.target.value === 'global' })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                >
                  <option value="global">Campus-Wide (All Sections)</option>
                  <option value="section">Section-Only ({tenant.dept} {tenant.semester} {tenant.section})</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={editFormData.time}
                  onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Capacity
                </label>
                <input
                  type="number"
                  value={editFormData.capacity}
                  onChange={(e) => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value, 10) || 50 })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Venue / Location
              </label>
              <input
                type="text"
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                placeholder="e.g. Auditorium 7C01"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Event Website / Registration URL
              </label>
              <input
                type="url"
                value={editFormData.url}
                onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                placeholder="https://example.com/event-details-or-rsvp"
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Brief details about the event..."
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#C4D9FF] dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF] dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Update Event
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
