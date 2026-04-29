import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell
} from 'recharts';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval,
  isSameMonth, subDays
} from 'date-fns';
import { FocusRecord, TimerMode } from '../../types';
import { Timer, Trophy, Flame, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatsViewProps {
  records: FocusRecord[];
  themeColor: string;
}

export function StatsView({ records, themeColor }: StatsViewProps) {
  const stats = useMemo(() => {
    const focusRecords = records.filter(r => r.mode === TimerMode.WORK);
    const totalMinutes = focusRecords.reduce((acc, r) => acc + (r.actualDuration || 0), 0);
    const completedSessions = focusRecords.length;
    
    // Weekly activity data
    const now = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(now, 6),
      end: now
    });

    const weeklyData = last7Days.map(date => {
      const dayRecords = focusRecords.filter(r => isSameDay(parseISO(r.startTime), date));
      return {
        day: format(date, 'EEE'),
        minutes: dayRecords.reduce((acc, r) => acc + (r.actualDuration || 0), 0),
        count: dayRecords.length
      };
    });

    return {
      totalMinutes,
      completedSessions,
      weeklyData,
      avgPerDay: Math.round(totalMinutes / (records.length > 0 ? 7 : 1))
    };
  }, [records]);

  const cards = [
    { label: "Today's Focus", value: `${stats.totalMinutes}m`, icon: Timer, color: "text-slate-100", bg: "bg-slate-800 text-white", darkBg: "dark:bg-slate-800" },
    { label: "Completed", value: stats.completedSessions, icon: Trophy, color: "text-emerald-500", bg: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100", darkBg: "" },
    { label: "Daily Goal", value: `${Math.min(100, Math.round((stats.completedSessions / 12) * 100))}%`, icon: Flame, color: "text-amber-500", bg: "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100", darkBg: "" },
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Stats Card (Bento Style) */}
        <div 
          className="col-span-1 md:col-span-2 lg:col-span-1 text-white p-8 rounded-[2.5rem] shadow-xl flex flex-col justify-between min-h-[240px] transition-colors duration-500"
          style={{ backgroundColor: themeColor }}
        >
          <div>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Total Focused Today</p>
            <h2 className="text-6xl font-black mt-2 tracking-tighter">{stats.totalMinutes}m</h2>
          </div>
          <div className="flex justify-between items-end">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-4 shadow-sm bg-white/20" style={{ borderColor: themeColor }} />
              ))}
            </div>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest">{stats.completedSessions} sessions completed</p>
          </div>
        </div>

        {/* Weekly Progress (Bento Style) */}
        <div className="col-span-1 md:col-span-2 lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Weekly Productivity</h3>
            <Calendar className="w-4 h-4 text-slate-300" />
          </div>

          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyData}>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="minutes" 
                  radius={[6, 6, 6, 6]}
                  barSize={24}
                >
                  {stats.weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.day === format(new Date(), 'EEE') ? themeColor : '#e2e8f0'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
