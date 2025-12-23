import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ECG_POSITION_TYPES, ECG_RHYTHMS, ECG_AXIS, ECG_POSITION_LABELS, ECGPositionType, ECGPositionData, studyTypes, PatientData } from '@/types/medical';
import { NormTable } from '@/types/norms';
import { checkParameterNorms } from '@/utils/normsChecker';
import { useState } from 'react';

type ECGPositionFormProps = {
  positionType: ECGPositionType;
  onPositionTypeChange: (type: ECGPositionType) => void;
  positions: ECGPositionData[];
  onPositionsChange: (positions: ECGPositionData[]) => void;
  onParameterChange: (positionIndex: number, parameterId: string, value: string) => void;
  patientData: PatientData;
  normTables: NormTable[];
};

const ECGPositionForm = ({
  positionType,
  onPositionTypeChange,
  positions,
  onPositionsChange,
  onParameterChange,
  patientData,
  normTables,
}: ECGPositionFormProps) => {
  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months, days };
  };

  const getParameterNorm = (paramId: string, value: number) => {
    if (!patientData.birthDate || !value) return null;
    
    const age = calculateAge(patientData.birthDate);
    if (!age) return null;
    
    const patientWithAge = { ...patientData, age };
    return checkParameterNorms(paramId, value, patientWithAge, normTables, 'ecg');
  };
  
  const getStatusBadge = (paramId: string, value: number) => {
    const normCheck = getParameterNorm(paramId, value);
    if (!normCheck || !normCheck.normRange) return null;
    
    const { min, max } = normCheck.normRange;
    const statusColors = {
      normal: 'default',
      borderline_low: 'secondary',
      borderline_high: 'secondary',
      below: 'destructive',
      above: 'destructive',
    };
    
    const statusTexts = {
      normal: '✓ Норма',
      borderline_low: '⚠ Ниже нормы',
      borderline_high: '⚠ Выше нормы',
      below: '✗ Ниже нормы',
      above: '✗ Выше нормы',
    };
    
    return {
      norm: `${Math.round(min)}-${Math.round(max)}`,
      status: statusTexts[normCheck.status],
      variant: statusColors[normCheck.status] as 'default' | 'secondary' | 'destructive',
    };
  };
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
                  <div className="flex items-center justify-between">
                    <Label>ЧСС (уд/мин)</Label>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge = position.results['hr'] ? getStatusBadge('hr', position.results['hr']) : null;
                        return badge ? (
                          <>
                            <Badge variant="outline" className="text-xs">
                              Норма: {badge.norm}
                            </Badge>
                            <Badge variant={badge.variant} className="text-xs">
                              {badge.status}
                            </Badge>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Мин"
                        value={position.results['hr_min'] || ''}
                        onChange={(e) => onParameterChange(index, 'hr_min', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Макс"
                        value={position.results['hr_max'] || ''}
                        onChange={(e) => onParameterChange(index, 'hr_max', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">=</span>
                      <Input
                        type="number"
                        placeholder="Среднее"
                        value={position.results['hr'] || ''}
                        disabled
                        className="flex-1 bg-secondary"
                      />
                    </div>
                  </div>
                </div>

                {/* PQ */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>PQ интервал (мс)</Label>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge = position.results['pq'] ? getStatusBadge('pq', position.results['pq']) : null;
                        return badge ? (
                          <>
                            <Badge variant="outline" className="text-xs">
                              Норма: {badge.norm}
                            </Badge>
                            <Badge variant={badge.variant} className="text-xs">
                              {badge.status}
                            </Badge>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Мин"
                        value={position.results['pq_min'] || ''}
                        onChange={(e) => onParameterChange(index, 'pq_min', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Макс"
                        value={position.results['pq_max'] || ''}
                        onChange={(e) => onParameterChange(index, 'pq_max', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">=</span>
                      <Input
                        type="number"
                        placeholder="Среднее"
                        value={position.results['pq'] || ''}
                        disabled
                        className="flex-1 bg-secondary"
                      />
                    </div>
                  </div>
                </div>

                {/* QRS */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>QRS комплекс (мс)</Label>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge = position.results['qrs'] ? getStatusBadge('qrs', position.results['qrs']) : null;
                        return badge ? (
                          <>
                            <Badge variant="outline" className="text-xs">
                              Норма: {badge.norm}
                            </Badge>
                            <Badge variant={badge.variant} className="text-xs">
                              {badge.status}
                            </Badge>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Мин"
                        value={position.results['qrs_min'] || ''}
                        onChange={(e) => onParameterChange(index, 'qrs_min', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Макс"
                        value={position.results['qrs_max'] || ''}
                        onChange={(e) => onParameterChange(index, 'qrs_max', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">=</span>
                      <Input
                        type="number"
                        placeholder="Среднее"
                        value={position.results['qrs'] || ''}
                        disabled
                        className="flex-1 bg-secondary"
                      />
                    </div>
                  </div>
                </div>

                {/* QT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>QT интервал (мс)</Label>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const badge = position.results['qt'] ? getStatusBadge('qt', position.results['qt']) : null;
                        return badge ? (
                          <>
                            <Badge variant="outline" className="text-xs">
                              Норма: {badge.norm}
                            </Badge>
                            <Badge variant={badge.variant} className="text-xs">
                              {badge.status}
                            </Badge>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex gap-2 items-center">
                      <Input
                        type="number"
                        placeholder="Мин"
                        value={position.results['qt_min'] || ''}
                        onChange={(e) => onParameterChange(index, 'qt_min', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">—</span>
                      <Input
                        type="number"
                        placeholder="Макс"
                        value={position.results['qt_max'] || ''}
                        onChange={(e) => onParameterChange(index, 'qt_max', e.target.value)}
                        className="w-24"
                      />
                      <span className="text-muted-foreground">=</span>
                      <Input
                        type="number"
                        placeholder="Среднее"
                        value={position.results['qt'] || ''}
                        disabled
                        className="flex-1 bg-secondary"
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