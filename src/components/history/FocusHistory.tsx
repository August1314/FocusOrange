import React, { useState } from 'react';
import { format } from 'date-fns';
import { Trash2, Edit3, MessageSquare, CheckCircle2, Coffee } from 'lucide-react';
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

  const handleEdit = (record: FocusRecord) => {
    setEditingId(record.id);
    setTempNote(record.note || "");
  };

  const handleSaveNote = (id: string) => {
    onUpdateNote(id, tempNote);
    setEditingId(null);
  };

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400 space-y-4">
        <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
          <CheckCircle2 className="w-8 h-8 opacity-20" />
        </div>
        <p className="text-sm font-medium">No sessions recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Session History</h3>
          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full">
            {records.length} TOTAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800 uppercase tracking-widest">
              <tr>
                <th className="pb-4 font-bold">Session Info</th>
                <th className="pb-4 font-bold">Label</th>
                <th className="pb-4 font-bold">Minutes</th>
                <th className="pb-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50 dark:divide-slate-800">
              <AnimatePresence mode="popLayout">
                {records.map((record) => (
                  <motion.tr
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key={record.id}
                    className="group"
                  >
                    <td className="py-4">
                      <div className="text-slate-900 dark:text-slate-100 font-bold">
                        {format(new Date(record.startTime), 'h:mm a')}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                        {format(new Date(record.startTime), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: record.mode === 'work' ? themeColor : '#10b981' }}
                        />
                        {editingId === record.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={tempNote}
                            onChange={(e) => setTempNote(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 py-1 text-sm focus:ring-1"
                            style={{ '--tw-ring-color': themeColor } as React.CSSProperties}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(record.id)}
                            onBlur={() => handleSaveNote(record.id)}
                          />
                        ) : (
                          <button 
                            onClick={() => handleEdit(record)}
                            className="font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 truncate max-w-[120px]"
                          >
                            {record.note || (record.mode === 'work' ? "Focus" : "Break")}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-4 font-black text-slate-400 italic">
                      <span style={{ color: record.overtimeMinutes > 0 ? themeColor : undefined }}>
                        {record.actualDuration}m
                      </span>
                      {record.overtimeMinutes > 0 && (
                        <span 
                          className="text-[9px] block not-italic font-bold opacity-60"
                          style={{ color: themeColor }}
                        >
                          +{record.overtimeMinutes}m OT
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button 
                        onClick={() => onDelete(record.id)}
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
