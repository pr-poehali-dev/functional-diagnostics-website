import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { StudyType, studyTypes } from '@/types/medical';
import { toast } from 'sonner';

type FieldOrderSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (studyId: string, order: string[]) => void;
  loadFieldOrder: (studyId: string) => string[];
};

export const FieldOrderSettings = ({
  isOpen,
  onClose,
  onSave,
  loadFieldOrder,
}: FieldOrderSettingsProps) => {
  const [selectedStudy, setSelectedStudy] = useState<StudyType | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);

  useEffect(() => {
    if (selectedStudy) {
      const savedOrder = loadFieldOrder(selectedStudy.id);
      const defaultOrder = selectedStudy.parameters.map(p => p.id);
      const finalOrder = savedOrder.length > 0 ? savedOrder : defaultOrder;
      
      const allFieldIds = selectedStudy.parameters.map(p => p.id);
      const hidden = allFieldIds.filter(id => !finalOrder.includes(id));
      
      setOrder(finalOrder);
      setHiddenFields(hidden);
    }
  }, [selectedStudy, loadFieldOrder]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setOrder(newOrder);
  };

  const hideField = (fieldId: string) => {
    setOrder(order.filter(id => id !== fieldId));
    setHiddenFields([...hiddenFields, fieldId]);
  };

  const showField = (fieldId: string) => {
    setHiddenFields(hiddenFields.filter(id => id !== fieldId));
    setOrder([...order, fieldId]);
  };

  const resetToDefault = () => {
    if (!selectedStudy) return;
    const defaultOrder = selectedStudy.parameters.map(p => p.id);
    setOrder(defaultOrder);
    setHiddenFields([]);
    toast.success('Порядок полей сброшен к значениям по умолчанию');
  };

  const handleSave = () => {
    if (!selectedStudy) {
      toast.error('Выберите тип исследования');
      return;
    }
    onSave(selectedStudy.id, order);
    toast.success('Порядок полей сохранён');
    onClose();
  };

  const handleStudyChange = (studyId: string) => {
    const study = studyTypes.find(s => s.id === studyId);
    setSelectedStudy(study || null);
  };

  const getParameterName = (id: string) => {
    if (!selectedStudy) return id;
    return selectedStudy.parameters.find(p => p.id === id)?.name || id;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="ListOrdered" size={20} />
            Настройка порядка полей
          </DialogTitle>
          <DialogDescription>
            Выберите тип исследования и настройте порядок полей для окна быстрого ввода
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Тип исследования</Label>
            <Select
              value={selectedStudy?.id}
              onValueChange={handleStudyChange}
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
          </div>

          {selectedStudy ? (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Всего полей: {order.length} из {selectedStudy.parameters.length}
                </p>
                <Button variant="outline" size="sm" onClick={resetToDefault}>
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Сбросить
                </Button>
              </div>

              {order.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Активные поля</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {order.map((fieldId, index) => (
                      <div
                        key={fieldId}
                        className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg"
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveUp(index)}
                            disabled={index === 0}
                          >
                            <Icon name="ChevronUp" size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => moveDown(index)}
                            disabled={index === order.length - 1}
                          >
                            <Icon name="ChevronDown" size={14} />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono w-6">{index + 1}.</span>
                        </div>

                        <div className="flex-1">
                          <p className="font-medium">{getParameterName(fieldId)}</p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => hideField(fieldId)}
                          title="Скрыть из быстрого ввода"
                        >
                          <Icon name="EyeOff" size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hiddenFields.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <h3 className="font-semibold text-sm text-muted-foreground">Скрытые поля</h3>
                  <p className="text-xs text-muted-foreground">
                    Эти поля не будут отображаться в окне быстрого ввода, но останутся в протоколе
                  </p>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {hiddenFields.map((fieldId) => (
                      <div
                        key={fieldId}
                        className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg opacity-60"
                      >
                        <Icon name="EyeOff" size={16} className="text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{getParameterName(fieldId)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => showField(fieldId)}
                        >
                          <Icon name="Eye" size={16} className="mr-2" />
                          Показать
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Отмена
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="ArrowUp" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Выберите тип исследования для настройки</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
