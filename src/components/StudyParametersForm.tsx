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
          const value = parseFloat(parameters[param.id]);
          
          const normCheck = patientData.age 
            ? checkParameterNorms(param.name, value, patientData, normTables, selectedStudy.id)
            : null;
          
          const hasCustomNorm = normCheck && normCheck.normRange;
          const status = !isNaN(value) 
            ? (hasCustomNorm 
                ? (normCheck.status === 'normal' ? 'success' : normCheck.status === 'below' ? 'warning' : 'danger')
                : getParameterStatus(value, param.normalRange))
            : null;

          const displayRange = hasCustomNorm 
            ? normCheck.normRange 
            : param.normalRange;

          return (
            <div key={param.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={param.id}>{param.name}</Label>
                <div className="flex items-center gap-2">
                  {hasCustomNorm && (
                    <Badge variant="outline" className="text-xs">
                      <Icon name="Table" size={12} className="mr-1" />
                      По таблице
                    </Badge>
                  )}
                  {status && (
                    <Badge
                      variant={status === 'success' ? 'default' : 'destructive'}
                      className={
                        status === 'success'
                          ? 'bg-green-500'
                          : status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }
                    >
                      {status === 'success' ? 'Норма' : status === 'warning' ? 'Снижено' : 'Повышено'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  id={param.id}
                  type="number"
                  placeholder={`${displayRange!.min} - ${displayRange!.max}`}
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
              </div>
              <p className="text-xs text-muted-foreground">
                Норма: {displayRange!.min.toFixed(1)} - {displayRange!.max.toFixed(1)} {param.unit}
                {hasCustomNorm && <span className="ml-2 text-blue-600">(из таблицы норм)</span>}
              </p>
              {normCheck?.conclusion && status !== 'success' && (
                <p className="text-xs p-2 rounded bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300">
                  {normCheck.conclusion}
                </p>
              )}
            </div>
          );
        })
      </CardContent>
    </Card>
  );
};

export default StudyParametersForm;