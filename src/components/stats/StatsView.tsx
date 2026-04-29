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
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
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

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return null;
  }

  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function getHeatColor(themeColor: string, level: number) {
  if (level === 0) {
    return '#e5e7eb';
  }

  const rgb = hexToRgb(themeColor);
  const alpha = [0, 0.26, 0.42, 0.62, 0.88][level];

  if (!rgb) {
    return themeColor;
  }

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

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

function getStreakDays(records: FocusRecord[]) {
  const today = startOfToday();
  let streak = 0;

  for (let offset = 0; offset < 365; offset += 1) {
    const date = subDays(today, offset);
    const hasSession = records.some((record) => isSameDay(parseISO(record.startTime), date));

    if (!hasSession) {
      break;
    }

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

    if (currentLabel === lastLabel) {
      return '';
    }

    lastLabel = currentLabel;
    return currentLabel;
  });
}

function YearHeatmap({
  yearDate,
  weeks,
  themeColor,
}: {
  yearDate: Date;
  weeks: HeatmapWeek[];
  themeColor: string;
}) {
  const labels = getHeatmapMonthLabels(weeks);
  const weekdayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto overflow-y-hidden">
        <div className="inline-flex gap-3 min-w-max">
          <div className="pt-8 flex flex-col gap-1.5 text-[11px] font-medium text-slate-500">
            {weekdayLabels.map((label, index) => (
              <div key={index} className="w-4 h-4 flex items-center justify-center">
                {label}
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex gap-1.5 text-sm text-slate-500">
              {labels.map((label, index) => (
                <div key={`${label}-${index}`} className="w-4">
                  {label}
                </div>
              ))}
            </div>

            <div className="flex gap-1.5">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1.5">
                  {week.map((day) => (
                    <div
                      key={day.date.toISOString()}
                      className="w-4 h-4 rounded-[3px]"
                      style={{
                        backgroundColor: day.inYear ? getHeatColor(themeColor, getLevel(day.count)) : 'transparent',
                      }}
                      title={`${format(day.date, 'yyyy-MM-dd')} · ${day.count} sessions · ${day.minutes} minutes`}
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
          <div
            key={level}
            className="w-4 h-4 rounded-[3px]"
            style={{ backgroundColor: getHeatColor(themeColor, level) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function getPeriodBounds(tab: PeriodTab, anchorDate: Date) {
  if (tab === 'day') {
    return {
      start: startOfDay(anchorDate),
      end: endOfDay(anchorDate),
    };
  }

  if (tab === 'week') {
    return {
      start: startOfWeek(anchorDate, { weekStartsOn: 1 }),
      end: endOfWeek(anchorDate, { weekStartsOn: 1 }),
    };
  }

  if (tab === 'month') {
    return {
      start: startOfMonth(anchorDate),
      end: endOfMonth(anchorDate),
    };
  }

  return {
    start: startOfYear(anchorDate),
    end: endOfYear(anchorDate),
  };
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
      title: `This Week, ${format(bounds.start, 'MMM d')}–${format(bounds.end, 'MMM d')}`,
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
      title: `This Month, ${format(bounds.start, 'MMMM yyyy')}`,
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
    title: `This Year, ${format(bounds.start, 'yyyy')}`,
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

  const tabs: Array<{ id: PeriodTab; label: string }> = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] px-8 py-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-3 items-center text-center">
          <div>
            <div className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{overview.sessions}</div>
            <div className="text-sm md:text-base text-slate-500 mt-1">Sessions</div>
          </div>
          <div className="border-x border-slate-200 dark:border-slate-800">
            <div className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{overview.activeDays}</div>
            <div className="text-sm md:text-base text-slate-500 mt-1">Days</div>
          </div>
          <div>
            <div className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
              {overview.streak} Days
              <Flame className="w-7 h-7 text-rose-500 fill-rose-500/20" />
            </div>
            <div className="text-sm md:text-base text-slate-500 mt-1">Streak</div>
          </div>
        </div>
      </div>

      <YearHeatmap yearDate={anchorDate} weeks={yearHeatmap} themeColor={themeColor} />

      <div className="bg-slate-200/80 dark:bg-slate-800/80 rounded-[1.6rem] p-1.5 grid grid-cols-4 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={cn(
              'rounded-[1.2rem] py-3.5 text-base md:text-lg font-semibold transition-all',
              selectedTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-700 dark:text-slate-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[1.6rem] px-6 py-7 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setAnchorDate((current) => shiftPeriod(selectedTab, current, -1))}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm"
            style={{ backgroundColor: themeColor }}
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <div className="text-center">
            <p className="text-xl md:text-2xl font-semibold text-slate-500">{periodChart.title}</p>
            <p className="text-4xl md:text-5xl font-medium text-slate-900 dark:text-slate-100 mt-3">
              {periodChart.totalLabel}
            </p>
          </div>

          <button
            onClick={() => setAnchorDate((current) => shiftPeriod(selectedTab, current, 1))}
            className="w-12 h-12 rounded-full border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-500"
          >
            <ChevronRight className="w-7 h-7" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[1.6rem] p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={periodChart.data} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="4 8" stroke="#cbd5e1" vertical />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                orientation="right"
                axisLine={false}
                tickLine={false}
                width={42}
                tick={{ fill: '#b3b3b3', fontSize: 12 }}
                ticks={yAxisTicks}
                tickFormatter={(value) => {
                  if (value === 0) return '0';
                  if (value === Math.round(periodChart.averageValue)) return 'avg';
                  return periodChart.unitTop;
                }}
              />
              <Tooltip
                cursor={{ fill: '#f8fafc' }}
                formatter={(value: number) => [`${value} min`, 'Focus']}
                contentStyle={{
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.08)',
                  backgroundColor: '#ffffff',
                }}
              />
              <Bar dataKey="minutes" radius={[12, 12, 0, 0]} barSize={selectedTab === 'year' ? 18 : 34}>
                {periodChart.data.map((entry, index) => (
                  <Cell
                    key={`${entry.label}-${index}`}
                    fill={entry.minutes > 0 ? themeColor : '#e5e7eb'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
