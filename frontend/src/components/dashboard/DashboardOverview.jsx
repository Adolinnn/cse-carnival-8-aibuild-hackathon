import React from 'react';
import {
  Calendar,
  DoorOpen,
  Sparkles,
  Megaphone,
  BookOpenCheck,
  Clock,
  ArrowRight,
  Plus,
  Flame,
  CheckCircle,
  AlertCircle,
  MapPin,
  Users,
  Shield,
  Bot,
} from 'lucide-react';

import { dataService } from '../../services/dataService';

export const DashboardOverview = ({
  schedules,
  rooms,
  events,
  announcements,
  assignments,
  simulatedDate,
  simulatedTime,
  onNavigate,
  onOpenAgentWithQuery,
  session,
}) => {
  const activeSession = session || dataService.getSession();
  const isAdmin = activeSession?.role === 'admin';
  const tenant = activeSession || { dept: 'CSE', semester: '3.2', section: 'A' };

  // Determine current day of week from simulated date
  const dateObj = new Date(simulatedDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = dayNames[dateObj.getDay()];

  // Today's classes sorted by time
  const todayClasses = (schedules || [])
    .filter((s) => s.day?.toLowerCase() === currentDay.toLowerCase())
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Next upcoming class
  const nextClass = todayClasses.find((s) => s.start_time >= simulatedTime) || todayClasses[0];

  // High priority announcements
  const highNotices = (announcements || []).filter((a) => a.priority === 'high');

  // Available rooms right now (dynamically checking bookings for simulated date & time)
  const availableRooms = (rooms || []).filter((r) => {
    if (r.status !== 'available') return false;
    const bookings = r.bookings || [];
    const isBookedNow = bookings.some(
      (b) => b.date === simulatedDate && b.start_time <= simulatedTime && b.end_time > simulatedTime
    );
    return !isBookedNow;
  });

  // Pending assignments
  const pendingAssignments = (assignments || []).filter((a) => a.status === 'pending');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#E8F9FF] via-[#FBFBFB] to-[#C5BAFF]/30 dark:from-campus-900/40 dark:via-slate-900 dark:to-indigo-950/40 border border-[#C4D9FF] dark:border-campus-500/20 p-5 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-campus-500/20 border border-[#C4D9FF] dark:border-campus-500/30 text-xs font-semibold text-slate-800 dark:text-campus-300 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-campus-600 dark:text-campus-400" />
            <span>Section {tenant.dept} {tenant.semester} (Sec {tenant.section}) · {isAdmin ? 'Administrator Console' : 'Student Portal'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Welcome to CampusOS
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Your university command hub. All class routines, notices, and deadlines are isolated to your section, with real-time access to global campus facilities and AI function calling.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={() => onOpenAgentWithQuery('When is my next class?')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-md shadow-campus-600/30 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Ask austchan</span>
            </button>
            <button
              onClick={() => onNavigate('schedules')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-[#E8F9FF] dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-[#C4D9FF] dark:border-slate-700 transition-all shadow-sm"
            >
              <span>View Class Routine</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Admin CRUD Quick Operations Section */}
      {isAdmin && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-400/40 dark:bg-amber-950/20 dark:border-amber-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                Administrator CRUD & Management Center
              </h2>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/30">
              Admin Mode Active
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <button
              onClick={() => onNavigate('schedules')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Add Class</span>
            </button>
            <button
              onClick={() => onNavigate('announcements')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Post Notice</span>
            </button>
            <button
              onClick={() => onNavigate('assignments')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Create Task</span>
            </button>
            <button
              onClick={() => onNavigate('events')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Add Event</span>
            </button>
            <button
              onClick={() => onNavigate('rooms')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <DoorOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Reserve Room</span>
            </button>
            <button
              onClick={() => onNavigate('agent-config')}
              className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>AI Config</span>
            </button>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes Today */}
        <div
          onClick={() => onNavigate('schedules')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 hover:border-campus-400 dark:hover:border-campus-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 uppercase">{currentDay}</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {todayClasses.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Classes Scheduled Today</div>
        </div>

        {/* Available Rooms */}
        <div
          onClick={() => onNavigate('rooms')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DoorOpen className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Campus Shared</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {availableRooms.length} <span className="text-sm font-normal text-slate-500">/ {rooms?.length || 20}</span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Free Rooms Right Now</div>
        </div>

        {/* Urgent Notices */}
        <div
          onClick={() => onNavigate('announcements')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">High Priority</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {highNotices.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Urgent Notices Posted</div>
        </div>

        {/* Due Coursework */}
        <div
          onClick={() => onNavigate('assignments')}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all cursor-pointer shadow-sm group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpenCheck className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Deadlines</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {pendingAssignments.length}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-1">Pending Assignments</div>
        </div>
      </div>

      {/* Two-Column Middle Section: Next Class & Notices Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next Class Spotlight Card */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Clock className="w-4 h-4 text-campus-600 dark:text-campus-400" />
              <span>Next Scheduled Session</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Simulated: {simulatedTime}
            </span>
          </div>

          {nextClass ? (
            <div className="p-5 rounded-2xl bg-[#E8F9FF] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#C5BAFF] text-indigo-950 dark:bg-campus-600/30 dark:text-campus-300 text-xs font-bold font-mono">
                    {nextClass.course}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">{nextClass.day}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {nextClass.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                    <MapPin className="w-3.5 h-3.5 text-campus-600 dark:text-campus-400" />
                    Room {nextClass.room}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {nextClass.instructor}
                  </span>
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <div className="text-xl font-extrabold text-indigo-950 dark:text-campus-300 font-mono">
                  {nextClass.start_time} - {nextClass.end_time}
                </div>
                <button
                  onClick={() => onNavigate('schedules')}
                  className="mt-2 text-xs font-semibold text-campus-600 dark:text-campus-400 hover:underline inline-flex items-center gap-1"
                >
                  Full Routine <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-2xl bg-[#E8F9FF]/40 border border-[#C4D9FF] dark:bg-slate-950 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-sm">
              No classes scheduled for today. You are free!
            </div>
          )}

          {/* Quick AI Chips */}
          <div className="pt-2 border-t border-[#C4D9FF] dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 shrink-0">Ask AI:</span>
            {[
              'When is my next class?',
              'What classes do I have on Wednesday?',
              'What assignments do I have due this week?',
            ].map((q, i) => (
              <button
                key={i}
                onClick={() => onOpenAgentWithQuery(q)}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-[#E8F9FF] hover:bg-[#C4D9FF] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-[#C4D9FF] dark:border-slate-700 text-xs font-medium transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Notices Ticker Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Megaphone className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Section Notices</span>
            </div>
            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs font-bold text-campus-600 dark:text-campus-400 hover:underline"
            >
              All Notices
            </button>
          </div>

          <div className="space-y-3">
            {(announcements || []).slice(0, 3).map((notice) => (
              <div
                key={notice.id}
                className="p-3.5 rounded-2xl bg-[#E8F9FF]/60 dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className={'text-[10px] font-bold uppercase px-2 py-0.5 rounded ' +
                    (notice.priority === 'high'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300')
                  }>
                    {notice.priority}
                  </span>
                  <span className="text-[10px] text-slate-500">{notice.date}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                  {notice.title}
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {notice.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
