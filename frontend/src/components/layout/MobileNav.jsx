import React from 'react';
import { LogOut } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';

export function MobileNav({ activeTab, setActiveTab, session, onLogout }) {
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || session?.role === 'admin'
  );

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#FBFBFB]/95 border-[#C4D9FF] dark:bg-[#090d16]/95 dark:border-slate-800 backdrop-blur-lg border-t py-1.5 px-2">
      <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none w-full">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium transition-colors shrink-0 min-w-[48px] ${
                isActive
                  ? 'text-indigo-700 dark:text-campus-400 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.shortLabel || item.label}</span>
            </button>
          );
        })}
        <button
          onClick={onLogout}
          className="flex flex-col items-center gap-0.5 p-1 rounded-lg text-[10px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors shrink-0 min-w-[44px]"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </nav>
  );
}
