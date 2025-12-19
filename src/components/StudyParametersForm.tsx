import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { StudyType, PatientData } from '@/types/medical';
import { NormTable } from '@/types/norms';
import { checkParameterNorms } from '@/utils/normsChecker';

type StudyParametersFormProps = {
  selectedStudy: StudyType;
  parameters: Record<string, string>;
  onParameterChange: (id: string, value: string) => void;
  getParameterStatus: (value: number, range: { min: number; max: number }) => 'success' | 'warning' | 'danger';
  patientData: PatientData;
  normTables: NormTable[];
};

const StudyParametersForm = ({
  selectedStudy,
  parameters,
  onParameterChange,
  getParameterStatus,
  patientData,
  normTables,
}: StudyParametersFormProps) => {
  const parametersWithMinMax = ['hr', 'pq', 'qrs', 'qt'];

  const handleMinMaxChange = (paramId: string, field: 'min' | 'max', value: string) => {
    console.log('📝 handleMinMaxChange:', { paramId, field, value });
    const minKey = `${paramId}_min`;
    const maxKey = `${paramId}_max`;
    const manualKey = `${paramId}_manual`;
    
    const newMin = field === 'min' ? value : (parameters[minKey] || '');
    const newMax = field === 'max' ? value : (parameters[maxKey] || '');
    
    onParameterChange(field === 'min' ? minKey : maxKey, value);
    
    // Не пересчитываем среднее, если оно было введено вручную
    if (parameters[manualKey] === 'true') {
      console.log('⚠️ Ручной режим, не пересчитываем');
      return;
    }
    
    const minVal = parseFloat(newMin);
    const maxVal = parseFloat(newMax);
    
    if (!isNaN(minVal) && !isNaN(maxVal)) {
      const avg = ((minVal + maxVal) / 2).toFixed(1);
      console.log('✅ Рассчитано среднее:', avg);
      onParameterChange(paramId, avg);
    } else if (!isNaN(minVal) && isNaN(maxVal)) {
      console.log('✅ Только min:', minVal);
      onParameterChange(paramId, minVal.toString());
    } else if (isNaN(minVal) && !isNaN(maxVal)) {
      console.log('✅ Только max:', maxVal);
      onParameterChange(paramId, maxVal.toString());
    } else {
      console.log('⚠️ Очистка значения');
      onParameterChange(paramId, '');
    }
  };

  const handleManualAvgChange = (paramId: string, value: string) => {
    const manualKey = `${paramId}_manual`;
    onParameterChange(paramId, value);
    onParameterChange(manualKey, 'true');
  };

  const resetToAutoCalculation = (paramId: string) => {
    const manualKey = `${paramId}_manual`;
    onParameterChange(manualKey, '');
    // Пересчитываем среднее
    handleMinMaxChange(paramId, 'min', parameters[`${paramId}_min`] || '');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name={selectedStudy.icon as any} size={20} />
          {selectedStudy.name} - Показатели
        </CardTitle>
        <CardDescription>{selectedStudy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedStudy.parameters.map((param) => {
          const hasMinMax = parametersWithMinMax.includes(param.id);
          const value = parseFloat(parameters[param.id]);
          
          const normCheck = patientData.age 
            ? checkParameterNorms(param.id, value, patientData, normTables, selectedStudy.id)
            : null;
          
          const hasCustomNorm = normCheck && normCheck.normRange;
          const status = !isNaN(value) 
            ? (hasCustomNorm 
                ? (normCheck.status === 'normal' 
                    ? 'success' 
                    : normCheck.status === 'borderline_low' || normCheck.status === 'borderline_high'
                    ? 'warning'
                    : normCheck.status === 'below' 
                    ? 'warning' 
                    : 'danger')
                : getParameterStatus(value, param.normalRange))
            : null;

          const displayRange = hasCustomNorm 
            ? normCheck.normRange 
            : param.normalRange;

          if (hasMinMax) {
            const isManual = parameters[`${param.id}_manual`] === 'true';
            
            return (
              <div key={param.id} className="space-y-2">
                <Label htmlFor={param.id}>{param.name}</Label>
                <div className="flex gap-2 items-center flex-wrap">
                  <div className="flex gap-2 items-center">
                    <Input
                      id={`${param.id}_min`}
                      type="number"
                      placeholder="Мин"
                      value={parameters[`${param.id}_min`] || ''}
                      onChange={(e) => handleMinMaxChange(param.id, 'min', e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">-</span>
                    <Input
                      id={`${param.id}_max`}
                      type="number"
                      placeholder="Макс"
                      value={parameters[`${param.id}_max`] || ''}
                      onChange={(e) => handleMinMaxChange(param.id, 'max', e.target.value)}
                      className="w-20"
                    />
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="text-sm font-medium text-muted-foreground">Среднее:</span>
                    <Input
                      id={param.id}
                      type="number"
                      placeholder={isManual ? "Вручную" : "Авто"}
                      value={parameters[param.id] || ''}
                      onChange={(e) => handleManualAvgChange(param.id, e.target.value)}
                      className={`w-24 ${
                        isManual ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-300' : ''
                      } ${
                        status === 'danger'
                          ? 'border-red-500'
                          : status === 'warning'
                          ? 'border-yellow-500'
                          : status === 'success'
                          ? 'border-green-500'
                          : ''
                      }`}
                    />
                    <span className="text-sm text-muted-foreground min-w-[60px]">{param.unit}</span>
                    {isManual && (
                      <button
                        type="button"
                        onClick={() => resetToAutoCalculation(param.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                        title="Вернуться к автоматическому расчёту"
                      >
                        Авто
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Мин норма"
                      value={displayRange?.min?.toFixed(1) || ''}
                      readOnly
                      className="w-24 bg-muted text-center text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Макс норма"
                      value={displayRange?.max?.toFixed(1) || ''}
                      readOnly
                      className="w-24 bg-muted text-center text-sm"
                    />
                    {status && (
                      <Badge
                        variant={status === 'success' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
                        className={
                          status === 'success'
                            ? 'bg-green-500'
                            : status === 'warning'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }
                      >
                        {status === 'success' 
                          ? 'Норма' 
                          : normCheck?.status === 'borderline_low' || normCheck?.status === 'borderline_high'
                            ? 'Пограничное'
                            : normCheck?.status === 'below'
                            ? 'Снижено'
                            : normCheck?.status === 'above'
                            ? 'Повышено'
                            : status === 'warning'
                            ? 'Снижено'
                            : 'Повышено'}
                      </Badge>
                    )}
                  </div>
                </div>
                {normCheck?.conclusion && status !== 'success' && (
                  <p className="text-xs p-2 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                    {normCheck.conclusion}
                  </p>
                )}
              </div>
            );
          }

          return (
            <div key={param.id} className="space-y-2">
              <Label htmlFor={param.id}>{param.name}</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id={param.id}
                  type="number"
                  placeholder="Значение"
                  value={parameters[param.id] || ''}
                  onChange={(e) => onParameterChange(param.id, e.target.value)}
                  className={
                    status === 'danger'
                      ? 'border-red-500'
                      : status === 'warning'
                      ? 'border-yellow-500'
                      : status === 'success'
                      ? 'border-green-500'
                      : ''
                  }
                />
                <span className="text-sm text-muted-foreground min-w-[60px]">{param.unit}</span>
                <Input
                  type="number"
                  placeholder="Мин"
                  value={displayRange?.min?.toFixed(1) || ''}
                  readOnly
                  className="w-20 bg-muted text-center text-sm"
                />
                <Input
                  type="number"
                  placeholder="Макс"
                  value={displayRange?.max?.toFixed(1) || ''}
                  readOnly
                  className="w-20 bg-muted text-center text-sm"
                />
                {status && (
                  <Badge
                    variant={status === 'success' ? 'default' : status === 'warning' ? 'secondary' : 'destructive'}
                    className={
                      status === 'success'
                        ? 'bg-green-500'
                        : status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }
                  >
                    {status === 'success' 
                      ? 'Норма' 
                      : normCheck?.status === 'borderline_low' || normCheck?.status === 'borderline_high'
                        ? 'Пограничное'
                        : normCheck?.status === 'below'
                        ? 'Снижено'
                        : normCheck?.status === 'above'
                        ? 'Повышено'
                        : status === 'warning'
                        ? 'Снижено'
                        : 'Повышено'}
                  </Badge>
                )}
              </div>
              {normCheck?.conclusion && status !== 'success' && (
                <p className="text-xs p-2 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                  {normCheck.conclusion}
                </p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StudyParametersForm;