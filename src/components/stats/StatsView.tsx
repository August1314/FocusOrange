import React, { useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  eachHourOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
  addDays,
  addMonths,
  addWeeks,
  addYears,
} from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Flame, TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { FocusRecord, TimerMode } from '../../types';
import { cn } from '../../lib/utils';

interface StatsViewProps {
  records: FocusRecord[];
  themeColor: string;
}

type PeriodTab = 'day' | 'week' | 'month' | 'year';

type HeatmapDay = {
  date: Date;
  count: number;
  minutes: number;
  inYear: boolean;
};

type HeatmapWeek = HeatmapDay[];

function chunkWeeks(days: HeatmapDay[]) {
  const weeks: HeatmapWeek[] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }
  return weeks;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  if (!/^[0-9a-fA-F]{6}$/.test(value)) return null;
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function getHeatColor(themeColor: string, level: number) {
  if (level === 0) return '#e2e8f0';
  const rgb = hexToRgb(themeColor);
  const alpha = [0, 0.22, 0.38, 0.58, 0.85][level];
  if (!rgb) return themeColor;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getLevel(count: number) {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

function getStreakDays(records: FocusRecord[]) {
  const today = startOfToday();
  let streak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const date = subDays(today, offset);
    const hasSession = records.some((record) => isSameDay(parseISO(record.startTime), date));
    if (!hasSession) break;
    streak += 1;
  }
  return streak;
}

function buildYearHeatmap(yearDate: Date, records: FocusRecord[]) {
  const yearStart = startOfYear(yearDate);
  const yearEnd = endOfYear(yearDate);
  const gridStart = startOfWeek(yearStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(yearEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const days = allDays.map((date) => {
    const dayRecords = records.filter((record) => isSameDay(parseISO(record.startTime), date));
    return {
      date,
      count: dayRecords.length,
      minutes: dayRecords.reduce((sum, record) => sum + (record.actualDuration || 0), 0),
      inYear: date >= yearStart && date <= yearEnd,
    };
  });

  return chunkWeeks(days);
}

function getHeatmapMonthLabels(weeks: HeatmapWeek[]) {
  let lastLabel = '';
  return weeks.map((week, index) => {
    const monthAnchor = week.find((day) => day.inYear && day.date.getDate() <= 7);
    if (!monthAnchor) {
      if (index === 0) {
        lastLabel = format(week[0].date, 'MMM');
        return lastLabel;
      }
      return '';
    }
    const currentLabel = format(monthAnchor.date, 'MMM');
    if (currentLabel === lastLabel) return '';
    lastLabel = currentLabel;
    return currentLabel;
  });
}

function YearHeatmap({ yearDate, weeks, themeColor }: { yearDate: Date; weeks: HeatmapWeek[]; themeColor: string }) {
  const labels = getHeatmapMonthLabels(weeks);
  const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <motion.div
      className="bg-white/90 dark:bg-slate-900/90 rounded-[2rem] p-6 md:p-8 shadow-xl shadow-slate-200/30 dark:shadow-slate-900/20 border border-slate-200/80 dark:border-slate-700/50 backdrop-blur-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Activity Heatmap</h3>
          <p className="text-sm text-slate-500 mt-1">{format(yearDate, 'yyyy')}</p>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-hidden">
        <div className="inline-flex gap-3 min-w-max">
          <div className="pt-8 flex flex-col gap-1.5 text-[11px] font-medium text-slate-500">
            {weekdayLabels.map((label, index) => (
              <div key={index} className="w-4 h-4 flex items-center justify-center">{label}</div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex gap-1.5 text-sm text-slate-500">
              {labels.map((label, index) => (
                <div key={`${label}-${index}`} className="w-4">{label}</div>
              ))}
            </div>

            <div className="flex gap-1.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1.5">
                  {week.map((day) => (
                    <motion.div
                      key={day.date.toISOString()}
                      className="w-4 h-4 rounded-[3px] cursor-pointer"
                      style={{
                        backgroundColor: day.inYear ? getHeatColor(themeColor, getLevel(day.count)) : 'transparent',
                      }}
                      title={`${format(day.date, 'yyyy-MM-dd')} · ${day.count} sessions · ${day.minutes} minutes`}
                      whileHover={{ scale: 1.4 }}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div key={level} className="w-4 h-4 rounded-[3px]" style={{ backgroundColor: getHeatColor(themeColor, level) }} />
        ))}
        <span>More</span>
      </div>
    </motion.div>
  );
}

function getPeriodBounds(tab: PeriodTab, anchorDate: Date) {
  if (tab === 'day') {
    return { start: startOfDay(anchorDate), end: endOfDay(anchorDate) };
  }
  if (tab === 'week') {
    return { start: startOfWeek(anchorDate, { weekStartsOn: 1 }), end: endOfWeek(anchorDate, { weekStartsOn: 1 }) };
  }
  if (tab === 'month') {
    return { start: startOfMonth(anchorDate), end: endOfMonth(anchorDate) };
  }
  return { start: startOfYear(anchorDate), end: endOfYear(anchorDate) };
}

function shiftPeriod(tab: PeriodTab, anchorDate: Date, direction: -1 | 1) {
  if (tab === 'day') return direction === -1 ? subDays(anchorDate, 1) : addDays(anchorDate, 1);
  if (tab === 'week') return direction === -1 ? subWeeks(anchorDate, 1) : addWeeks(anchorDate, 1);
  if (tab === 'month') return direction === -1 ? subMonths(anchorDate, 1) : addMonths(anchorDate, 1);
  return direction === -1 ? subYears(anchorDate, 1) : addYears(anchorDate, 1);
}

function buildPeriodChart(tab: PeriodTab, anchorDate: Date, records: FocusRecord[]) {
  const bounds = getPeriodBounds(tab, anchorDate);
  const periodRecords = records.filter((record) => {
    const date = parseISO(record.startTime);
    return date >= bounds.start && date <= bounds.end;
  });

  const totalMinutes = periodRecords.reduce((sum, record) => sum + (record.actualDuration || 0), 0);

  if (tab === 'day') {
    const hours = eachHourOfInterval({ start: bounds.start, end: bounds.end });
    return {
      title: format(bounds.start, "EEEE, MMM d"),
      totalLabel: formatMinutes(totalMinutes),
      averageValue: totalMinutes / Math.max(hours.length, 1),
      unitTop: '60m',
      data: hours.map((hour) => {
        const hourRecords = periodRecords.filter((record) => parseISO(record.startTime).getHours() === hour.getHours());
        return {
          label: format(hour, 'HH'),
          minutes: hourRecords.reduce((sum, record) => sum + (record.actualDuration || 0), 0),
        };
      }),
    };
  }

  if (tab === 'week') {
    const days = eachDayOfInterval({ start: bounds.start, end: bounds.end });
    return {
      title: `${format(bounds.start, 'MMM d')}–${format(bounds.end, 'MMM d')}`,
      totalLabel: formatMinutes(totalMinutes),
      averageValue: totalMinutes / Math.max(days.length, 1),
      unitTop: '3h',
      data: days.map((day) => {
        const dayRecords = periodRecords.filter((record) => isSameDay(parseISO(record.startTime), day));
        return {
          label: format(day, 'EEE'),
          minutes: dayRecords.reduce((sum, record) => sum + (record.actualDuration || 0), 0),
        };
      }),
    };
  }

  if (tab === 'month') {
    const weeks = eachWeekOfInterval({ start: bounds.start, end: bounds.end }, { weekStartsOn: 1 });
    return {
      title: format(bounds.start, 'MMMM yyyy'),
      totalLabel: formatMinutes(totalMinutes),
      averageValue: totalMinutes / Math.max(weeks.length, 1),
      unitTop: '12h',
      data: weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekRecords = periodRecords.filter((record) => {
          const date = parseISO(record.startTime);
          return date >= weekStart && date <= weekEnd;
        });
        return {
          label: `W${index + 1}`,
          minutes: weekRecords.reduce((sum, record) => sum + (record.actualDuration || 0), 0),
        };
      }),
    };
  }

  const months = eachMonthOfInterval({ start: bounds.start, end: bounds.end });
  return {
    title: format(bounds.start, 'yyyy'),
    totalLabel: formatMinutes(totalMinutes),
    averageValue: totalMinutes / Math.max(months.length, 1),
    unitTop: '40h',
    data: months.map((monthStart) => {
      const monthEnd = endOfMonth(monthStart);
      const monthRecords = periodRecords.filter((record) => {
        const date = parseISO(record.startTime);
        return date >= monthStart && date <= monthEnd;
      });
      return {
        label: format(monthStart, 'MMM'),
        minutes: monthRecords.reduce((sum, record) => sum + (record.actualDuration || 0), 0),
      };
    }),
  };
}

export function StatsView({ records, themeColor }: StatsViewProps) {
  const [selectedTab, setSelectedTab] = useState<PeriodTab>('week');
  const [anchorDate, setAnchorDate] = useState(new Date());

  const focusRecords = useMemo(
    () => records.filter((record) => record.mode === TimerMode.WORK),
    [records]
  );

  const overview = useMemo(() => {
    const activeDays = new Set(
      focusRecords.map((record) => format(parseISO(record.startTime), 'yyyy-MM-dd'))
    ).size;

    return {
      sessions: focusRecords.length,
      activeDays,
      streak: getStreakDays(focusRecords),
      totalMinutes: focusRecords.reduce((sum, record) => sum + (record.actualDuration || 0), 0),
    };
  }, [focusRecords]);

  const yearHeatmap = useMemo(
    () => buildYearHeatmap(anchorDate, focusRecords),
    [anchorDate, focusRecords]
  );

  const periodChart = useMemo(
    () => buildPeriodChart(selectedTab, anchorDate, focusRecords),
    [selectedTab, anchorDate, focusRecords]
  );

  const yAxisTicks = useMemo(() => {
    const maxValue = Math.max(...periodChart.data.map((item) => item.minutes), 0);
    const avgValue = Math.round(periodChart.averageValue);
    return Array.from(new Set([0, avgValue, maxValue])).sort((a, b) => a - b);
  }, [periodChart]);

  const tabs: Array<{ id: PeriodTab; label: string; icon: React.ElementType }> = [
    { id: 'day', label: 'Day', icon: Zap },
    { id: 'week', label: 'Week', icon: Calendar },
    { id: 'month', label: 'Month', icon: TrendingUp },
    { id: 'year', label: 'Year', icon: Target },
  ];

  const isEmpty = focusRecords.length === 0;

  return (
    <div className="space-y-6 pb-24 xl:pb-0">
      {/* Overview Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {[
          { label: 'Focus Sessions', value: overview.sessions, icon: Target, color: themeColor, suffix: '' },
          { label: 'Active Days', value: overview.activeDays, icon: Calendar, color: '#0ea5e9', suffix: '' },
          { label: 'Current Streak', value: overview.streak, icon: Flame, color: '#f43f5e', suffix: ' days' },
          { label: 'Total Time', value: formatMinutes(overview.totalMinutes), icon: TrendingUp, color: '#10b981', suffix: '' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 px-6 py-5 shadow-lg shadow-slate-200/20 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-900/20"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="p-2 rounded-xl"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
            </div>
            <motion.p
              className="text-3xl font-bold text-slate-900 dark:text-slate-100"
              key={stat.value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {stat.value}{stat.suffix}
            </motion.p>
          </motion.div>
        ))}
      </motion.div>

      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start xl:gap-6">
        <div className="space-y-6">
          {/* Heatmap */}
          <YearHeatmap yearDate={anchorDate} weeks={yearHeatmap} themeColor={themeColor} />

          {/* Period Tabs */}
          <motion.div
            className="rounded-[1.6rem] bg-slate-100/80 p-1.5 dark:bg-slate-800/80 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="grid grid-cols-4 gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={cn(
                    'rounded-[1.2rem] py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2',
                    selectedTab === tab.id
                      ? 'bg-white text-slate-900 shadow-md dark:bg-slate-900 dark:text-slate-100'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Period Navigation */}
          <motion.div
            className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 px-6 py-7 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-900/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAnchorDate((current) => shiftPeriod(selectedTab, current, -1))}
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{
                  backgroundColor: themeColor,
                  boxShadow: `0 4px 15px -2px ${themeColor}50`
                }}
                aria-label="Previous period"
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.button>

              <div className="text-center">
                <p className="text-lg font-semibold text-slate-500">{periodChart.title}</p>
                <motion.p
                  className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100 md:text-5xl"
                  key={periodChart.totalLabel}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                >
                  {periodChart.totalLabel}
                </motion.p>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setAnchorDate((current) => shiftPeriod(selectedTab, current, 1))}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:text-slate-300"
                aria-label="Next period"
              >
                <ChevronRight className="h-6 w-6" />
              </motion.button>
            </div>
          </motion.div>

          {/* Chart */}
          <motion.div
            className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-5 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-900/20 md:p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="h-[300px] w-full xl:h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={periodChart.data} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="4 8" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3af', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    width={42}
                    tick={{ fill: '#94a3af', fontSize: 12 }}
                    ticks={yAxisTicks}
                    tickFormatter={(value) => {
                      if (value === 0) return '0';
                      if (value === Math.round(periodChart.averageValue)) return 'avg';
                      return periodChart.unitTop;
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    formatter={(value: number) => [`${value} min`, 'Focus']}
                    contentStyle={{
                      borderRadius: '16px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                      backgroundColor: '#ffffff',
                      padding: '12px 16px',
                    }}
                    labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                  />
                  <Bar dataKey="minutes" radius={[12, 12, 0, 0]} barSize={selectedTab === 'year' ? 18 : 34}>
                    {periodChart.data.map((entry, index) => (
                      <Cell
                        key={`${entry.label}-${index}`}
                        fill={entry.minutes > 0 ? themeColor : '#e2e8f0'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <aside className="mt-6 space-y-4 xl:mt-0 xl:sticky xl:top-24">
          <motion.div
            className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-900/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Overview</p>
            <div className="mt-5 space-y-5">
              <div>
                <p className="text-sm text-slate-500">Current range</p>
                <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">{periodChart.totalLabel}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500">Average per slice</p>
                <p className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatMinutes(Math.round(periodChart.averageValue))}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm text-slate-500">View mode</p>
                <p className="mt-1.5 text-lg font-semibold capitalize text-slate-900 dark:text-slate-100">{selectedTab}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/90 dark:shadow-slate-900/20"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Insight</p>
            <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {isEmpty
                  ? 'Complete a few focus sessions and this panel will start showing trends.'
                  : `You've completed ${overview.sessions} focus sessions across ${overview.activeDays} active days. Keep the momentum going!`}
              </p>
            </div>
            {!isEmpty && overview.streak > 0 && (
              <motion.div
                className="mt-4 flex items-center gap-2 text-sm font-semibold"
                style={{ color: themeColor }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Flame className="h-4 w-4" />
                <span>{overview.streak} day streak! Keep it up!</span>
              </motion.div>
            )}
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
