import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Parameter } from '@/types/medical';
import { toast } from 'sonner';

type FieldOrderSettingsProps = {
  isOpen: boolean;
  onClose: () => void;
  parameters: Parameter[];
  currentOrder: string[];
  onSave: (order: string[]) => void;
};

export const FieldOrderSettings = ({
  isOpen,
  onClose,
  parameters,
  currentOrder,
  onSave,
}: FieldOrderSettingsProps) => {
  const [order, setOrder] = useState<string[]>(currentOrder);
  const [hiddenFields, setHiddenFields] = useState<string[]>([]);

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
    const defaultOrder = parameters.map(p => p.id);
    setOrder(defaultOrder);
    setHiddenFields([]);
    toast.success('Порядок полей сброшен к значениям по умолчанию');
  };

  const handleSave = () => {
    onSave(order);
    toast.success('Порядок полей сохранён');
    onClose();
  };

  const getParameterName = (id: string) => {
    return parameters.find(p => p.id === id)?.name || id;
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
            Настройте порядок полей для окна быстрого ввода. Вы можете перемещать поля вверх/вниз или скрыть их из быстрого ввода.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Всего полей: {order.length} из {parameters.length}
            </p>
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <Icon name="RotateCcw" size={16} className="mr-2" />
              Сбросить
            </Button>
          </div>

          {order.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Активные поля</h3>
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
          )}

          {hiddenFields.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-semibold text-sm text-muted-foreground">Скрытые поля</h3>
              <p className="text-xs text-muted-foreground">
                Эти поля не будут отображаться в окне быстрого ввода, но останутся в протоколе
              </p>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
