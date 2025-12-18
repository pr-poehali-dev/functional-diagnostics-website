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
      const seedTables: NormTable[] = [
        {
          id: crypto.randomUUID(),
          studyType: 'ecg',
          category: 'child_male',
          parameter: 'hr',
          normType: 'age',
          rows: [
            { id: crypto.randomUUID(), rangeFrom: '0', rangeTo: '1', rangeUnit: 'months', parameterFrom: '110', parameterTo: '170' },
            { id: crypto.randomUUID(), rangeFrom: '1', rangeTo: '3', rangeUnit: 'months', parameterFrom: '110', parameterTo: '170' },
            { id: crypto.randomUUID(), rangeFrom: '3', rangeTo: '6', rangeUnit: 'months', parameterFrom: '110', parameterTo: '170' },
            { id: crypto.randomUUID(), rangeFrom: '6', rangeTo: '12', rangeUnit: 'months', parameterFrom: '100', parameterTo: '160' },
            { id: crypto.randomUUID(), rangeFrom: '1', rangeTo: '2', rangeUnit: 'years', parameterFrom: '90', parameterTo: '150' },
            { id: crypto.randomUUID(), rangeFrom: '2', rangeTo: '4', rangeUnit: 'years', parameterFrom: '90', parameterTo: '140' },
            { id: crypto.randomUUID(), rangeFrom: '4', rangeTo: '6', rangeUnit: 'years', parameterFrom: '85', parameterTo: '125' },
            { id: crypto.randomUUID(), rangeFrom: '6', rangeTo: '8', rangeUnit: 'years', parameterFrom: '78', parameterTo: '118' },
            { id: crypto.randomUUID(), rangeFrom: '8', rangeTo: '10', rangeUnit: 'years', parameterFrom: '70', parameterTo: '110' },
            { id: crypto.randomUUID(), rangeFrom: '10', rangeTo: '12', rangeUnit: 'years', parameterFrom: '65', parameterTo: '105' },
            { id: crypto.randomUUID(), rangeFrom: '12', rangeTo: '15', rangeUnit: 'years', parameterFrom: '60', parameterTo: '100' },
            { id: crypto.randomUUID(), rangeFrom: '15', rangeTo: '18', rangeUnit: 'years', parameterFrom: '60', parameterTo: '95' },
          ],
          showInReport: true,
          conclusionBelow: 'Выявлена брадикардия - снижение частоты сердечных сокращений относительно возрастной нормы',
          conclusionAbove: 'Выявлена тахикардия - увеличение частоты сердечных сокращений относительно возрастной нормы',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          studyType: 'ecg',
          category: 'child_female',
          parameter: 'hr',
          normType: 'age',
          rows: [
            { id: crypto.randomUUID(), rangeFrom: '0', rangeTo: '1', rangeUnit: 'months', parameterFrom: '110', parameterTo: '170' },
            { id: crypto.randomUUID(), rangeFrom: '1', rangeTo: '3', rangeUnit: 'months', parameterFrom: '110', parameterTo: '170' },
            { id: crypto.randomUUID(), rangeFrom: '3', rangeTo: '6', rangeUnit: 'months', parameterFrom: '110', parameterTo: '170' },
            { id: crypto.randomUUID(), rangeFrom: '6', rangeTo: '12', rangeUnit: 'months', parameterFrom: '100', parameterTo: '160' },
            { id: crypto.randomUUID(), rangeFrom: '1', rangeTo: '2', rangeUnit: 'years', parameterFrom: '90', parameterTo: '150' },
            { id: crypto.randomUUID(), rangeFrom: '2', rangeTo: '4', rangeUnit: 'years', parameterFrom: '90', parameterTo: '140' },
            { id: crypto.randomUUID(), rangeFrom: '4', rangeTo: '6', rangeUnit: 'years', parameterFrom: '85', parameterTo: '125' },
            { id: crypto.randomUUID(), rangeFrom: '6', rangeTo: '8', rangeUnit: 'years', parameterFrom: '78', parameterTo: '118' },
            { id: crypto.randomUUID(), rangeFrom: '8', rangeTo: '10', rangeUnit: 'years', parameterFrom: '70', parameterTo: '110' },
            { id: crypto.randomUUID(), rangeFrom: '10', rangeTo: '12', rangeUnit: 'years', parameterFrom: '65', parameterTo: '105' },
            { id: crypto.randomUUID(), rangeFrom: '12', rangeTo: '15', rangeUnit: 'years', parameterFrom: '60', parameterTo: '100' },
            { id: crypto.randomUUID(), rangeFrom: '15', rangeTo: '18', rangeUnit: 'years', parameterFrom: '60', parameterTo: '95' },
          ],
          showInReport: true,
          conclusionBelow: 'Выявлена брадикардия - снижение частоты сердечных сокращений относительно возрастной нормы',
          conclusionAbove: 'Выявлена тахикардия - увеличение частоты сердечных сокращений относительно возрастной нормы',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          studyType: 'ecg',
          category: 'adult_male',
          parameter: 'hr',
          normType: 'age',
          rows: [
            { id: crypto.randomUUID(), rangeFrom: '18', rangeTo: '30', rangeUnit: 'years', parameterFrom: '60', parameterTo: '90' },
            { id: crypto.randomUUID(), rangeFrom: '30', rangeTo: '40', rangeUnit: 'years', parameterFrom: '60', parameterTo: '90' },
            { id: crypto.randomUUID(), rangeFrom: '40', rangeTo: '50', rangeUnit: 'years', parameterFrom: '60', parameterTo: '90' },
            { id: crypto.randomUUID(), rangeFrom: '50', rangeTo: '60', rangeUnit: 'years', parameterFrom: '60', parameterTo: '90' },
            { id: crypto.randomUUID(), rangeFrom: '60', rangeTo: '70', rangeUnit: 'years', parameterFrom: '60', parameterTo: '90' },
            { id: crypto.randomUUID(), rangeFrom: '70', rangeTo: '120', rangeUnit: 'years', parameterFrom: '60', parameterTo: '90' },
          ],
          showInReport: true,
          conclusionBelow: 'Выявлена брадикардия - снижение частоты сердечных сокращений ниже возрастной нормы',
          conclusionAbove: 'Выявлена тахикардия - увеличение частоты сердечных сокращений выше возрастной нормы',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          studyType: 'ecg',
          category: 'adult_female',
          parameter: 'hr',
          normType: 'age',
          rows: [
            { id: crypto.randomUUID(), rangeFrom: '18', rangeTo: '30', rangeUnit: 'years', parameterFrom: '65', parameterTo: '95' },
            { id: crypto.randomUUID(), rangeFrom: '30', rangeTo: '40', rangeUnit: 'years', parameterFrom: '65', parameterTo: '95' },
            { id: crypto.randomUUID(), rangeFrom: '40', rangeTo: '50', rangeUnit: 'years', parameterFrom: '65', parameterTo: '95' },
            { id: crypto.randomUUID(), rangeFrom: '50', rangeTo: '60', rangeUnit: 'years', parameterFrom: '65', parameterTo: '95' },
            { id: crypto.randomUUID(), rangeFrom: '60', rangeTo: '70', rangeUnit: 'years', parameterFrom: '65', parameterTo: '95' },
            { id: crypto.randomUUID(), rangeFrom: '70', rangeTo: '120', rangeUnit: 'years', parameterFrom: '65', parameterTo: '95' },
          ],
          showInReport: true,
          conclusionBelow: 'Выявлена брадикардия - снижение частоты сердечных сокращений ниже возрастной нормы',
          conclusionAbove: 'Выявлена тахикардия - увеличение частоты сердечных сокращений выше возрастной нормы',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedTables));
      setNormTables(seedTables);
    }
  };

  return { normTables, loadNormTables };
};