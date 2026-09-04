import React, { useState } from 'react';
import {
  GraduationCap,
  Clock,
  Search,
  Bot,
  User,
  Sparkles,
  ChevronDown,
  Calendar,
  Sun,
  Moon,
  LogOut,
  Shield,
  Layers,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import {
  DEFAULT_STUDENT,
  DEFAULT_SIMULATED_DATE,
  DEFAULT_SIMULATED_TIME,
} from '../../services/dataService';

export const Header = ({
  onToggleAgent,
  isAgentOpen,
  onSearch,
  simulatedDate,
  setSimulatedDate,
  simulatedTime,
  simulatedTimeWithSeconds,
  setSimulatedTime,
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  session,
  onLogout,
}) => {
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [tempDate, setTempDate] = useState(simulatedDate);
  const [tempTime, setTempTime] = useState(simulatedTime);
  const [searchVal, setSearchVal] = useState('');

  const isAdmin = session?.role === 'admin';

  const handleSaveTime = (e) => {
    e.preventDefault();
    setSimulatedDate(tempDate);
    setSimulatedTime(tempTime);
    setIsTimeModalOpen(false);
  };

  const handleResetTime = () => {
    setTempDate(DEFAULT_SIMULATED_DATE);
    setTempTime(DEFAULT_SIMULATED_TIME);
    setSimulatedDate(DEFAULT_SIMULATED_DATE);
    setSimulatedTime(DEFAULT_SIMULATED_TIME);
    setIsTimeModalOpen(false);
  };

  const handleSearchChange = (e) => {
    setSearchVal(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="sticky top-0 z-40 h-16 border-b border-[#C4D9FF] dark:border-slate-800 bg-[#FBFBFB]/95 dark:bg-[#090d16]/95 backdrop-blur-md px-2.5 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-4 transition-colors">
      {/* Brand & Tenant Pill */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-campus-600 to-indigo-500 shadow-md shadow-campus-600/30 text-white font-bold shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">CampusOS</span>
            {session && (
              <span className={'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border truncate ' +
                (isAdmin
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/40'
                  : 'bg-[#C5BAFF]/40 text-indigo-950 dark:bg-campus-500/20 dark:text-campus-300 border-[#C5BAFF] dark:border-campus-500/30')
              }>
                <span className="sm:hidden">{session.dept} {session.semester} · {isAdmin ? 'Admin' : 'Student'}</span>
                <span className="hidden sm:inline">{session.dept} {session.semester} (Sec {session.section}) · {isAdmin ? 'Admin' : 'Student'}</span>
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 hidden lg:block">Intelligent University Command Center</p>
        </div>
      </div>

      {/* Global Search */}
      <div className="hidden lg:flex flex-1 max-w-xs xl:max-w-md items-center relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={searchVal}
          onChange={handleSearchChange}
          placeholder="Search routine, rooms, events..."
          className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-[#C4D9FF] dark:border-slate-700/60 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500 transition-all shadow-inner"
        />
      </div>

      {/* Right Controls: Theme Toggle, Clock, Logout & austchan AI Button */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 sm:p-2 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-700/80 text-slate-700 dark:text-slate-200 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-sm"
          title={'Switch to ' + (theme === 'dark' ? 'Light' : 'Dark') + ' Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Simulated Dynamic Time Picker Pill */}
        <button
          onClick={() => setIsTimeModalOpen(true)}
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-700/80 text-xs text-slate-800 dark:text-slate-200 hover:border-campus-500/50 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-sm group"
          title="Click to adjust simulated campus clock (Live Ticking Active)"
        >
          <Clock className="w-3.5 h-3.5 text-campus-500 dark:text-campus-400 shrink-0 group-hover:rotate-12 transition-transform" />
          <span className="hidden xl:inline font-mono text-slate-700 dark:text-slate-300 font-semibold tracking-wide">
            {simulatedDate} · {simulatedTimeWithSeconds || simulatedTime}
          </span>
          <span className="xl:hidden font-mono text-slate-700 dark:text-slate-300 font-semibold tracking-wide">
            {simulatedTimeWithSeconds || simulatedTime}
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/50 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors shadow-xs"
          title="Log Out of current session"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="hidden sm:inline font-semibold">Log Out</span>
        </button>

        {/* austchan AI Toggle Button */}
        <button
          onClick={onToggleAgent}
          className={'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md shrink-0 ' +
            (isAgentOpen
              ? 'bg-campus-600 text-white shadow-campus-600/30 border border-campus-400'
              : 'bg-white dark:bg-slate-800 hover:bg-[#E8F9FF] dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-[#C4D9FF] dark:border-slate-700')
          }
          title="Open austchan AI Copilot"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse shrink-0" />
          <span className="font-extrabold text-xs">austchan</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>
      </div>

      {/* Simulated Time Modal */}
      <Modal
        isOpen={isTimeModalOpen}
        onClose={() => setIsTimeModalOpen(false)}
        title="Simulated Campus Clock"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            The dataset is set in <strong>September 2026</strong>. Adjusting the campus clock allows you to test temporal queries like <em>"When is my next class?"</em>, <em>"What is due this week?"</em>, and <em>"I am free until 2 PM"</em>.
          </p>

          <form onSubmit={handleSaveTime} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Simulated Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-campus-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Simulated 24-Hour Time (HH:MM)
              </label>
              <input
                type="time"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-campus-500"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#C4D9FF] dark:border-slate-800">
              <button
                type="button"
                onClick={handleResetTime}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white underline transition-colors"
              >
                Reset to Wed, Sep 9, 10:00 AM
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-campus-600 hover:bg-campus-500 text-white transition-colors"
                >
                  Apply Time
                </button>
              </div>
            </div>
          </form>
        </div>
      </Modal>
    </header>
  );
};
