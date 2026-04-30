import React, { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit3, MessageSquare, CheckCircle2, Coffee, Clock, Calendar, TrendingUp } from 'lucide-react';
import { FocusRecord } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface FocusHistoryProps {
  records: FocusRecord[];
  onUpdateNote: (id: string, note: string) => void;
  onDelete: (id: string) => void;
  themeColor: string;
}

export function FocusHistory({ records, onUpdateNote, onDelete, themeColor }: FocusHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleEdit = (record: FocusRecord) => {
    setEditingId(record.id);
    setTempNote(record.note || "");
  };

  const handleSaveNote = (id: string) => {
    onUpdateNote(id, tempNote);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      onDelete(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  // Calculate stats
  const totalSessions = records.length;
  const totalMinutes = records.reduce((sum, r) => sum + (r.actualDuration || 0), 0);
  const workSessions = records.filter(r => r.mode === 'work').length;
  const breakSessions = records.filter(r => r.mode !== 'work').length;

  if (records.length === 0) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
          whileHover={{ scale: 1.05, rotate: 5 }}
        >
          <CheckCircle2 className="w-10 h-10 opacity-30" />
        </motion.div>
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">No sessions recorded yet</p>
          <p className="text-sm text-slate-400">Start your first focus session to see it here</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {[
          { label: 'Total Sessions', value: totalSessions, icon: TrendingUp, color: themeColor },
          { label: 'Total Minutes', value: totalMinutes, icon: Clock, color: '#0ea5e9' },
          { label: 'Focus Sessions', value: workSessions, icon: CheckCircle2, color: themeColor },
          { label: 'Break Sessions', value: breakSessions, icon: Coffee, color: '#10b981' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/90"
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
              className="text-2xl font-bold text-slate-900 dark:text-slate-100"
              key={stat.value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {stat.value}
            </motion.p>
          </motion.div>
        ))}
      </motion.div>

      {/* History List */}
      <motion.div
        className="bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/50 rounded-[2.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/30 dark:shadow-slate-900/20 backdrop-blur-xl flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Session History</h3>
            <p className="text-sm text-slate-500 mt-1">Your focus journey</p>
          </div>
          <span
            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full text-white"
            style={{ backgroundColor: themeColor }}
          >
            {records.length} Total
          </span>
        </div>

        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase tracking-widest">
                <th className="pb-4 font-bold pl-2">Session</th>
                <th className="pb-4 font-bold">Label</th>
                <th className="pb-4 font-bold">Duration</th>
                <th className="pb-4 font-bold text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <AnimatePresence mode="popLayout">
                {records.map((record, index) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    key={record.id}
                    className="group border-b border-slate-50 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors rounded-xl"
                  >
                    <td className="py-4 pl-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: record.mode === 'work' ? `${themeColor}15` : '#10b98115'
                          }}
                        >
                          {record.mode === 'work' ? (
                            <CheckCircle2 className="h-5 w-5" style={{ color: themeColor }} />
                          ) : (
                            <Coffee className="h-5 w-5 text-emerald-500" />
                          )}
                        </div>
                        <div>
                          <div className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                            {format(new Date(record.startTime), 'h:mm a')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                            {format(new Date(record.startTime), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        {editingId === record.id ? (
                          <motion.input
                            autoFocus
                            type="text"
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:outline-none w-32"
                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(record.id)}
                            onBlur={() => handleSaveNote(record.id)}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                          />
                        ) : (
                          <motion.button
                            onClick={() => handleEdit(record)}
                            className="group/label flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                            whileHover={{ x: 2 }}
                          >
                            <MessageSquare className="h-3.5 w-3.5 opacity-0 group-hover/label:opacity-50 transition-opacity" />
                            <span className="truncate max-w-[120px]">
                              {record.note || (record.mode === 'work' ? "Focus Session" : "Break Time")}
                            </span>
                          </motion.button>
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col">
                        <span
                          className="font-bold text-slate-700 dark:text-slate-300"
                          style={{ color: record.overtimeMinutes > 0 ? themeColor : undefined }}
                        >
                          {record.actualDuration}m
                        </span>
                        {record.overtimeMinutes > 0 && (
                          <motion.span
                            className="text-[10px] font-bold"
                            style={{ color: themeColor }}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 0.7, y: 0 }}
                          >
                            +{record.overtimeMinutes}m overtime
                          </motion.span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right pr-2">
                      <motion.button
                        onClick={() => handleDelete(record.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          "p-2.5 rounded-xl transition-all",
                          deleteConfirmId === record.id
                            ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                            : "text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
