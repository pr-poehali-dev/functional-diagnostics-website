import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { StudyType } from '@/types/medical';
import { NormTable, PatientCategory, NormType, NormRow, PATIENT_CATEGORIES, NORM_TYPES } from '@/types/norms';

type ExcelImporterProps = {
  studyType: StudyType;
  onImport: (tables: NormTable[]) => void;
  onCancel: () => void;
};

export const ExcelImporter = ({ studyType, onImport, onCancel }: ExcelImporterProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState('');
  const [category, setCategory] = useState<PatientCategory>('adult_male');
  const [normType, setNormType] = useState<NormType>('age');
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error('Выберите Excel файл (.xlsx или .xls)');
      return;
    }

    setFile(selectedFile);
    parseExcelFile(selectedFile);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        setPreviewData(jsonData.slice(0, 10) as any[]);
        toast.success('Файл загружен, проверьте данные');
      } catch (error) {
        console.error('Error parsing Excel:', error);
        toast.error('Ошибка чтения Excel файла');
      }
    };

    reader.onerror = () => {
      toast.error('Ошибка чтения файла');
    };

    reader.readAsBinaryString(file);
  };

  const handleImport = () => {
    if (!file) {
      toast.error('Выберите файл для импорта');
      return;
    }

    if (!tableName.trim()) {
      toast.error('Введите название таблицы');
      return;
    }

    if (previewData.length < 2) {
      toast.error('Файл должен содержать заголовки и данные');
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          toast.error('Excel файл не содержит данных');
          return;
        }

        const rows: NormRow[] = jsonData.map((row, index) => {
          const parameter = row['Параметр'] || row['Parameter'] || row['parameter'] || `Параметр ${index + 1}`;
          const minValue = parseFloat(row['Минимум'] || row['Min'] || row['min'] || 0);
          const maxValue = parseFloat(row['Максимум'] || row['Max'] || row['max'] || 0);

          return {
            id: `imported_${Date.now()}_${index}`,
            parameter: String(parameter),
            minValue,
            maxValue,
          };
        }).filter(row => row.parameter && !isNaN(row.minValue) && !isNaN(row.maxValue));

        if (rows.length === 0) {
          toast.error('Не удалось извлечь данные. Проверьте структуру файла');
          return;
        }

        const newTable: NormTable = {
          id: `norm_${Date.now()}`,
          name: tableName.trim(),
          studyType: studyType.id,
          category,
          normType,
          rows,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'excel',
        };

        onImport([newTable]);
        toast.success(`Импортировано параметров: ${rows.length}`);
      } catch (error) {
        console.error('Error importing Excel:', error);
        toast.error('Ошибка импорта данных');
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Импорт таблицы норм из Excel</DialogTitle>
          <DialogDescription>
            Загрузите Excel файл с нормативными значениями. Файл должен содержать колонки: "Параметр", "Минимум", "Максимум"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tableName">Название таблицы</Label>
              <Input
                id="tableName"
                placeholder="Например: Нормы ASE 2015"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Excel файл</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              Поддерживаются форматы: .xlsx, .xls
            </p>
          </div>

          {previewData.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2">
              <h4 className="font-semibold flex items-center gap-2">
                <Icon name="Eye" size={16} />
                Предпросмотр данных
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {(previewData[0] as any[])?.map((header: any, index: number) => (
                        <th key={index} className="text-left p-2 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(1, 6).map((row: any[], rowIndex: number) => (
                      <tr key={rowIndex} className="border-b">
                        {row.map((cell: any, cellIndex: number) => (
                          <td key={cellIndex} className="p-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 6 && (
                <p className="text-sm text-muted-foreground">
                  ... и ещё {previewData.length - 6} строк
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button onClick={handleImport} disabled={!file || !tableName.trim()}>
            <Icon name="FileUp" size={16} className="mr-2" />
            Импортировать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
