import React from 'react';
import { motion } from 'motion/react';
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
      {/* Mobile Navigation - Floating Dock Style */}
      <nav
        aria-label="Primary"
        className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-3xl border border-slate-200/80 bg-white/85 p-2 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-slate-700/50 dark:bg-slate-900/85 lg:hidden"
      >
        {mobileTabs.map((tab) => {
          const isActive = currentView === tab.id;
          return (
            <motion.button
              key={tab.id}
              onClick={() => onViewChange(tab.id as ViewType)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                'group relative flex items-center gap-2 rounded-2xl px-4 py-3 transition-all duration-300',
                isActive
                  ? 'font-bold text-white shadow-lg'
                  : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
              )}
              style={isActive ? {
                backgroundColor: themeColor,
                boxShadow: `0 8px 20px -4px ${themeColor}50`
              } : {}}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-2xl"
                  style={{ backgroundColor: themeColor }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                className="relative z-10"
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <tab.icon className={cn('h-5 w-5', isActive ? 'scale-110' : '')} />
              </motion.div>
              <span className={cn('relative z-10 text-xs uppercase tracking-wider', isActive ? 'block' : 'hidden md:block')}>
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* Desktop Sidebar - Enhanced with animations */}
      <aside className="window-no-drag hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-slate-200/60 lg:bg-gradient-to-b lg:from-slate-50/90 lg:to-white/90 lg:backdrop-blur-xl lg:dark:border-slate-800/60 lg:dark:from-slate-950/90 lg:dark:to-slate-900/90">
        {/* Logo Area */}
        <div className="flex h-16 items-center px-7 border-b border-slate-200/60 dark:border-slate-800/60">
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <div
              className="h-8 w-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              <Timer className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
              FocusOrange
            </span>
          </motion.div>
        </div>

        <div className="flex flex-1 flex-col justify-between py-4">
          <div className="space-y-1 px-3">
            {primaryTabs.map((tab, index) => {
              const isActive = currentView === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onViewChange(tab.id as ViewType)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'group relative flex w-full items-center gap-3.5 rounded-2xl px-5 py-3.5 text-left transition-all duration-300',
                    isActive
                      ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 dark:bg-slate-800 dark:text-slate-50 dark:shadow-slate-900/30'
                      : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarIndicator"
                      className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full"
                      style={{ backgroundColor: themeColor }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <tab.icon
                    className={cn(
                      'h-5 w-5 transition-colors duration-300',
                      isActive ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    )}
                  />
                  <span className={cn(
                    'text-[0.95rem] font-semibold tracking-tight transition-colors duration-300',
                    isActive ? 'text-slate-900 dark:text-slate-50' : ''
                  )}>
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="ml-auto h-2 w-2 rounded-full"
                      style={{ backgroundColor: themeColor }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          <div className="px-3">
            <motion.button
              onClick={() => onViewChange(settingsTab.id)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'group relative flex w-full items-center gap-3.5 rounded-2xl px-5 py-3.5 text-left transition-all duration-300',
                currentView === settingsTab.id
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50 dark:bg-slate-800 dark:text-slate-50 dark:shadow-slate-900/30'
                  : 'text-slate-500 hover:bg-slate-100/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/40 dark:hover:text-slate-100'
              )}
            >
              {currentView === settingsTab.id && (
                <motion.div
                  layoutId="sidebarIndicator"
                  className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full"
                  style={{ backgroundColor: themeColor }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <settingsTab.icon
                className={cn(
                  'h-5 w-5 transition-colors duration-300',
                  currentView === settingsTab.id ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                )}
              />
              <span className={cn(
                'text-[0.95rem] font-semibold tracking-tight transition-colors duration-300',
                currentView === settingsTab.id ? 'text-slate-900 dark:text-slate-50' : ''
              )}>
                {settingsTab.label}
              </span>
            </motion.button>
          </div>
        </div>

        {/* Bottom decoration */}
        <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: themeColor }} />
            <span className="uppercase tracking-widest font-medium">Focus Mode Ready</span>
          </div>
        </div>
      </aside>
    </>
  );
}
