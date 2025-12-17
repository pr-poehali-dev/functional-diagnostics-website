import { useState, useEffect } from 'react';
import { NormTable } from '@/types/norms';

const STORAGE_KEY = 'norms_tables';

export const useNormTables = () => {
  const [normTables, setNormTables] = useState<NormTable[]>([]);

  useEffect(() => {
    loadNormTables();
  }, []);

  const loadNormTables = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setNormTables(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load norms tables:', e);
      }
    }
  };

  return { normTables, loadNormTables };
};
