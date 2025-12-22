import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ECG_POSITION_TYPES, ECG_RHYTHMS, ECG_AXIS, ECG_POSITION_LABELS, ECGPositionType, ECGPositionData } from '@/types/medical';
import { useState } from 'react';

type ECGPositionFormProps = {
  positionType: ECGPositionType;
  onPositionTypeChange: (type: ECGPositionType) => void;
  positions: ECGPositionData[];
  onPositionsChange: (positions: ECGPositionData[]) => void;
  onParameterChange: (positionIndex: number, parameterId: string, value: string) => void;
};

const ECGPositionForm = ({
  positionType,
  onPositionTypeChange,
  positions,
  onPositionsChange,
  onParameterChange,
}: ECGPositionFormProps) => {
  const getPositionsForType = (type: ECGPositionType): ECGPositionData['position'][] => {
    switch (type) {
      case 'lying':
        return ['lying'];
      case 'lying_inhale':
        return ['lying', 'inhale'];
      case 'lying_standing':
        return ['lying', 'standing'];
      case 'lying_standing_exercise':
        return ['lying', 'standing', 'exercise'];
      default:
        return ['lying'];
    }
  };

  const handlePositionTypeChange = (type: ECGPositionType) => {
    onPositionTypeChange(type);
    const newPositions = getPositionsForType(type).map((pos) => ({
      position: pos,
      rhythm: 'sinus' as const,
      axis: 'normal' as const,
      results: {},
    }));
    onPositionsChange(newPositions);
  };

  const handleRhythmChange = (index: number, value: string) => {
    const newPositions = [...positions];
    if (value === 'custom') {
      newPositions[index].rhythm = 'custom';
      newPositions[index].rhythmCustom = '';
    } else {
      newPositions[index].rhythm = value as any;
      newPositions[index].rhythmCustom = undefined;
    }
    onPositionsChange(newPositions);
  };

  const handleRhythmCustomChange = (index: number, value: string) => {
    const newPositions = [...positions];
    newPositions[index].rhythmCustom = value;
    onPositionsChange(newPositions);
  };

  const handleAxisChange = (index: number, value: string) => {
    const newPositions = [...positions];
    if (value === 'custom') {
      newPositions[index].axis = 'custom';
      newPositions[index].axisCustom = '';
    } else {
      newPositions[index].axis = value as any;
      newPositions[index].axisCustom = undefined;
    }
    onPositionsChange(newPositions);
  };

  const handleAxisCustomChange = (index: number, value: string) => {
    const newPositions = [...positions];
    newPositions[index].axisCustom = value;
    onPositionsChange(newPositions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Activity" size={20} />
          ЭКГ - Положение пациента
        </CardTitle>
        <CardDescription>Выберите положение для записи ЭКГ</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Положение</Label>
          <Select value={positionType} onValueChange={handlePositionTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ECG_POSITION_TYPES).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {positions.map((position, index) => (
          <Card key={index} className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Icon name="User" size={18} />
                {ECG_POSITION_LABELS[position.position]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ритм</Label>
                  <Select
                    value={position.rhythm}
                    onValueChange={(value) => handleRhythmChange(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ECG_RHYTHMS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {position.rhythm === 'custom' && (
                    <Input
                      placeholder="Введите описание ритма"
                      value={position.rhythmCustom || ''}
                      onChange={(e) => handleRhythmCustomChange(index, e.target.value)}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>ЭОС (электрическая ось сердца)</Label>
                  <Select
                    value={position.axis}
                    onValueChange={(value) => handleAxisChange(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ECG_AXIS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {position.axis === 'custom' && (
                    <Input
                      placeholder="Введите описание ЭОС"
                      value={position.axisCustom || ''}
                      onChange={(e) => handleAxisCustomChange(index, e.target.value)}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {/* ЧСС */}
                <div className="space-y-2">
                  <Label>ЧСС (уд/мин)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Мин"
                        value={position.results['hr_min'] || ''}
                        onChange={(e) => onParameterChange(index, 'hr_min', e.target.value)}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="60-90"
                        value={position.results['hr'] || ''}
                        onChange={(e) => onParameterChange(index, 'hr', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Макс"
                        value={position.results['hr_max'] || ''}
                        onChange={(e) => onParameterChange(index, 'hr_max', e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* PQ */}
                <div className="space-y-2">
                  <Label>PQ интервал (мс)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Мин"
                        value={position.results['pq_min'] || ''}
                        onChange={(e) => onParameterChange(index, 'pq_min', e.target.value)}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="120-200"
                        value={position.results['pq'] || ''}
                        onChange={(e) => onParameterChange(index, 'pq', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Макс"
                        value={position.results['pq_max'] || ''}
                        onChange={(e) => onParameterChange(index, 'pq_max', e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* QRS */}
                <div className="space-y-2">
                  <Label>QRS комплекс (мс)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Мин"
                        value={position.results['qrs_min'] || ''}
                        onChange={(e) => onParameterChange(index, 'qrs_min', e.target.value)}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="60-100"
                        value={position.results['qrs'] || ''}
                        onChange={(e) => onParameterChange(index, 'qrs', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Макс"
                        value={position.results['qrs_max'] || ''}
                        onChange={(e) => onParameterChange(index, 'qrs_max', e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>

                {/* QT */}
                <div className="space-y-2">
                  <Label>QT интервал (мс)</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Мин"
                        value={position.results['qt_min'] || ''}
                        onChange={(e) => onParameterChange(index, 'qt_min', e.target.value)}
                        className="w-20"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="340-440"
                        value={position.results['qt'] || ''}
                        onChange={(e) => onParameterChange(index, 'qt', e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Макс"
                        value={position.results['qt_max'] || ''}
                        onChange={(e) => onParameterChange(index, 'qt_max', e.target.value)}
                        className="w-20"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default ECGPositionForm;