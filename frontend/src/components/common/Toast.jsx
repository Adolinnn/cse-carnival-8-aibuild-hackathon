import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

let toastHandler = null;

export const showToast = (message, type = 'info') => {
  if (toastHandler) {
    toastHandler({ message, type });
  }
};

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastHandler = ({ message, type }) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    return () => {
      toastHandler = null;
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100';
      case 'warning':
        return 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/80 text-amber-950 dark:text-amber-100';
      case 'error':
        return 'border-rose-500/40 bg-rose-50 dark:bg-rose-950/80 text-rose-950 dark:text-rose-100';
      default:
        return 'border-blue-500/40 bg-blue-50 dark:bg-blue-950/80 text-blue-950 dark:text-blue-100';
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-xl animate-in slide-in-from-bottom-3 duration-200 ' + getBorderColor(toast.type)}
        >
          {getIcon(toast.type)}
          <div className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
