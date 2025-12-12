import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { importProtocolsFromExcel, ImportedProtocol } from '@/utils/excelImport';
import { toast } from 'sonner';

type ProtocolImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onImport: (protocols: ImportedProtocol[]) => Promise<void>;
};

const ProtocolImportModal = ({ isOpen, onClose, onImport }: ProtocolImportModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<ImportedProtocol[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Пожалуйста, выберите файл Excel (.xlsx или .xls)');
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);

    try {
      const protocols = await importProtocolsFromExcel(file);
      setPreviewData(protocols);
      toast.success(`Найдено ${protocols.length} протоколов для импорта`);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при чтении файла');
      setSelectedFile(null);
      setPreviewData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (previewData.length === 0) return;

    setIsImporting(true);
    try {
      await onImport(previewData);
      toast.success(`Импортировано ${previewData.length} протоколов`);
      handleClose();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка при импорте протоколов');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewData([]);
    setIsProcessing(false);
    setIsImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Upload" size={20} />
            Импорт протоколов из Excel
          </DialogTitle>
          <DialogDescription>
            Загрузите файл Excel с протоколами. Используйте экспортированный файл как шаблон.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-2">
                <Icon name="FileSpreadsheet" size={48} className="text-muted-foreground" />
                <p className="text-sm font-medium">
                  {selectedFile ? selectedFile.name : 'Нажмите для выбора файла Excel'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Поддерживаются форматы .xlsx и .xls
                </p>
              </div>
            </label>
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Icon name="Loader2" size={20} className="animate-spin" />
              <span>Обработка файла...</span>
            </div>
          )}

          {previewData.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Icon name="Eye" size={18} />
                Предварительный просмотр ({previewData.length} протоколов)
              </h3>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {previewData.map((protocol, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{protocol.patientName}</p>
                          <p className="text-sm text-muted-foreground">
                            {protocol.studyType} • {protocol.studyDate}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <p>{protocol.gender === 'male' ? 'М' : 'Ж'}</p>
                          <p>{Object.keys(protocol.results).length} показателей</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Icon name="Info" size={16} />
              Важная информация
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Используйте экспортированный файл как шаблон</li>
              <li>• Все обязательные поля должны быть заполнены</li>
              <li>• Тип исследования должен совпадать с существующими</li>
              <li>• Показатели будут автоматически сопоставлены</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            Отмена
          </Button>
          <Button onClick={handleImport} disabled={previewData.length === 0 || isImporting}>
            {isImporting ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Импорт...
              </>
            ) : (
              <>
                <Icon name="Upload" size={16} className="mr-2" />
                Импортировать {previewData.length > 0 && `(${previewData.length})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProtocolImportModal;
