import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Parameter } from '@/types/medical';

type QuickInputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  parameters: Parameter[];
  fieldOrder: string[];
  values: Record<string, string>;
  onSave: (values: Record<string, string>) => void;
};

const QuickInputModal = ({
  isOpen,
  onClose,
  parameters,
  fieldOrder,
  values,
  onSave,
}: QuickInputModalProps) => {
  const [localValues, setLocalValues] = useState<Record<string, string>>(values);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    setLocalValues(values);
  }, [values]);

  useEffect(() => {
    if (isOpen && fieldOrder.length > 0) {
      const firstFieldId = fieldOrder[0];
      setTimeout(() => {
        inputRefs.current[firstFieldId]?.focus();
      }, 100);
    }
  }, [isOpen, fieldOrder]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, currentIndex: number) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
      e.preventDefault();
      
      const nextIndex = currentIndex + 1;
      if (nextIndex < fieldOrder.length) {
        const nextFieldId = fieldOrder[nextIndex];
        inputRefs.current[nextFieldId]?.focus();
      } else {
        handleSave();
      }
    }
  };

  const handleSave = () => {
    onSave(localValues);
    onClose();
  };

  const orderedParameters = fieldOrder
    .map(id => parameters.find(p => p.id === id))
    .filter(Boolean) as Parameter[];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Zap" size={20} />
            Быстрый ввод данных
          </DialogTitle>
          <DialogDescription>
            Используйте Enter, Tab или Пробел для перехода между полями
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid gap-4">
            {orderedParameters.map((param, index) => (
              <div key={param.id} className="grid grid-cols-[200px_1fr_100px] gap-4 items-center">
                <Label htmlFor={`quick-${param.id}`} className="text-right font-medium">
                  {param.name}
                </Label>
                <Input
                  id={`quick-${param.id}`}
                  ref={(el) => (inputRefs.current[param.id] = el)}
                  type="number"
                  step="0.1"
                  placeholder={`${param.normalRange.min} - ${param.normalRange.max}`}
                  value={localValues[param.id] || ''}
                  onChange={(e) =>
                    setLocalValues({ ...localValues, [param.id]: e.target.value })
                  }
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="text-lg"
                />
                <span className="text-sm text-muted-foreground">{param.unit}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
            <Icon name="Info" size={16} />
            <p>
              Нажмите <kbd className="px-2 py-1 bg-background rounded border">Enter</kbd>,{' '}
              <kbd className="px-2 py-1 bg-background rounded border">Tab</kbd> или{' '}
              <kbd className="px-2 py-1 bg-background rounded border">Пробел</kbd> для перехода к
              следующему полю
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSave}>
            <Icon name="Check" size={18} className="mr-2" />
            Сохранить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickInputModal;
