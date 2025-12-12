import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

type Doctor = {
  id: number;
  email: string;
  full_name: string;
  specialization: string | null;
  signature_url: string | null;
  created_at: string | null;
};

type AppHeaderProps = {
  doctor: Doctor;
  onLogout: () => void;
};

const AppHeader = ({ doctor, onLogout }: AppHeaderProps) => {
  return (
    <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Stethoscope" className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">МедДиагностика</h1>
              <p className="text-sm text-muted-foreground">Система функциональной диагностики</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium">{doctor.full_name}</p>
              <p className="text-xs text-muted-foreground">{doctor.specialization || 'Врач'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onLogout} title="Выйти">
              <Icon name="LogOut" size={20} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
