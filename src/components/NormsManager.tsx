import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { StudyType, studyTypes } from '@/types/medical';
import { NormTable, PatientCategory, PATIENT_CATEGORIES } from '@/types/norms';
import { NormTableWizard } from './NormTableWizard';
import { NormTableList } from './NormTableList';
import { useNormTables } from '@/hooks/useNormTables';

const STORAGE_KEY = 'norms_tables';

export const NormsManager = () => {
  const [selectedStudy, setSelectedStudy] = useState<StudyType | null>(null);
  const { normTables: loadedNormTables, loadNormTables: reloadNormTables } = useNormTables();
  const [normTables, setNormTables] = useState<NormTable[]>([]);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<NormTable | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PatientCategory | 'all'>('all');

  useEffect(() => {
    setNormTables(loadedNormTables);
  }, [loadedNormTables]);

  const saveNormTables = (tables: NormTable[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    setNormTables(tables);
    reloadNormTables();
  };

  const handleCreateTable = () => {
    if (!selectedStudy) {
      toast.error('Выберите тип исследования');
      return;
    }
    setEditingTable(null);
    setIsEditorOpen(true);
  };

  const handleEditTable = (table: NormTable) => {
    setEditingTable(table);
    setIsEditorOpen(true);
  };

  const handleSaveTable = (table: NormTable) => {
    if (editingTable) {
      const updated = normTables.map(t => t.id === table.id ? table : t);
      saveNormTables(updated);
      toast.success('Таблица норм обновлена');
    } else {
      saveNormTables([...normTables, table]);
      toast.success('Таблица норм создана');
    }
    setIsEditorOpen(false);
    setEditingTable(null);
  };

  const handleDeleteTable = (tableId: string) => {
    const updated = normTables.filter(t => t.id !== tableId);
    saveNormTables(updated);
    toast.success('Таблица норм удалена');
  };



  const filteredTables = selectedStudy
    ? normTables.filter(t => {
        const matchStudy = t.studyType === selectedStudy.id;
        const matchCategory = selectedCategory === 'all' || t.category === selectedCategory;
        return matchStudy && matchCategory;
      })
    : [];

  const categoriesWithTables = selectedStudy
    ? Object.entries(PATIENT_CATEGORIES).filter(([key]) => {
        return normTables.some(t => t.studyType === selectedStudy.id && t.category === key);
      })
    : [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Выбор исследования</CardTitle>
          <CardDescription>
            Выберите тип исследования для управления нормативными таблицами
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedStudy?.id}
            onValueChange={(value) => {
              const study = studyTypes.find(s => s.id === value);
              setSelectedStudy(study || null);
              setSelectedCategory('all');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип исследования" />
            </SelectTrigger>
            <SelectContent>
              {studyTypes.map((study) => (
                <SelectItem key={study.id} value={study.id}>
                  <div className="flex items-center gap-2">
                    <Icon name={study.icon as any} size={16} />
                    {study.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedStudy && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Table" size={20} />
                    Нормативные таблицы
                  </CardTitle>
                  <CardDescription>
                    {selectedStudy.name} - таблицы норм для разных категорий пациентов
                  </CardDescription>
                </div>
                <Button onClick={handleCreateTable}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Создать таблицу
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoriesWithTables.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Фильтр по категории
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => setSelectedCategory(value as PatientCategory | 'all')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      {categoriesWithTables.map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filteredTables.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Table" size={48} className="mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Нет созданных таблиц норм для этого исследования
                  </p>
                  <Button onClick={handleCreateTable} variant="outline">
                    <Icon name="Plus" size={16} className="mr-2" />
                    Создать первую таблицу
                  </Button>
                </div>
              ) : (
                <NormTableList
                  tables={filteredTables}
                  onEdit={handleEditTable}
                  onDelete={handleDeleteTable}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {isEditorOpen && selectedStudy && (
        <NormTableWizard
          studyType={selectedStudy}
          table={editingTable}
          onSave={handleSaveTable}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingTable(null);
          }}
        />
      )}
    </>
  );
};