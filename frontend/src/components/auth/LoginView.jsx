import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  User,
  ArrowRight,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Eye,
  EyeOff,
  KeyRound,
  School,
  IdCard,
} from 'lucide-react';
import {
  DEPARTMENTS,
  SEMESTERS,
  SECTIONS,
  DEFAULT_TENANT,
  DEFAULT_STUDENT,
} from '../../constants/campus';
import { dataService } from '../../services/dataService';

export const LoginView = ({ onLoginSuccess, onLogin, theme, onToggleTheme }) => {
  const [roleTab, setRoleTab] = useState('student'); // 'student' | 'admin'
  const [dept, setDept] = useState('CSE');
  const [semester, setSemester] = useState('4.1');
  const [section, setSection] = useState('B');
  const [studentId, setStudentId] = useState(DEFAULT_STUDENT.student_id);
  const [studentName, setStudentName] = useState(DEFAULT_STUDENT.name);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e, forcedRole = null) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    const activeRole = forcedRole || roleTab;

    try {
      const payload = {
        dept,
        semester,
        section,
        password: activeRole === 'admin' ? password : '',
        student_id: studentId.trim() || DEFAULT_STUDENT.student_id,
        student_name: studentName.trim() || DEFAULT_STUDENT.name,
      };

      const res = await dataService.login(payload);
      setIsLoading(false);

      if (res.success) {
        const callback = onLoginSuccess || onLogin;
        if (callback) callback(res.session);
      } else {
        setErrorMsg(res.error || 'Access denied: invalid credentials.');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Authentication failed. Please try again.');
    }
  };

  const applyPreset = (presetDept, presetSem, presetSec, presetRole, presetPass = '') => {
    setDept(presetDept);
    setSemester(presetSem);
    setSection(presetSec);
    setRoleTab(presetRole);
    setPassword(presetPass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF] dark:from-[#090d16] dark:via-[#0c1222] dark:to-[#0f172a] text-slate-900 dark:text-slate-100 transition-colors duration-200 selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="p-4 sm:px-8 border-b border-indigo-100/80 dark:border-slate-800/80 bg-white/70 dark:bg-[#090d16]/70 backdrop-blur-xl flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 shadow-lg shadow-indigo-500/25 text-white font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
                CampusOS
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                v2.0 Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Intelligent University Timetable & AI Operations Command Center
            </p>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          title={'Switch to ' + (theme === 'dark' ? 'Light' : 'Dark') + ' Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </header>

      {/* Main Login Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg space-y-5">
          {/* Main Card */}
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/60 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6">
            
            {/* Header / Title */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 shadow-inner">
                {roleTab === 'admin' ? (
                  <ShieldCheck className="w-7 h-7" />
                ) : (
                  <User className="w-7 h-7" />
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {roleTab === 'admin' ? 'Section Admin Login' : 'Student Portal Sign-In'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {roleTab === 'admin'
                  ? 'Sign in with your Section Admin credentials to modify timetables, post circulars, and configure the AI Agent.'
                  : 'Select your academic tenant section to access routines, search open rooms, and register for campus events.'}
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setRoleTab('student');
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  roleTab === 'student'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Student Mode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRoleTab('admin');
                  setPassword('admin123'); // Prefill default for easy testing
                  setErrorMsg('');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  roleTab === 'admin'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Section Admin</span>
              </button>
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Tenant Triplet Selector: Dept, Semester, Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Department */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Semester */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Semester
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Section
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        Sec {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Mode - Direct 1-Click Access (No ID, No Password Required) */}
              {roleTab === 'student' && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Zero-friction Student Access
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      No Student ID or password required. Select your section above and enter instantly.
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Password Field */}
              {roleTab === 'admin' && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Admin Password
                    </label>
                    <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                      Default: admin123
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter admin password (admin123)"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </span>
                ) : (
                  <>
                    <span>
                      {roleTab === 'admin'
                        ? `Sign in as ${dept} ${semester} (${section}) Admin`
                        : `Enter CampusOS as Student`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Admin Credentials & Quick-Fill Chips */}
            <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  <span>1-Click Test Credentials</span>
                </span>
                <span className="text-[10px] text-slate-400">Click to autofill</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Admin CSE 4.1 B */}
                <button
                  type="button"
                  onClick={() => applyPreset('CSE', '4.1', 'B', 'admin', 'admin123')}
                  className="p-2.5 rounded-xl bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-200/80 dark:border-indigo-800/60 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200">
                      🛡️ Admin: CSE 4.1 Sec B
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-800/80 text-indigo-900 dark:text-indigo-100">
                      admin123
                    </span>
                  </div>
                  <div className="text-[10px] text-indigo-700/80 dark:text-indigo-400 mt-0.5">
                    Server default section · Full CRUD
                  </div>
                </button>

                {/* Admin CSE 3.2 A */}
                <button
                  type="button"
                  onClick={() => applyPreset('CSE', '3.2', 'A', 'admin', 'admin123')}
                  className="p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 border border-amber-200/80 dark:border-amber-800/60 text-left transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-200">
                      🛡️ Admin: CSE 3.2 Sec A
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100">
                      admin123
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                    Seed section · Full CRUD
                  </div>
                </button>

                {/* Student CSE 4.1 B */}
                <button
                  type="button"
                  onClick={() => applyPreset('CSE', '4.1', 'B', 'student', '')}
                  className="p-2.5 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    🎓 Student: CSE 4.1 Sec B
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sakibul Hassan (20-40532) · No pass
                  </div>
                </button>

                {/* Student CSE 3.2 A */}
                <button
                  type="button"
                  onClick={() => applyPreset('CSE', '3.2', 'A', 'student', '')}
                  className="p-2.5 rounded-xl bg-slate-100/70 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-all"
                >
                  <div className="font-bold text-slate-800 dark:text-slate-200">
                    🎓 Student: CSE 3.2 Sec A
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Sakibul Hasan · Offline & Sync
                  </div>
                </button>
              </div>
            </div>

          </div>

          {/* Helper Card */}
          <div className="px-6 py-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-center text-xs text-slate-500 dark:text-slate-400">
            <strong>Admin Credentials Summary:</strong> Password is <code className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 font-mono text-indigo-600 dark:text-indigo-400 font-bold">admin123</code> for all sections (<code className="font-mono">CSE</code>, <code className="font-mono">EEE</code>, <code className="font-mono">BBA</code>). Students sign in without a password.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60">
        CampusOS Multi-Tenancy Architecture · CSE Carnival 8 AI Build Hackathon
      </footer>
    </div>
  );
};

export default LoginView;
