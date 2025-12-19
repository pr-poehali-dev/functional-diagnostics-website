import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { Protocol, studyTypes } from '@/types/medical';
import { toast } from 'sonner';

type ProtocolEditModalProps = {
  protocol: Protocol | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (protocolId: string, updates: any) => Promise<boolean>;
};

const ProtocolEditModal = ({ protocol, isOpen, onClose, onSave }: ProtocolEditModalProps) => {
  const [formData, setFormData] = useState({
    patientName: '',
    gender: '',
    birthDate: '',
    weight: '',
    height: '',
    studyDate: '',
    ultrasoundDevice: '',
    conclusion: '',
    results: {} as Record<string, number | string>,
  });
  
  const parametersWithMinMax = ['hr', 'pq', 'qrs', 'qt'];
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (protocol) {
      setFormData({
        patientName: protocol.patientName,
        gender: protocol.patientData.gender,
        birthDate: protocol.patientData.birthDate,
        weight: protocol.patientData.weight || '',
        height: protocol.patientData.height || '',
        studyDate: protocol.patientData.studyDate,
        ultrasoundDevice: protocol.patientData.ultrasoundDevice || '',
        conclusion: protocol.conclusion,
        results: protocol.results,
      });
    }
  }, [protocol]);

  const handleSave = async () => {
    if (!protocol) return;

    if (!formData.patientName || !formData.gender || !formData.birthDate || !formData.studyDate) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setIsSaving(true);

    const calculateAge = (birthDate: string): number => {
      if (!birthDate) return 0;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const calculateBSA = (weight: number, height: number): number => {
      if (!weight || !height) return 0;
      return Math.sqrt((weight * height) / 3600);
    };

    const weight = parseFloat(formData.weight) || 0;
    const height = parseFloat(formData.height) || 0;

    const updates = {
      patientName: formData.patientName,
      patientData: {
        name: formData.patientName,
        gender: formData.gender,
        birthDate: formData.birthDate,
        age: calculateAge(formData.birthDate),
        weight: formData.weight,
        height: formData.height,
        bsa: calculateBSA(weight, height),
        studyDate: formData.studyDate,
        ultrasoundDevice: formData.ultrasoundDevice,
      },
      results: formData.results,
      conclusion: formData.conclusion,
    };

    const success = await onSave(protocol.id, updates);
    setIsSaving(false);

    if (success) {
      onClose();
    }
  };

  const handleResultChange = (paramId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData({
        ...formData,
        results: { ...formData.results, [paramId]: numValue },
      });
    } else if (value === '') {
      const newResults = { ...formData.results };
      delete newResults[paramId];
      setFormData({ ...formData, results: newResults });
    }
  };

  const handleMinMaxChange = (paramId: string, field: 'min' | 'max', value: string) => {
    const minKey = `${paramId}_min`;
    const maxKey = `${paramId}_max`;
    const manualKey = `${paramId}_manual`;
    
    const newResults = { ...formData.results };
    
    if (value === '') {
      delete newResults[field === 'min' ? minKey : maxKey];
    } else {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        newResults[field === 'min' ? minKey : maxKey] = numValue;
      }
    }
    
    if (newResults[manualKey] !== 'true') {
      const minVal = parseFloat(String(newResults[minKey] || ''));
      const maxVal = parseFloat(String(newResults[maxKey] || ''));
      
      if (!isNaN(minVal) && !isNaN(maxVal)) {
        newResults[paramId] = parseFloat(((minVal + maxVal) / 2).toFixed(1));
      } else if (!isNaN(minVal)) {
        newResults[paramId] = minVal;
      } else if (!isNaN(maxVal)) {
        newResults[paramId] = maxVal;
      } else {
        delete newResults[paramId];
      }
    }
    
    setFormData({ ...formData, results: newResults });
  };

  if (!protocol) return null;

  const study = studyTypes.find(s => s.name === protocol.studyType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="Edit" size={20} />
            Редактирование протокола
          </DialogTitle>
          <DialogDescription>
            {protocol.studyType} • Создан {protocol.date}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="User" size={18} />
              Данные пациента
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="patientName">ФИО пациента *</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="Иванов Иван Иванович"
                />
              </div>

              <div>
                <Label htmlFor="gender">Пол *</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Выберите пол" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Мужской</SelectItem>
                    <SelectItem value="female">Женский</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="birthDate">Дата рождения *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="studyDate">Дата исследования *</Label>
                <Input
                  id="studyDate"
                  type="date"
                  value={formData.studyDate}
                  onChange={(e) => setFormData({ ...formData, studyDate: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="weight">Масса (кг)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="70"
                />
              </div>

              <div>
                <Label htmlFor="height">Рост (см)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="170"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="ultrasoundDevice">УЗ аппарат</Label>
                <Input
                  id="ultrasoundDevice"
                  value={formData.ultrasoundDevice}
                  onChange={(e) => setFormData({ ...formData, ultrasoundDevice: e.target.value })}
                  placeholder="Название аппарата"
                />
              </div>
            </div>
          </div>

          {study && (
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Icon name="Activity" size={18} />
                Показатели
              </h3>

              <div className="space-y-4">
                {study.parameters.map((param) => {
                  const hasMinMax = parametersWithMinMax.includes(param.id);
                  const isManual = formData.results[`${param.id}_manual`] === 'true';
                  
                  if (hasMinMax) {
                    return (
                      <div key={param.id} className="space-y-2">
                        <Label className="font-medium">{param.name}</Label>
                        <div className="flex gap-2 items-center flex-wrap">
                          <div className="flex gap-2 items-center">
                            <Input
                              type="number"
                              placeholder="Мин"
                              value={formData.results[`${param.id}_min`] || ''}
                              onChange={(e) => handleMinMaxChange(param.id, 'min', e.target.value)}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">-</span>
                            <Input
                              type="number"
                              placeholder="Макс"
                              value={formData.results[`${param.id}_max`] || ''}
                              onChange={(e) => handleMinMaxChange(param.id, 'max', e.target.value)}
                              className="w-24"
                            />
                          </div>
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-medium text-muted-foreground">Среднее:</span>
                            <Input
                              type="number"
                              placeholder={isManual ? "Вручную" : "Авто"}
                              value={formData.results[param.id] || ''}
                              onChange={(e) => {
                                const newResults = { ...formData.results };
                                const numValue = parseFloat(e.target.value);
                                if (!isNaN(numValue)) {
                                  newResults[param.id] = numValue;
                                  newResults[`${param.id}_manual`] = 'true';
                                } else if (e.target.value === '') {
                                  delete newResults[param.id];
                                  delete newResults[`${param.id}_manual`];
                                }
                                setFormData({ ...formData, results: newResults });
                              }}
                              className={`w-24 ${
                                isManual ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300' : ''
                              }`}
                            />
                            <span className="text-sm text-muted-foreground min-w-[60px]">{param.unit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={param.id}>
                      <Label htmlFor={param.id}>
                        {param.name} ({param.unit})
                      </Label>
                      <Input
                        id={param.id}
                        type="number"
                        step="0.1"
                        value={formData.results[param.id] || ''}
                        onChange={(e) => handleResultChange(param.id, e.target.value)}
                        placeholder={`${param.normalRange.min}-${param.normalRange.max}`}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Норма: {param.normalRange.min}-{param.normalRange.max} {param.unit}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="conclusion">Заключение *</Label>
            <Textarea
              id="conclusion"
              value={formData.conclusion}
              onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
              placeholder="Заключение врача..."
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" size={16} className="mr-2" />
                Сохранить изменения
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProtocolEditModal;