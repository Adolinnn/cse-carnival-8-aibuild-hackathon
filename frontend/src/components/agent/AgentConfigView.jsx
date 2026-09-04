import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Key,
  Globe,
  Bot,
  RotateCcw,
  ShieldCheck,
  Save,
  CheckCircle,
  Eye,
  EyeOff,
  UserPlus,
  Trash2,
  Lock,
  UserCheck,
  Shield,
  Sparkles,
} from 'lucide-react';
import { showToast } from '../common/Toast';
import { dataService, NON_OVERRIDABLE_SAFETY_WRAPPER } from '../../services/dataService';
import { api } from '../../services/api';
import { DEPARTMENTS, SEMESTERS, SECTIONS } from '../../constants/campus';

export const AgentConfigView = ({ session }) => {
  const tenant = session || { dept: 'CSE', semester: '4.1', section: 'B' };
  const isAdmin = session?.role === 'admin';

  const [activeTab, setActiveTab] = useState('agent'); // 'agent' | 'superadmin'

  // Agent Config State
  const [config, setConfig] = useState(() => dataService.getAgentConfig(tenant));
  const [showKey, setShowKey] = useState(false);

  // Super Admin: Admins List State
  const [adminsList, setAdminsList] = useState([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Add / Update Admin Form State
  const [adminDept, setAdminDept] = useState('CSE');
  const [adminSemester, setAdminSemester] = useState('4.1');
  const [adminSection, setAdminSection] = useState('B');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  useEffect(() => {
    setConfig(dataService.getAgentConfig(tenant));
  }, [tenant.dept, tenant.semester, tenant.section]);

  const loadAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const list = await api.getAdmins(session);
      setAdminsList(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Could not load admins list:', err.message);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'superadmin') {
      loadAdmins();
    }
  }, [activeTab]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-rose-600 font-bold">
        Access Denied: Only Section Administrators can configure AI Copilot parameters or manage administrators.
      </div>
    );
  }

  const handleSaveAgentConfig = (e) => {
    e.preventDefault();
    try {
      dataService.saveAgentConfig(tenant, config, session.role);
      showToast(
        `AI Agent Configuration saved for Section ${tenant.dept} ${tenant.semester} (${tenant.section})`,
        'success'
      );
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleResetDefault = () => {
    if (confirm('Reset custom prompt to default section template?')) {
      const def = dataService.resetAgentConfig(tenant, session.role);
      setConfig(def);
      showToast('Agent prompt restored to section defaults', 'info');
    }
  };

  const handleCreateOrUpdateAdmin = async (e) => {
    e.preventDefault();
    if (!adminPassword || adminPassword.trim().length < 4) {
      showToast('Admin password must be at least 4 characters.', 'error');
      return;
    }

    setIsSubmittingAdmin(true);
    try {
      const res = await api.createOrUpdateAdmin(
        {
          dept: adminDept,
          semester: adminSemester,
          section: adminSection,
          password: adminPassword.trim(),
        },
        session
      );
      showToast(
        `Admin credentials successfully configured for ${adminDept} ${adminSemester} Sec ${adminSection}!`,
        'success'
      );
      setAdminPassword('');
      loadAdmins();
    } catch (err) {
      showToast(err.message || 'Failed to update admin credentials.', 'error');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (admin) => {
    const key = admin._id || `${admin.dept}:${admin.semester}:${admin.section}`;
    if (!confirm(`Remove admin credentials for ${admin.dept} ${admin.semester} Sec ${admin.section}?`)) {
      return;
    }

    try {
      await api.deleteAdmin(key, session);
      showToast(`Admin credentials removed for ${key}`, 'info');
      loadAdmins();
    } catch (err) {
      showToast(err.message || 'Failed to remove admin credentials.', 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Administration & AI Management
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-xs font-bold">
            {tenant.dept} {tenant.semester} (Sec {tenant.section}) · Admin
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Configure Copilot LLM providers and manage university section admin credentials with password protection.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => setActiveTab('agent')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'agent'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>AI Agent Configuration</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('superadmin')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'superadmin'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Super Admin: Manage Section Admins</span>
        </button>
      </div>

      {/* TAB 1: AI AGENT CONFIG */}
      {activeTab === 'agent' && (
        <form onSubmit={handleSaveAgentConfig} className="space-y-6">
          {/* Provider & API Credentials */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>LLM Backend Provider & Keys</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  API Base URL
                </label>
                <input
                  type="text"
                  value={config.api_base_url || ''}
                  onChange={(e) => setConfig({ ...config, api_base_url: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500">Supports OpenAI-compatible, Groq, Ollama, Anthropic</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={config.model_name || ''}
                  onChange={(e) => setConfig({ ...config, model_name: e.target.value })}
                  placeholder="gpt-4o-mini / llama-3.3-70b-versatile"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500">Exact model checkpoint ID</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={config.api_key || ''}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  placeholder="sk-proj-..."
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500">Stored safely per-tenant in browser & backend memory</span>
            </div>
          </div>

          {/* System Prompt Customization */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Section AI Persona & System Instructions</span>
              </h3>
              <button
                type="button"
                onClick={handleResetDefault}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>
            </div>

            <div>
              <textarea
                rows={6}
                value={config.system_prompt || ''}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                className="w-full p-3.5 rounded-2xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono leading-relaxed"
              />
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                <span>Variables available: {'{dept}'}, {'{semester}'}, {'{section}'}</span>
                <span>{(config.system_prompt || '').length} characters</span>
              </div>
            </div>

            {/* Non-Overridable Safety Wrapper Preview */}
            <div className="p-4 rounded-2xl bg-[#E8F9FF] dark:bg-slate-950/80 border border-[#C4D9FF] dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-300">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Runtime Non-Overridable Safety Directive (Injected by Backend)</span>
              </div>
              <pre className="text-[10px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed bg-white/70 dark:bg-black/30 p-2.5 rounded-xl border border-[#C4D9FF] dark:border-transparent">
                {NON_OVERRIDABLE_SAFETY_WRAPPER.replace('{dept}', tenant.dept).replace('{semester}', tenant.semester).replace('{section}', tenant.section)}
              </pre>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Section Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SUPER ADMIN - MANAGE SECTION ADMINS */}
      {activeTab === 'superadmin' && (
        <div className="space-y-6">
          {/* Add / Update Admin Form */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add or Update Section Admin Password
                </h3>
                <p className="text-xs text-slate-500">
                  Super Admin privilege: Assign or change the administrator password for any university section.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateOrUpdateAdmin} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Department
                  </label>
                  <select
                    value={adminDept}
                    onChange={(e) => setAdminDept(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Semester
                  </label>
                  <select
                    value={adminSemester}
                    onChange={(e) => setAdminSemester(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    {SEMESTERS.map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Section
                  </label>
                  <select
                    value={adminSection}
                    onChange={(e) => setAdminSection(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
                  >
                    {SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        Sec {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Set Admin Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password (minimum 4 characters)"
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingAdmin}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>
                    {isSubmittingAdmin
                      ? 'Saving...'
                      : `Set Admin Password for ${adminDept} ${adminSemester} (${adminSection})`}
                  </span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Section Admins Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Configured Section Administrators</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Sections with custom scrypt-hashed password credentials in MongoDB.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAdmins}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Refresh List
              </button>
            </div>

            {isLoadingAdmins ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading administrators...</div>
            ) : adminsList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No custom section admin passwords have been registered yet. Default fallback is <code className="font-mono font-bold text-indigo-600">admin123</code>.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden">
                {adminsList.map((adm) => (
                  <div
                    key={adm._id}
                    className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {adm.dept} {adm.semester} Sec {adm.section}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Custom Password Protected
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Key: {adm._id}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteAdmin(adm)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-1.5 transition-colors"
                      title="Remove custom password (reverts to default)"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Admin</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
