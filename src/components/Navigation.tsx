import React from 'react';
import { Timer, History, BarChart3, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export type ViewType = 'timer' | 'history' | 'stats' | 'settings';

interface NavigationProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  themeColor: string;
}

export function Navigation({ currentView, onViewChange, themeColor }: NavigationProps) {
  const tabs = [
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'history', label: 'History', icon: History },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-xl z-50 flex items-center gap-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onViewChange(tab.id as ViewType)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 group relative",
            currentView === tab.id 
              ? "text-white font-bold scale-105 shadow-lg" 
              : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
          style={currentView === tab.id ? { 
            backgroundColor: themeColor,
            boxShadow: `0 10px 15px -3px ${themeColor}40`
          } : {}}
        >
          <tab.icon className={cn("w-5 h-5", currentView === tab.id ? "scale-110" : "")} />
          <span className={cn("text-xs uppercase tracking-wider", currentView === tab.id ? "block" : "hidden md:block")}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
