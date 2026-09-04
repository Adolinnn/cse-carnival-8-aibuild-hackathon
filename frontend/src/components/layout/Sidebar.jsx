import React, { useState } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Sparkles,
  Megaphone,
  BookOpenCheck,
  RotateCcw,
  Sliders,
  ShieldCheck,
  User,
  LogOut,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { showToast } from '../common/Toast';
import { dataService } from '../../services/dataService';

export const Sidebar = ({ activeTab, setActiveTab, counts, session, onLogout }) => {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const isAdmin = session?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Campus Hub', icon: LayoutDashboard, badge: null },
    { id: 'schedules', label: 'Class Schedules', icon: CalendarDays, badge: counts?.schedules },
    { id: 'rooms', label: 'Rooms & Labs', icon: DoorOpen, badge: counts?.rooms },
    { id: 'events', label: 'Events & RSVP', icon: Sparkles, badge: counts?.events },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, badge: counts?.announcements },
    { id: 'assignments', label: 'Assignments', icon: BookOpenCheck, badge: counts?.assignments },
  ];

  // Admin Agent Settings Tab
  if (isAdmin) {
    navItems.push({
      id: 'agent-config',
      label: 'Agent Settings',
      icon: Sliders,
      badge: 'Admin',
    });
  }

  const handleResetConfirm = () => {
    dataService.resetToSeed();
    setIsResetModalOpen(false);
    showToast('Database reset to original seed data!', 'success');
  };

  return (
    <aside className="w-64 border-r border-[#C4D9FF] dark:border-slate-800 bg-[#FBFBFB] dark:bg-[#090d16] flex flex-col justify-between p-4 shrink-0 hidden md:flex transition-colors">
      {/* Navigation List */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Platform Systems
          </span>
          <span className={'text-[10px] font-bold px-2 py-0.5 rounded-full border ' +
            (isAdmin ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' : 'bg-campus-500/10 text-campus-700 dark:text-campus-400 border-campus-500/20')
          }>
            {isAdmin ? 'Admin Mode' : 'Student Mode'}
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ' +
                (isActive
                  ? 'bg-[#C5BAFF]/40 text-indigo-950 font-bold border border-[#C5BAFF] shadow-sm dark:bg-campus-600/20 dark:text-campus-400 dark:border-campus-500/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-[#E8F9FF] dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-900/60')
              }
            >
              <div className="flex items-center gap-3">
                <Icon className={'w-4 h-4 ' + (isActive ? 'text-indigo-700 dark:text-campus-400' : 'text-slate-500 dark:text-slate-400')} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={'text-[11px] font-semibold px-2 py-0.5 rounded-full ' +
                    (isActive
                      ? 'bg-[#C5BAFF] text-indigo-950 dark:bg-campus-500/30 dark:text-campus-300'
                      : 'bg-[#E8F9FF] text-slate-600 border border-[#C4D9FF] dark:bg-slate-800 dark:text-slate-400 dark:border-transparent')
                  }
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status & Seed Reset Button */}
      <div className="pt-4 border-t border-[#C4D9FF] dark:border-slate-800 space-y-3">
        {/* Status indicator */}
        <div className="p-3 rounded-xl bg-[#E8F9FF] border border-[#C4D9FF] dark:bg-slate-900/60 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Section Store Synced</span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Scoped to {session?.dept || 'CSE'} {session?.semester || '3.2'} (Sec {session?.section || 'A'}).
          </p>
        </div>

        {/* Log Out button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/40 transition-colors shadow-xs"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Log Out</span>
          </button>
        )}

        {/* Reset button */}
        <button
          onClick={() => setIsResetModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-[#C4D9FF]/40 border border-[#C4D9FF] dark:border-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Seed Data</span>
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Data to Seed State?"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            This will discard any modifications, bookings, or added items and restore all datasets back to initial seed data.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF] dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetConfirm}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
            >
              Confirm Reset
            </button>
          </div>
        </div>
      </Modal>
    </aside>
  );
};
