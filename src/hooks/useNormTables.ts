import { useState, useEffect } from 'react';
import { NormTable } from '@/types/norms';
import { generateNormsSeed } from '@/data/normsSeed';

const STORAGE_KEY = 'norms_tables';

export const useNormTables = () => {
  const [normTables, setNormTables] = useState<NormTable[]>([]);

  useEffect(() => {
    loadNormTables();
  }, []);

  const loadNormTables = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let existingTables: NormTable[] = [];
    
    if (stored) {
      try {
        existingTables = JSON.parse(stored);
        setNormTables(existingTables);
      } catch (e) {
        console.error('Failed to load norms tables:', e);
      }
    }
    
    if (!stored || existingTables.length === 0) {
      const seedTables = generateNormsSeed();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTables));
      setNormTables(seedTables);
    }
  };

  return { normTables, loadNormTables };
};