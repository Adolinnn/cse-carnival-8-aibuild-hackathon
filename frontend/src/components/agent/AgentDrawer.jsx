import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  User,
  Send,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Code2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Shield,
  GraduationCap,
} from 'lucide-react';
import { processAgentQuery } from '../../services/agentService';
import { dataService } from '../../services/dataService';
import { showToast } from '../common/Toast';

export const AgentDrawer = ({
  isOpen,
  onClose,
  simulatedDate,
  simulatedTime,
  externalQuery,
  clearExternalQuery,
}) => {
  const session = dataService.getSession() || { dept: 'CSE', semester: '3.2', section: 'A', role: 'student' };
  const isAdmin = session.role === 'admin';

  const SAMPLE_QUERIES = isAdmin
    ? [
        'When is my next class?',
        'Book Room 7A02 tomorrow from 3 PM to 5 PM',
        'Add CSE311 class on Monday at 08:30 in Room 402',
        'Post high priority notice: Exam schedule released',
        'Which labs have a projector and can fit 30 people?',
        'Register me for the Guest Lecture on Deep Learning',
      ]
    : [
        'When is my next class?',
        'What classes do I have on Wednesday?',
        'What assignments do I have due this week?',
        'Show high priority announcements for my section',
        'Which labs have a projector and can fit 30 people?',
        'Register me for the Guest Lecture on Deep Learning',
      ];

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'agent',
      content: `Hello! I'm **austchan**, your CampusOS AI Copilot scoped to **${session.dept} ${session.semester} Sec ${session.section}** (${isAdmin ? 'Admin mode: full CRUD enabled' : 'Student mode: read-only + event RSVP'}).\n\nAsk me about your schedule, available rooms, section notices, assignments, or campus events!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedReceipts, setExpandedReceipts] = useState({});
  const messagesEndRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Handle external queries triggered from dashboard buttons
  useEffect(() => {
    if (externalQuery) {
      handleSendMessage(externalQuery);
      if (clearExternalQuery) clearExternalQuery();
    }
  }, [externalQuery]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await processAgentQuery(text, simulatedDate, simulatedTime);
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'agent',
          content: `⚠️ Error executing tool: ${err?.message || 'Failed to process request.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleReceipt = (id) => {
    setExpandedReceipts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] md:w-[520px] bg-[#FBFBFB] dark:bg-[#0c1222] border-l border-[#C4D9FF] dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-[#C4D9FF] dark:border-slate-800 bg-[#E8F9FF]/90 dark:bg-slate-900/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-campus-500 text-white flex items-center justify-center shadow-md shadow-campus-600/30 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white">austchan AI</h2>
              <span className="px-2 py-0.5 rounded-full bg-[#C5BAFF]/40 dark:bg-campus-500/20 text-indigo-900 dark:text-campus-300 border border-[#C5BAFF] dark:border-campus-500/30 text-[10px] font-bold">
                {session.dept} {session.semester} Sec {session.section}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                isAdmin ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}>
                {isAdmin ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                {isAdmin ? 'Admin Tools (Full CRUD)' : 'Student Tools (Read + RSVP)'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                {simulatedDate} · {simulatedTime}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setMessages([
                {
                  id: 'reset',
                  sender: 'agent',
                  content: 'Chat cleared! How can I assist you with campus information today?',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
              ]);
            }}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-[#C4D9FF]/40 dark:hover:bg-slate-800 transition-colors"
            title="Clear Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-[#C4D9FF]/40 dark:hover:bg-slate-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Prompt Pills */}
      <div className="px-3 py-2 border-b border-[#C4D9FF] dark:border-slate-800 bg-white dark:bg-slate-950/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 shrink-0 pl-1">
          Try:
        </span>
        {SAMPLE_QUERIES.map((sq, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(sq)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#E8F9FF] dark:bg-slate-900 hover:bg-[#C5BAFF]/50 dark:hover:bg-campus-600/20 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-campus-300 border border-[#C4D9FF] dark:border-slate-800 hover:border-[#C5BAFF] text-xs transition-colors font-medium"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-[#E8F9FF] dark:bg-slate-800 border border-[#C4D9FF] dark:border-slate-700 text-indigo-700 dark:text-campus-400'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2.5 shadow-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-[#E8F9FF] dark:bg-slate-900 text-slate-900 dark:text-slate-200 border border-[#C4D9FF] dark:border-slate-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line text-slate-900 dark:text-slate-200 font-normal">
                  {msg.content}
                </div>

                {/* Clarification Options */}
                {msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                  <div className="pt-2 border-t border-[#C4D9FF] dark:border-slate-800/80 space-y-1.5">
                    <div className="text-[11px] font-bold text-indigo-900 dark:text-campus-300">
                      Suggested Actions:
                    </div>
                    {msg.clarificationOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(opt)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 hover:bg-[#C5BAFF]/30 dark:hover:bg-campus-600/20 text-slate-900 dark:text-slate-200 hover:text-indigo-950 dark:hover:text-campus-300 border border-[#C4D9FF] dark:border-slate-800 text-[11px] transition-colors font-medium shadow-xs"
                      >
                        → {opt}
                      </button>
                    ))}
                  </div>
                )}

                {/* Tool Execution Receipts */}
                {msg.receipts && msg.receipts.length > 0 && (
                  <div className="pt-2 border-t border-[#C4D9FF] dark:border-slate-800/80 space-y-1.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-400 flex items-center gap-1.5">
                      <Code2 className="w-3.5 h-3.5 text-indigo-600 dark:text-campus-400" />
                      <span>Executed Backend Tools ({msg.receipts.length})</span>
                    </div>

                    {msg.receipts.map((rcpt) => {
                      const isExpanded = expandedReceipts[rcpt.id];
                      return (
                        <div
                          key={rcpt.id}
                          className="rounded-lg bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-800/80 overflow-hidden text-[11px]"
                        >
                          <button
                            onClick={() => toggleReceipt(rcpt.id)}
                            className="w-full px-2.5 py-1.5 flex items-center justify-between text-left hover:bg-[#E8F9FF] dark:hover:bg-slate-900 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 font-mono text-indigo-900 dark:text-campus-300 truncate font-semibold">
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                              )}
                              <span>{rcpt.toolName}</span>
                            </div>
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                rcpt.status === 'success'
                                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-800 dark:text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {rcpt.status}
                            </span>
                          </button>

                          {isExpanded && (
                            <div className="p-2 border-t border-[#C4D9FF] dark:border-slate-800/60 font-mono text-[10px] space-y-1.5 bg-[#FBFBFB] dark:bg-black/40">
                              <div>
                                <span className="text-slate-600 dark:text-slate-400 font-bold">Input:</span>
                                <pre className="text-slate-900 dark:text-slate-300 mt-0.5 overflow-x-auto p-1.5 rounded bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800">
                                  {JSON.stringify(rcpt.input, null, 2)}
                                </pre>
                              </div>
                              <div>
                                <span className="text-slate-600 dark:text-slate-400 font-bold">Output:</span>
                                <pre className="text-slate-900 dark:text-slate-300 mt-0.5 overflow-x-auto p-1.5 rounded bg-white dark:bg-slate-900 border border-[#C4D9FF] dark:border-slate-800 max-h-36">
                                  {JSON.stringify(rcpt.output, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="text-[10px] text-slate-600 dark:text-slate-400 text-right pt-0.5 font-mono">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#E8F9FF] dark:bg-slate-800 border border-[#C4D9FF] dark:border-slate-700 text-indigo-600 dark:text-campus-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-[#E8F9FF] dark:bg-slate-900/90 border border-[#C4D9FF] dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              <span>Consulting campus database & executing tool pipeline...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 border-t border-[#C4D9FF] dark:border-slate-800 bg-[#E8F9FF]/90 dark:bg-slate-900/90"
      >
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isAdmin ? "Ask austchan or request Admin action (e.g. book room, schedule class)..." : "Ask austchan about classes, rooms, notices, or RSVP for events..."}
            className="w-full pl-3.5 pr-11 py-2.5 rounded-xl bg-white dark:bg-slate-950 border border-[#C4D9FF] dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner font-medium"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-md"
            title="Send Message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
