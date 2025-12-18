import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { NormTable, PATIENT_CATEGORIES, NORM_TYPES, AGE_UNITS } from '@/types/norms';
import { studyTypes } from '@/types/medical';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

type NormTableListProps = {
  tables: NormTable[];
  onEdit: (table: NormTable) => void;
  onDelete: (tableId: string) => void;
};

export const NormTableList = ({ tables, onEdit, onDelete }: NormTableListProps) => {
  const getParameterName = (studyTypeId: string, parameterId: string): string => {
    const study = studyTypes.find(s => s.id === studyTypeId);
    const param = study?.parameters.find(p => p.id === parameterId);
    return param?.name || parameterId;
  };

  return (
    <div className="space-y-4">
      {tables.map((table) => {
        <Card key={table.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Table" size={18} />
                  {getParameterName(table.studyType, table.parameter)}
                  {table.showInReport && (
                    <Badge variant="secondary" className="ml-2">
                      <Icon name="Eye" size={12} className="mr-1" />
                      В бланке
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon name="Users" size={14} />
                    {PATIENT_CATEGORIES[table.category]}
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Ruler" size={14} />
                    {NORM_TYPES[table.normType]}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Icon name="Clock" size={12} />
                    Обновлено: {new Date(table.updatedAt).toLocaleDateString('ru-RU')}
                  </div>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(table)}
                  title="Редактировать"
                >
                  <Icon name="Edit" size={16} className="mr-2" />
                  Редактировать
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" title="Удалить">
                      <Icon name="Trash2" size={16} className="text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить таблицу норм?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы действительно хотите удалить таблицу "{table.parameter}"? Это действие нельзя отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(table.id)}>
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">
                  Таблица норм ({table.rows.length} строк):
                </p>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 font-medium">Диапазон</th>
                        <th className="text-left p-2 font-medium">Норма {table.parameter}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, 3).map((row) => (
                        <tr key={row.id} className="border-t">
                          <td className="p-2">
                            {row.rangeFrom} - {row.rangeTo}
                            {table.normType === 'age' && row.rangeUnit && (
                              <span className="text-muted-foreground ml-1">
                                {AGE_UNITS[row.rangeUnit]}
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-muted-foreground">
                            {row.parameterFrom} - {row.parameterTo}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {table.rows.length > 3 && (
                    <div className="text-center text-sm text-muted-foreground p-2 border-t bg-muted/30">
                      +{table.rows.length - 3} строк
                    </div>
                  )}
                </div>
              </div>

              {(table.conclusionBelow || table.conclusionAbove) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Шаблоны заключений:</p>
                  <div className="grid gap-2">
                    {table.conclusionBelow && (
                      <div className="text-sm p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="ArrowDown" size={14} className="text-blue-600 dark:text-blue-400" />
                          <span className="font-medium text-blue-600 dark:text-blue-400">Снижение:</span>
                        </div>
                        <p className="text-muted-foreground">{table.conclusionBelow}</p>
                      </div>
                    )}
                    {table.conclusionAbove && (
                      <div className="text-sm p-2 bg-orange-50 dark:bg-orange-950/20 rounded border border-orange-200 dark:border-orange-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon name="ArrowUp" size={14} className="text-orange-600 dark:text-orange-400" />
                          <span className="font-medium text-orange-600 dark:text-orange-400">Превышение:</span>
                        </div>
                        <p className="text-muted-foreground">{table.conclusionAbove}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};