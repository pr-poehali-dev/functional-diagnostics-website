import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type SignProtocolDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSign: () => void;
  onSkip: () => void;
  doctorName?: string;
  hasSignature?: boolean;
};

export const SignProtocolDialog = ({
  isOpen,
  onClose,
  onSign,
  onSkip,
  doctorName,
  hasSignature,
}: SignProtocolDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="FileCheck" size={20} />
            Подписание протокола
          </DialogTitle>
          <DialogDescription>
            Протокол успешно создан. Хотите подписать его?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasSignature ? (
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="CheckCircle2" size={20} className="text-primary mt-1" />
                <div>
                  <p className="font-medium mb-1">Факсимиле найдено</p>
                  <p className="text-sm text-muted-foreground">
                    При подписании в протокол будет добавлено ваше факсимиле
                    {doctorName && ` (${doctorName})`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-secondary/50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Icon name="AlertCircle" size={20} className="text-muted-foreground mt-1" />
                <div>
                  <p className="font-medium mb-1">Факсимиле не настроено</p>
                  <p className="text-sm text-muted-foreground">
                    Вы можете добавить факсимиле в настройках профиля
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              <strong>Подписать протокол:</strong> В протокол будет добавлена ваша подпись{hasSignature ? ' (факсимиле)' : ' (строка для подписи)'}
            </p>
            <p>
              <strong>Пропустить:</strong> Протокол будет сохранён без подписи
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onSkip} className="flex-1">
            <Icon name="X" size={16} className="mr-2" />
            Пропустить
          </Button>
          <Button onClick={onSign} className="flex-1">
            <Icon name="PenTool" size={16} className="mr-2" />
            Подписать протокол
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
