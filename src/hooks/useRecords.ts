import { useState, useEffect } from 'react';
import { FocusRecord } from '../types';

const STORAGE_KEY = 'focus_records';

export function useRecords() {
  const [records, setRecords] = useState<FocusRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecords(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse records", e);
      }
    }
  }, []);

  const saveRecords = (newRecords: FocusRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
  };

  const addRecord = (record: Omit<FocusRecord, 'id'>) => {
    const newRecord: FocusRecord = {
      ...record,
      id: crypto.randomUUID(),
    };
    saveRecords([newRecord, ...records]);
  };

  const updateRecordNote = (id: string, note: string) => {
    saveRecords(
      records.map((r) => (r.id === id ? { ...r, note } : r))
    );
  };

  const deleteRecord = (id: string) => {
    saveRecords(records.filter((r) => r.id !== id));
  };

  return {
    records,
    addRecord,
    updateRecordNote,
    deleteRecord,
  };
}
