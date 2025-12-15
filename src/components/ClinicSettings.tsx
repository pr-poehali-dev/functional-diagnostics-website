import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

type ClinicSettings = {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  logoUrl: string | null;
};

const STORAGE_KEY = 'clinic_settings';

export const ClinicSettings = () => {
  const [settings, setSettings] = useState<ClinicSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      clinicName: '',
      clinicAddress: '',
      clinicPhone: '',
      logoUrl: null
    };
  });

  const [uploading, setUploading] = useState(false);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success('Настройки сохранены');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Пожалуйста, выберите изображение');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Размер файла не должен превышать 2 МБ');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const logoUrl = event.target?.result as string;
      setSettings(prev => ({ ...prev, logoUrl }));
      setUploading(false);
      toast.success('Логотип загружен');
    };

    reader.onerror = () => {
      toast.error('Ошибка загрузки файла');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSettings(prev => ({ ...prev, logoUrl: null }));
    toast.success('Логотип удален');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Building2" size={24} />
          Настройки клиники
        </CardTitle>
        <CardDescription>
          Укажите данные вашей клиники для отображения в протоколах
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName">Название клиники</Label>
            <Input
              id="clinicName"
              placeholder="Медицинский центр"
              value={settings.clinicName}
              onChange={(e) => setSettings(prev => ({ ...prev, clinicName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicAddress">Адрес</Label>
            <Input
              id="clinicAddress"
              placeholder="ул. Примерная, д. 1"
              value={settings.clinicAddress}
              onChange={(e) => setSettings(prev => ({ ...prev, clinicAddress: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clinicPhone">Телефон</Label>
            <Input
              id="clinicPhone"
              placeholder="+7 (900) 123-45-67"
              value={settings.clinicPhone}
              onChange={(e) => setSettings(prev => ({ ...prev, clinicPhone: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Логотип клиники</Label>
            <div className="flex items-start gap-4">
              {settings.logoUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <img 
                    src={settings.logoUrl} 
                    alt="Логотип" 
                    className="w-32 h-32 object-contain border rounded-lg p-2"
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleRemoveLogo}
                  >
                    <Icon name="Trash2" size={16} className="mr-2" />
                    Удалить
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg">
                  <Icon name="ImagePlus" size={32} className="text-muted-foreground" />
                </div>
              )}
              
              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                <p className="text-sm text-muted-foreground">
                  Рекомендуемый размер: 200x200 пикселей. Максимальный размер: 2 МБ
                </p>
              </div>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Icon name="Save" size={16} className="mr-2" />
          Сохранить настройки
        </Button>
      </CardContent>
    </Card>
  );
};

export const getClinicSettings = (): ClinicSettings => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : {
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    logoUrl: null
  };
};
