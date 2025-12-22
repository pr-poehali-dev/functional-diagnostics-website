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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { ECGPositionData, ECG_POSITION_LABELS } from '@/types/medical';

type ECGQuickInputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  positions: ECGPositionData[];
  onSave: (positions: ECGPositionData[]) => void;
};

const ECGQuickInputModal = ({
  isOpen,
  onClose,
  positions,
  onSave,
}: ECGQuickInputModalProps) => {
  const [localPositions, setLocalPositions] = useState<ECGPositionData[]>(positions);
  const [activeTab, setActiveTab] = useState('0');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const parameters = [
    { id: 'hr', name: 'ЧСС', unit: 'уд/мин', hasMinMax: true },
    { id: 'pq', name: 'PQ интервал', unit: 'мс', hasMinMax: true },
    { id: 'qrs', name: 'QRS комплекс', unit: 'мс', hasMinMax: true },
    { id: 'qt', name: 'QT интервал', unit: 'мс', hasMinMax: true },
  ];

  useEffect(() => {
    setLocalPositions(positions);
    setActiveTab('0');
  }, [positions, isOpen]);

  useEffect(() => {
    if (isOpen && parameters.length > 0) {
      const firstFieldId = `0-${parameters[0].id}-min`;
      setTimeout(() => {
        inputRefs.current[firstFieldId]?.focus();
      }, 100);
    }
  }, [isOpen, activeTab]);

  const handleValueChange = (positionIndex: number, paramId: string, value: string) => {
    const newPositions = [...localPositions];
    const numValue = parseFloat(value) || 0;
    newPositions[positionIndex].results[paramId] = numValue;
    
    // Автоматически рассчитываем среднее значение для параметров с _min и _max
    const baseParamId = paramId.replace(/_min$|_max$/, '');
    if (paramId.endsWith('_min') || paramId.endsWith('_max')) {
      const minValue = newPositions[positionIndex].results[`${baseParamId}_min`] || 0;
      const maxValue = newPositions[positionIndex].results[`${baseParamId}_max`] || 0;
      
      if (minValue > 0 && maxValue > 0) {
        const average = Math.round((minValue + maxValue) / 2);
        newPositions[positionIndex].results[baseParamId] = average;
      }
    }
    
    setLocalPositions(newPositions);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, positionIndex: number, paramId: string, field: 'min' | 'max') => {
    if (e.key === 'Enter' || e.key === 'Tab' || e.key === ' ') {
      e.preventDefault();
      
      const currentParamIndex = parameters.findIndex(p => p.id === paramId);
      
      // Определяем следующее поле
      let nextKey = '';
      
      if (field === 'min') {
        // Переход от мин к макс
        nextKey = `${positionIndex}-${paramId}-max`;
      } else if (field === 'max') {
        const nextParamIndex = currentParamIndex + 1;
        if (nextParamIndex < parameters.length) {
          // Переход к мин следующего параметра
          nextKey = `${positionIndex}-${parameters[nextParamIndex].id}-min`;
        } else if (positionIndex + 1 < localPositions.length) {
          // Переход к первой позиции
          const nextPositionIndex = positionIndex + 1;
          setActiveTab(nextPositionIndex.toString());
          setTimeout(() => {
            const nextKey = `${nextPositionIndex}-${parameters[0].id}-min`;
            inputRefs.current[nextKey]?.focus();
          }, 100);
          return;
        } else {
          // Последнее поле - сохраняем
          handleSave();
          return;
        }
      }
      
      if (nextKey) {
        inputRefs.current[nextKey]?.focus();
      }
    }
  };

  const handleSave = () => {
    onSave(localPositions);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Zap" size={20} />
            Быстрый ввод ЭКГ
          </DialogTitle>
          <DialogDescription>
            Используйте Enter, Tab или Пробел для перехода между полями
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${localPositions.length}, minmax(0, 1fr))` }}>
            {localPositions.map((position, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {ECG_POSITION_LABELS[position.position]}
              </TabsTrigger>
            ))}
          </TabsList>

          {localPositions.map((position, positionIndex) => (
            <TabsContent key={positionIndex} value={positionIndex.toString()} className="space-y-4 py-4">
              <div className="grid gap-4">
                {parameters.map((param) => (
                  <div key={param.id} className="space-y-1">
                    <Label className="font-medium">{param.name} ({param.unit})</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        ref={(el) => (inputRefs.current[`${positionIndex}-${param.id}-min`] = el)}
                        type="number"
                        step="0.1"
                        placeholder="Мин"
                        value={position.results[`${param.id}_min`] || ''}
                        onChange={(e) => handleValueChange(positionIndex, `${param.id}_min`, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, positionIndex, param.id, 'min')}
                        className="w-24 text-lg"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        ref={(el) => (inputRefs.current[`${positionIndex}-${param.id}-max`] = el)}
                        type="number"
                        step="0.1"
                        placeholder="Макс"
                        value={position.results[`${param.id}_max`] || ''}
                        onChange={(e) => handleValueChange(positionIndex, `${param.id}_max`, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, positionIndex, param.id, 'max')}
                        className="w-24 text-lg"
                      />
                      <span className="text-muted-foreground">=</span>
                      <Input
                        ref={(el) => (inputRefs.current[`${positionIndex}-${param.id}-value`] = el)}
                        type="number"
                        step="0.1"
                        placeholder="Среднее"
                        value={position.results[param.id] || ''}
                        disabled
                        className="flex-1 text-lg bg-secondary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
          <Icon name="Info" size={16} />
          <p>
            Нажмите <kbd className="px-2 py-1 bg-background rounded border">Enter</kbd>,{' '}
            <kbd className="px-2 py-1 bg-background rounded border">Tab</kbd> или{' '}
            <kbd className="px-2 py-1 bg-background rounded border">Пробел</kbd> для перехода к
            следующему полю
          </p>
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

export default ECGQuickInputModal;