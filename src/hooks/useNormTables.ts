import { useState, useEffect, useCallback } from 'react';
import { NormTable } from '@/types/norms';
import { generateNormsSeed } from '@/data/normsSeed';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = 'https://functions.poehali.dev/10cc71ce-7a44-485c-a1ba-83e4856376e8';
const STORAGE_KEY = 'norms_tables_migrated';

type ApiNormTable = {
  id: string;
  doctor_id: number;
  study_type: string;
  category: string;
  parameter: string;
  norm_type: string;
  rows: any[];
  show_in_report: boolean;
  conclusion_below: string;
  conclusion_above: string;
  conclusion_borderline_low?: string;
  conclusion_borderline_high?: string;
  created_at: string;
  updated_at: string;
};

function convertFromApi(apiTable: ApiNormTable): NormTable {
  return {
    id: apiTable.id,
    studyType: apiTable.study_type,
    category: apiTable.category as any,
    parameter: apiTable.parameter,
    normType: apiTable.norm_type as any,
    rows: apiTable.rows,
    showInReport: apiTable.show_in_report,
    conclusionBelow: apiTable.conclusion_below,
    conclusionAbove: apiTable.conclusion_above,
    conclusionBorderlineLow: apiTable.conclusion_borderline_low,
    conclusionBorderlineHigh: apiTable.conclusion_borderline_high,
    createdAt: apiTable.created_at,
    updatedAt: apiTable.updated_at,
  };
}

export const useNormTables = () => {
  const { doctor } = useAuth();
  const [normTables, setNormTables] = useState<NormTable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const saveNormTable = async (table: NormTable): Promise<string | null> => {
    if (!doctor) return null;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': doctor.email,
        },
        body: JSON.stringify({
          action: 'save_norm_table',
          doctor_id: doctor.id,
          table: table,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save norm table');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Failed to save norm table:', error);
      toast.error('Ошибка сохранения таблицы норм');
      return null;
    }
  };

  const loadNormTables = useCallback(async () => {
    if (!doctor) {
      setNormTables([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}?type=norm_tables&doctor_id=${doctor.id}`, {
        headers: {
          'X-Auth-Token': doctor.email,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load norm tables');
      }

      const data = await response.json();
      const tables = data.norm_tables.map(convertFromApi);
      
      if (tables.length === 0) {
        const migrated = localStorage.getItem(STORAGE_KEY);
        if (!migrated) {
          const seedTables = generateNormsSeed();
          let successCount = 0;
          
          for (const table of seedTables) {
            try {
              const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Auth-Token': doctor.email,
                },
                body: JSON.stringify({
                  action: 'save_norm_table',
                  doctor_id: doctor.id,
                  table: table,
                }),
              });
              if (response.ok) {
                successCount++;
              } else {
                const errorText = await response.text();
                console.error('Failed to migrate table:', table.parameter, errorText);
              }
            } catch (error) {
              console.error('Failed to migrate table:', error);
            }
          }
          
          if (successCount > 0) {
            localStorage.setItem(STORAGE_KEY, 'true');
            
            const reloadResponse = await fetch(`${API_URL}?type=norm_tables&doctor_id=${doctor.id}`, {
              headers: {
                'X-Auth-Token': doctor.email,
              },
            });
            if (reloadResponse.ok) {
              const reloadData = await reloadResponse.json();
              setNormTables(reloadData.norm_tables.map(convertFromApi));
            }
          } else {
            toast.error('Не удалось создать таблицы норм. Попробуйте позже.');
          }
          return;
        }
      }
      
      setNormTables(tables);
    } catch (error) {
      console.error('Failed to load norm tables:', error);
      toast.error('Ошибка загрузки таблиц норм');
      setNormTables([]);
    } finally {
      setIsLoading(false);
    }
  }, [doctor]);

  const deleteNormTable = async (tableId: string): Promise<boolean> => {
    if (!doctor) return false;

    try {
      const response = await fetch(`${API_URL}?table_id=${tableId}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': doctor.email,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete norm table');
      }

      await loadNormTables();
      return true;
    } catch (error) {
      console.error('Failed to delete norm table:', error);
      toast.error('Ошибка удаления таблицы норм');
      return false;
    }
  };

  const deleteAllNormTables = async (): Promise<boolean> => {
    if (!doctor) return false;

    try {
      const response = await fetch(`${API_URL}?delete_all=true`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': doctor.email,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete all norm tables');
      }

      return true;
    } catch (error) {
      console.error('Failed to delete all norm tables:', error);
      toast.error('Ошибка удаления таблиц норм');
      return false;
    }
  };

  useEffect(() => {
    loadNormTables();
  }, [loadNormTables]);

  return { normTables, isLoading, loadNormTables, saveNormTable, deleteNormTable, deleteAllNormTables };
};