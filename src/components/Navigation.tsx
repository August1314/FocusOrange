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
  const primaryTabs = [
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'history', label: 'History', icon: History },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
  ] as const;
  const settingsTab = { id: 'settings', label: 'Settings', icon: Settings } as const;
  const mobileTabs = [...primaryTabs, settingsTab] as const;

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 xl:hidden"
      >
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onViewChange(tab.id as ViewType)}
            className={cn(
              'group relative flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all duration-200',
              currentView === tab.id
                ? 'scale-105 font-bold text-white shadow-lg'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'
            )}
            style={currentView === tab.id ? {
              backgroundColor: themeColor,
              boxShadow: `0 10px 15px -3px ${themeColor}40`
            } : {}}
          >
            <tab.icon className={cn('h-5 w-5', currentView === tab.id ? 'scale-110' : '')} />
            <span className={cn('text-xs uppercase tracking-wider', currentView === tab.id ? 'block' : 'hidden md:block')}>{tab.label}</span>
          </button>
        ))}
      </nav>

      <aside className="window-no-drag hidden xl:fixed xl:inset-y-0 xl:left-0 xl:flex xl:w-56 xl:flex-col xl:border-r xl:border-slate-200 xl:bg-slate-100/70 xl:backdrop-blur-sm xl:dark:border-slate-800 xl:dark:bg-slate-900/70">
        <div className="flex h-24 items-center border-b border-slate-200/90 px-6 dark:border-slate-800/90">
          <div className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            FocusOrange
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between">
          <div className="px-4 py-6">
            {primaryTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id as ViewType)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-[1.1rem] px-5 py-4 text-left transition-colors',
                  currentView === tab.id
                    ? 'bg-slate-200/75 text-slate-900 dark:bg-slate-800/80 dark:text-slate-50'
                    : 'text-slate-500 hover:bg-slate-200/45 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100'
                )}
              >
                <tab.icon className={cn('h-6 w-6', currentView === tab.id ? 'text-slate-700 dark:text-slate-200' : '')} />
                <span className={cn('text-[1.35rem] font-semibold tracking-tight', currentView === tab.id ? 'text-slate-900 dark:text-slate-50' : '')}>
                  {tab.label}
                </span>
              </button>
            ))}
          </div>

          <div className="border-t border-slate-200/90 px-4 py-6 dark:border-slate-800/90">
            <button
              onClick={() => onViewChange(settingsTab.id)}
              className={cn(
                'flex w-full items-center gap-3 rounded-[1.1rem] px-5 py-4 text-left transition-colors',
                currentView === settingsTab.id
                  ? 'bg-slate-200/75 text-slate-900 dark:bg-slate-800/80 dark:text-slate-50'
                  : 'text-slate-500 hover:bg-slate-200/45 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100'
              )}
            >
              <settingsTab.icon className={cn('h-6 w-6', currentView === settingsTab.id ? 'text-slate-700 dark:text-slate-200' : '')} />
              <span className={cn('text-[1.35rem] font-semibold tracking-tight', currentView === settingsTab.id ? 'text-slate-900 dark:text-slate-50' : '')}>
                {settingsTab.label}
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
