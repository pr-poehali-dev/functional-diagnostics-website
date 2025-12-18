import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { StudyType } from '@/types/medical';
import { NormTable, NormTableRow, PatientCategory, NormType, AgeUnit, PATIENT_CATEGORIES, NORM_TYPES, AGE_UNITS } from '@/types/norms';

interface NormTableWizardProps {
  studyType: StudyType;
  table: NormTable | null;
  onSave: (table: NormTable) => void;
  onCancel: () => void;
}

export const NormTableWizard = ({ studyType, table, onSave, onCancel }: NormTableWizardProps) => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<PatientCategory | ''>('');
  const [parameter, setParameter] = useState('');
  const [normType, setNormType] = useState<NormType | ''>('');
  const [rows, setRows] = useState<NormTableRow[]>([]);
  const [showInReport, setShowInReport] = useState(true);
  const [conclusionBelow, setConclusionBelow] = useState('');
  const [conclusionAbove, setConclusionAbove] = useState('');

  useEffect(() => {
    if (table) {
      setCategory(table.category);
      setParameter(table.parameter);
      setNormType(table.normType);
      setRows(table.rows);
      setShowInReport(table.showInReport);
      setConclusionBelow(table.conclusionBelow);
      setConclusionAbove(table.conclusionAbove);
      setStep(4);
    } else {
      addEmptyRow();
    }
  }, [table]);

  const addEmptyRow = () => {
    const newRow: NormTableRow = {
      id: crypto.randomUUID(),
      rangeFrom: '',
      rangeTo: '',
      rangeUnit: normType === 'age' ? 'years' : undefined,
      parameterFrom: '',
      parameterTo: '',
    };
    setRows([...rows, newRow]);
  };

  const updateRow = (id: string, field: keyof NormTableRow, value: string | AgeUnit) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const deleteRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const handleNext = () => {
    if (step === 1 && !category) return;
    if (step === 2 && !parameter.trim()) return;
    if (step === 3 && !normType) return;
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSave = () => {
    if (!category || !parameter.trim() || !normType) return;
    
    const validRows = rows.filter(row => 
      row.rangeFrom.trim() && row.rangeTo.trim() && 
      row.parameterFrom.trim() && row.parameterTo.trim()
    );

    if (validRows.length === 0) return;

    const normTable: NormTable = {
      id: table?.id || crypto.randomUUID(),
      studyType: studyType.id,
      category: category as PatientCategory,
      parameter: parameter.trim(),
      normType: normType as NormType,
      rows: validRows,
      showInReport,
      conclusionBelow: conclusionBelow.trim(),
      conclusionAbove: conclusionAbove.trim(),
      createdAt: table?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(normTable);
  };

  const getRangeLabels = () => {
    switch (normType) {
      case 'age':
        return { from: 'Возраст от', to: 'Возраст до' };
      case 'weight':
        return { from: 'Масса от (кг)', to: 'Масса до (кг)' };
      case 'height':
        return { from: 'Рост от (см)', to: 'Рост до (см)' };
      case 'bsa':
        return { from: 'ППТ от (м²)', to: 'ППТ до (м²)' };
      default:
        return { from: 'От', to: 'До' };
    }
  };

  const availableParameters = studyType.parameters || [];

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {table ? 'Редактирование таблицы норм' : 'Создание таблицы норм'}
            {' - '}
            {studyType.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex items-center gap-2 ${
                    s <= step ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && <Icon name="ChevronRight" size={16} />}
                </div>
              ))}
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Шаг 1: Выберите категорию пациентов</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(PATIENT_CATEGORIES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setCategory(key as PatientCategory)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      category === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Шаг 2: Выберите параметр</h3>
              <div className="space-y-2">
                <Label>Параметр исследования</Label>
                <Select value={parameter} onValueChange={setParameter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите параметр" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParameters.map((param) => (
                      <SelectItem key={param.id} value={param.id}>
                        {param.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Шаг 3: Выберите тип нормирования</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(NORM_TYPES).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setNormType(key as NormType)}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      normType === key
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Шаг 4: Создайте таблицу норм</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Таблица значений</Label>
                  <Button onClick={addEmptyRow} size="sm" variant="outline">
                    <Icon name="Plus" size={14} className="mr-1" />
                    Добавить строку
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 text-sm font-medium">
                            {getRangeLabels().from}
                          </th>
                          <th className="text-left p-2 text-sm font-medium">
                            {getRangeLabels().to}
                          </th>
                          {normType === 'age' && (
                            <th className="text-left p-2 text-sm font-medium w-32">
                              Единица
                            </th>
                          )}
                          <th className="text-left p-2 text-sm font-medium">
                            {parameter} от
                          </th>
                          <th className="text-left p-2 text-sm font-medium">
                            {parameter} до
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => (
                          <tr key={row.id} className="border-t">
                            <td className="p-2">
                              <Input
                                value={row.rangeFrom}
                                onChange={(e) => updateRow(row.id, 'rangeFrom', e.target.value)}
                                placeholder="0"
                                type="number"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={row.rangeTo}
                                onChange={(e) => updateRow(row.id, 'rangeTo', e.target.value)}
                                placeholder="100"
                                type="number"
                              />
                            </td>
                            {normType === 'age' && (
                              <td className="p-2">
                                <Select
                                  value={row.rangeUnit || 'years'}
                                  onValueChange={(value) => updateRow(row.id, 'rangeUnit', value as AgeUnit)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(AGE_UNITS).map(([key, label]) => (
                                      <SelectItem key={key} value={key}>
                                        {label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>
                            )}
                            <td className="p-2">
                              <Input
                                value={row.parameterFrom}
                                onChange={(e) => updateRow(row.id, 'parameterFrom', e.target.value)}
                                placeholder="0"
                                type="number"
                                step="0.01"
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                value={row.parameterTo}
                                onChange={(e) => updateRow(row.id, 'parameterTo', e.target.value)}
                                placeholder="100"
                                type="number"
                                step="0.01"
                              />
                            </td>
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteRow(row.id)}
                                disabled={rows.length === 1}
                              >
                                <Icon name="Trash2" size={14} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showInReport"
                    checked={showInReport}
                    onCheckedChange={(checked) => setShowInReport(checked as boolean)}
                  />
                  <Label htmlFor="showInReport" className="cursor-pointer">
                    Отображать значения в бланке протокола
                  </Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conclusionBelow">
                    Шаблон заключения при снижении параметра
                  </Label>
                  <Textarea
                    id="conclusionBelow"
                    value={conclusionBelow}
                    onChange={(e) => setConclusionBelow(e.target.value)}
                    placeholder="Значение снижено относительно нормы..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conclusionAbove">
                    Шаблон заключения при превышении параметра
                  </Label>
                  <Textarea
                    id="conclusionAbove"
                    value={conclusionAbove}
                    onChange={(e) => setConclusionAbove(e.target.value)}
                    placeholder="Значение превышает норму..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={step === 1 ? onCancel : handleBack}
            >
              {step === 1 ? 'Отмена' : 'Назад'}
            </Button>
            {step < 4 ? (
              <Button onClick={handleNext} disabled={
                (step === 1 && !category) ||
                (step === 2 && !parameter.trim()) ||
                (step === 3 && !normType)
              }>
                Далее
                <Icon name="ChevronRight" size={16} className="ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave}>
                <Icon name="Check" size={16} className="mr-2" />
                Сохранить
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};