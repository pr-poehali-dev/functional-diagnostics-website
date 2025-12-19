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
  const parametersWithMinMax = ['hr', 'pq', 'qrs', 'qt'];

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

  const handleMinMaxChange = (paramId: string, field: 'min' | 'max', value: string) => {
    const minKey = `${paramId}_min`;
    const maxKey = `${paramId}_max`;
    const manualKey = `${paramId}_manual`;
    
    setLocalValues((prev) => {
      const newValues = { ...prev, [field === 'min' ? minKey : maxKey]: value };
      
      if (prev[manualKey] === 'true') {
        return newValues;
      }
      
      const newMin = field === 'min' ? value : (prev[minKey] || '');
      const newMax = field === 'max' ? value : (prev[maxKey] || '');
      
      const minVal = parseFloat(newMin);
      const maxVal = parseFloat(newMax);
      
      if (!isNaN(minVal) && !isNaN(maxVal)) {
        newValues[paramId] = ((minVal + maxVal) / 2).toFixed(1);
      } else if (!isNaN(minVal) && isNaN(maxVal)) {
        newValues[paramId] = minVal.toString();
      } else if (isNaN(minVal) && !isNaN(maxVal)) {
        newValues[paramId] = maxVal.toString();
      } else {
        newValues[paramId] = '';
      }
      
      return newValues;
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, fieldId: string) => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
      e.preventDefault();
      
      const allKeys = Object.keys(inputRefs.current);
      const currentIndex = allKeys.indexOf(fieldId);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < allKeys.length) {
        const nextKey = allKeys[nextIndex];
        inputRefs.current[nextKey]?.focus();
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
            {orderedParameters.map((param) => {
              const hasMinMax = parametersWithMinMax.includes(param.id);
              
              if (hasMinMax) {
                return (
                  <div key={param.id} className="space-y-2">
                    <Label className="font-medium">{param.name}</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        ref={(el) => (inputRefs.current[`${param.id}_min`] = el)}
                        type="number"
                        placeholder="Мин"
                        value={localValues[`${param.id}_min`] || ''}
                        onChange={(e) => handleMinMaxChange(param.id, 'min', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `${param.id}_min`)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">-</span>
                      <Input
                        ref={(el) => (inputRefs.current[`${param.id}_max`] = el)}
                        type="number"
                        placeholder="Макс"
                        value={localValues[`${param.id}_max`] || ''}
                        onChange={(e) => handleMinMaxChange(param.id, 'max', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, `${param.id}_max`)}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground min-w-[60px]">{param.unit}</span>
                    </div>
                  </div>
                );
              }
              
              return (
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
                    onKeyDown={(e) => handleKeyDown(e, param.id)}
                    className="text-lg"
                  />
                  <span className="text-sm text-muted-foreground">{param.unit}</span>
                </div>
              );
            })}
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