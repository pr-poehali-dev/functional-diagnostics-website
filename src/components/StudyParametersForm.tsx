import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { StudyType } from '@/types/medical';

type StudyParametersFormProps = {
  selectedStudy: StudyType;
  parameters: Record<string, string>;
  onParameterChange: (id: string, value: string) => void;
  getParameterStatus: (value: number, range: { min: number; max: number }) => 'success' | 'warning' | 'danger';
};

const StudyParametersForm = ({
  selectedStudy,
  parameters,
  onParameterChange,
  getParameterStatus,
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
          const status = !isNaN(value) ? getParameterStatus(value, param.normalRange) : null;

          return (
            <div key={param.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={param.id}>{param.name}</Label>
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
                    {status === 'success' ? 'Норма' : status === 'warning' ? 'Погр.' : 'Откл.'}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <Input
                  id={param.id}
                  type="number"
                  placeholder={`${param.normalRange.min} - ${param.normalRange.max}`}
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
                Норма: {param.normalRange.min} - {param.normalRange.max} {param.unit}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StudyParametersForm;
