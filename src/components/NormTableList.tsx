import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { NormTable, PATIENT_CATEGORIES, NORM_TYPES } from '@/types/norms';
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
  return (
    <div className="space-y-4">
      {tables.map((table) => (
        <Card key={table.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Table" size={18} />
                  {table.name}
                </CardTitle>
                <CardDescription className="mt-1 space-y-1">
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
                        Вы действительно хотите удалить таблицу "{table.name}"? Это действие нельзя отменить.
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
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Параметры ({table.rows.length}):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {table.rows.slice(0, 6).map((row) => (
                  <div
                    key={row.id}
                    className="text-sm p-2 bg-secondary/30 rounded flex items-center justify-between"
                  >
                    <span className="font-medium">{row.parameter}</span>
                    <span className="text-muted-foreground text-xs">
                      {row.minValue} - {row.maxValue}
                    </span>
                  </div>
                ))}
                {table.rows.length > 6 && (
                  <div className="text-sm p-2 text-muted-foreground flex items-center justify-center">
                    +{table.rows.length - 6} ещё
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
