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
} from 'lucide-react';
import { showToast } from '../common/Toast';
import { dataService, NON_OVERRIDABLE_SAFETY_WRAPPER } from '../../services/dataService';

export const AgentConfigView = ({ session }) => {
  const tenant = session || { dept: 'CSE', semester: '3.2', section: 'A' };
  const isAdmin = session?.role === 'admin';

  const [config, setConfig] = useState(() => dataService.getAgentConfig(tenant));
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setConfig(dataService.getAgentConfig(tenant));
  }, [tenant.dept, tenant.semester, tenant.section]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 text-rose-600 font-bold">
        Access Denied: Only Section Administrators can configure AI Copilot parameters.
      </div>
    );
  }

  const handleSave = (e) => {
    e.preventDefault();
    try {
      dataService.saveAgentConfig(tenant, config, session.role);
      showToast('AI Agent Configuration saved for Section ' + tenant.dept + ' ' + tenant.semester + ' (' + tenant.section + ')', 'success');
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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Admin Agent Configuration Panel
          </h1>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-xs font-bold">
            Section {tenant.dept} {tenant.semester} (Sec {tenant.section})
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Customize LLM providers, model checkpoints, and base prompts. Safety directives are automatically injected at runtime.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Provider & API Credentials */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-campus-600 dark:text-campus-400" />
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
                placeholder="gemini-2.5-flash / gpt-4o / llama-3.3-70b"
                className="w-full px-3.5 py-2 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
                required
              />
              <span className="text-[10px] text-slate-500">Checkpoint loaded dynamically for this section</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
              API Key (Stored Encrypted / Masked)
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={config.api_key || ''}
                onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                placeholder="sk-..."
                className="w-full pl-3.5 pr-10 py-2 rounded-xl bg-[#FBFBFB] dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700 text-xs text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* System Prompt Customization */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-4 h-4 text-campus-600 dark:text-campus-400" />
              <span>Section Base System Prompt</span>
            </h3>
            <button
              type="button"
              onClick={handleResetDefault}
              className="flex items-center gap-1 text-xs font-bold text-campus-600 dark:text-campus-400 hover:underline"
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
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-campus-300">
              <ShieldCheck className="w-4 h-4 text-campus-600 dark:text-campus-400" />
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
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-campus-600 hover:bg-campus-500 text-white shadow-lg shadow-campus-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Section Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
