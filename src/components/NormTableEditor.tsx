import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { StudyType, Parameter } from '@/types/medical';
import { NormTable, PatientCategory, NormType, NormRow, PATIENT_CATEGORIES, NORM_TYPES } from '@/types/norms';

type NormTableEditorProps = {
  studyType: StudyType;
  table: NormTable | null;
  onSave: (table: NormTable) => void;
  onCancel: () => void;
};

export const NormTableEditor = ({ studyType, table, onSave, onCancel }: NormTableEditorProps) => {
  const [name, setName] = useState(table?.name || '');
  const [category, setCategory] = useState<PatientCategory>(table?.category || 'adult_male');
  const [normType, setNormType] = useState<NormType>(table?.normType || 'age');
  const [rows, setRows] = useState<NormRow[]>(table?.rows || []);

  useEffect(() => {
    if (!table && studyType) {
      const initialRows: NormRow[] = studyType.parameters.map(param => ({
        id: param.id,
        parameter: param.name,
        minValue: param.normalRange.min,
        maxValue: param.normalRange.max,
      }));
      setRows(initialRows);
    }
  }, [table, studyType]);

  const handleAddRow = () => {
    const newRow: NormRow = {
      id: `custom_${Date.now()}`,
      parameter: '',
      minValue: 0,
      maxValue: 0,
      rangeType: normType,
      rangeMin: 0,
      rangeMax: 100,
    };
    setRows([...rows, newRow]);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof NormRow, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Введите название таблицы');
      return;
    }

    if (rows.length === 0) {
      toast.error('Добавьте хотя бы один параметр');
      return;
    }

    const emptyParameter = rows.find(r => !r.parameter.trim());
    if (emptyParameter) {
      toast.error('Заполните названия всех параметров');
      return;
    }

    const newTable: NormTable = {
      id: table?.id || `norm_${Date.now()}`,
      name: name.trim(),
      studyType: studyType.id,
      category,
      normType,
      rows,
      createdAt: table?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: table?.source || 'manual',
    };

    onSave(newTable);
  };

  const availableParameters = studyType.parameters.filter(
    param => !rows.some(r => r.id === param.id)
  );

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {table ? 'Редактирование таблицы норм' : 'Создание таблицы норм'}
          </DialogTitle>
          <DialogDescription>
            {studyType.name} - настройка нормативных значений для выбранной категории
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Название таблицы</Label>
              <Input
                id="name"
                placeholder="Например: Нормы ASE 2015"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Категория пациентов</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as PatientCategory)}>
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PATIENT_CATEGORIES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="normType">Тип нормирования</Label>
            <Select value={normType} onValueChange={(value) => setNormType(value as NormType)}>
              <SelectTrigger id="normType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NORM_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(category === 'child_male' || category === 'child_female') && (
              <p className="text-sm text-muted-foreground">
                Для детей можно создать несколько таблиц с разными типами нормирования
              </p>
            )}
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Параметры и диапазоны норм</h3>
              <Button onClick={handleAddRow} size="sm" variant="outline">
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить параметр
              </Button>
            </div>

            {rows.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Нет добавленных параметров
              </p>
            ) : (
              <div className="space-y-3">
                {rows.map((row, index) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2 items-center p-3 bg-secondary/30 rounded-lg">
                    <div className="col-span-4">
                      <Input
                        placeholder="Название параметра"
                        value={row.parameter}
                        onChange={(e) => handleRowChange(index, 'parameter', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Минимум"
                        value={row.minValue}
                        onChange={(e) => handleRowChange(index, 'minValue', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number"
                        placeholder="Максимум"
                        value={row.maxValue}
                        onChange={(e) => handleRowChange(index, 'maxValue', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRow(index)}
                        title="Удалить параметр"
                      >
                        <Icon name="Trash2" size={16} className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {availableParameters.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Доступные параметры исследования:
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableParameters.map((param) => (
                    <Button
                      key={param.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newRow: NormRow = {
                          id: param.id,
                          parameter: param.name,
                          minValue: param.normalRange.min,
                          maxValue: param.normalRange.max,
                        };
                        setRows([...rows, newRow]);
                      }}
                    >
                      <Icon name="Plus" size={14} className="mr-1" />
                      {param.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            <Icon name="Save" size={16} className="mr-2" />
            Сохранить таблицу
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
