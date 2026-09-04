import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  User,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';
import {
  dataService,
  DEPARTMENTS,
  SEMESTERS,
  SECTIONS,
  DEFAULT_TENANT,
} from '../../services/dataService';

export const LoginView = ({ onLoginSuccess, onLogin, theme, onToggleTheme }) => {
  const [dept, setDept] = useState(DEFAULT_TENANT.dept);
  const [semester, setSemester] = useState(DEFAULT_TENANT.semester);
  const [section, setSection] = useState(DEFAULT_TENANT.section);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e, forcedRole = null) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      // If forcedRole is 'student', ignore any password typed
      const payloadPassword = forcedRole === 'student' ? '' : password;
      const res = dataService.login({
        dept,
        semester,
        section,
        password: payloadPassword,
      });

      setIsLoading(false);
      if (res.success) {
        const callback = onLoginSuccess || onLogin;
        if (callback) callback(res.session);
      } else {
        setErrorMsg(res.error || 'Access denied.');
      }
    }, 200);
  };

  const handleDemoPreset = (d, sem, sec, isAdmin = false) => {
    setDept(d);
    setSemester(sem);
    setSection(sec);
    if (isAdmin) {
      setPassword('admin123');
    } else {
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FBFBFB] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="p-4 sm:px-8 border-b border-[#C4D9FF] dark:border-slate-800 bg-[#E8F9FF]/80 dark:bg-[#090d16]/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-campus-600 to-indigo-500 shadow-md shadow-campus-600/30 text-white font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">CampusOS</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#C5BAFF] text-indigo-950 dark:bg-campus-500/20 dark:text-campus-400 border border-[#C5BAFF] dark:border-campus-500/30">
                CSE Carnival 8
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">Multi-Tenant University Management & AI Command Center</p>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-[#E8F9FF] dark:hover:bg-slate-800 transition-colors shadow-sm"
          title={'Switch to ' + (theme === 'dark' ? 'Light' : 'Dark') + ' Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#E8F9FF] dark:bg-slate-800 border border-[#C4D9FF] dark:border-slate-700 text-campus-600 dark:text-campus-400 mb-1">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Tenant Section Sign-In</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select your academic section. Every piece of data is isolated to your Department, Semester, and Section.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
            {/* Dept Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Department
              </label>
              <select
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500 transition-all"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {d} (Department of {d})
                  </option>
                ))}
              </select>
            </div>

            {/* Semester Dropdown (Fixed 8 options) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Semester (Year.Term)
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500 transition-all"
              >
                {SEMESTERS.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500 transition-all"
              >
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional Password Field */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin Password (Optional)</span>
                </label>
                <span className="text-[10px] text-slate-500">Leave blank for Student</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password for Admin role (e.g. admin123)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-campus-500 focus:ring-1 focus:ring-campus-500 transition-all shadow-inner"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleLogin(e, 'student')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#E8F9FF] hover:bg-[#C4D9FF] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-[#C4D9FF] dark:border-slate-700 transition-all"
              >
                <User className="w-4 h-4 text-campus-600 dark:text-campus-400" />
                <span>Enter as Student</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-md shadow-campus-600/30 transition-all"
              >
                <span>{password ? 'Log in as Admin' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Shortcuts */}
          <div className="pt-4 border-t border-[#C4D9FF] dark:border-slate-800 space-y-2">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
              1-Click Demo Presets
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleDemoPreset('CSE', '3.2', 'A', false)}
                className="p-2 rounded-xl bg-[#E8F9FF]/60 hover:bg-[#E8F9FF] dark:bg-slate-950 dark:hover:bg-slate-800 border border-[#C4D9FF] dark:border-slate-800 text-left transition-colors"
              >
                <div className="font-bold text-slate-900 dark:text-white">CSE 3.2 Sec A</div>
                <div className="text-[10px] text-slate-500">Student (Seed Data)</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoPreset('CSE', '3.2', 'A', true)}
                className="p-2 rounded-xl bg-[#E8F9FF]/60 hover:bg-[#E8F9FF] dark:bg-slate-950 dark:hover:bg-slate-800 border border-[#C4D9FF] dark:border-slate-800 text-left transition-colors"
              >
                <div className="font-bold text-slate-900 dark:text-white">CSE 3.2 Sec A</div>
                <div className="text-[10px] text-campus-600 dark:text-campus-400 font-semibold">Admin (Full CRUD)</div>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-[#C4D9FF] dark:border-slate-800 bg-[#E8F9FF]/40 dark:bg-slate-950/40">
        CampusOS · Multi-Tenancy Architecture (dept, semester, section) · CSE Carnival 8 Hackathon
      </footer>
    </div>
  );
};
