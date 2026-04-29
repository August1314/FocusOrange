import { useState, useEffect } from 'react';
import { FocusRecord, FocusRecordPatch } from '../types';
import {
  createRecord as persistCreateRecord,
  deleteRecord as persistDeleteRecord,
  loadRecords,
  migrateLegacyLocalStorageData,
  updateRecord as persistUpdateRecord,
} from '../lib/desktop-storage';

export function useRecords() {
  const [records, setRecords] = useState<FocusRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    migrateLegacyLocalStorageData()
      .then(() => loadRecords())
      .then((loadedRecords) => {
        if (!cancelled) {
          setRecords(loadedRecords);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('Failed to load records', e);
          setError('Failed to load session history.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const addRecord = async (record: Omit<FocusRecord, 'id'>) => {
    const newRecord: FocusRecord = {
      ...record,
      id: crypto.randomUUID(),
    };

    try {
      const nextRecords = await persistCreateRecord(newRecord);
      setRecords(nextRecords);
      setError(null);
    } catch (e) {
      console.error('Failed to save record', e);
      setError('Failed to save session record.');
    }
  };

  const updateRecord = async (id: string, patch: FocusRecordPatch) => {
    try {
      const nextRecords = await persistUpdateRecord(id, patch);
      setRecords(nextRecords);
      setError(null);
    } catch (e) {
      console.error('Failed to update record', e);
      setError('Failed to update session record.');
    }
  };

  const updateRecordNote = async (id: string, note: string) => {
    await updateRecord(id, { note });
  };

  const deleteRecord = async (id: string) => {
    try {
      const nextRecords = await persistDeleteRecord(id);
      setRecords(nextRecords);
      setError(null);
    } catch (e) {
      console.error('Failed to delete record', e);
      setError('Failed to delete session record.');
    }
  };

  return {
    records,
    error,
    addRecord,
    updateRecord,
    updateRecordNote,
    deleteRecord,
  };
}
