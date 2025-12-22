import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { useClinicSettings } from '@/hooks/useClinicSettings';

export const ClinicSettings = () => {
  const { settings, isLoading, saveSettings, setSettings, loadSettings } = useClinicSettings();
  const [uploading, setUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveSettings(settings);
    if (success) {
      toast.success('Настройки сохранены');
    }
    setIsSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    reader.onload = async (event) => {
      const logoUrl = event.target?.result as string;
      const newSettings = { ...settings, logoUrl };
      const success = await saveSettings(newSettings);
      setUploading(false);
      if (success) {
        toast.success('Логотип загружен и сохранён');
      }
    };

    reader.onerror = () => {
      toast.error('Ошибка загрузки файла');
      setUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    const newSettings = { ...settings, logoUrl: null };
    const success = await saveSettings(newSettings);
    if (success) {
      toast.success('Логотип удалён и изменения сохранены');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Building2" size={24} />
              Настройки клиники
            </CardTitle>
            <CardDescription>
              Укажите данные вашей клиники для отображения в протоколах
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await loadSettings();
              toast.success('Настройки обновлены с сервера');
            }}
            disabled={isLoading}
          >
            <Icon name="RefreshCw" size={16} className="mr-2" />
            Обновить
          </Button>
        </div>
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

        <Button onClick={handleSave} className="w-full" disabled={isSaving || isLoading}>
          <Icon name="Save" size={16} className="mr-2" />
          {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </CardContent>
    </Card>
  );
};

