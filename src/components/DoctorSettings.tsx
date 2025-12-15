import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
const SETTINGS_API = 'https://functions.poehali.dev/10cc71ce-7a44-485c-a1ba-83e4856376e8';
const AUTH_API = 'https://functions.poehali.dev/cb9f0144-d0fa-40cf-ad86-40d1679b4f73';

type DoctorSettingsProps = {
  onOpenFieldOrderSettings: () => void;
};

const DoctorSettings = ({ onOpenFieldOrderSettings }: DoctorSettingsProps) => {
  const { doctor, token, updateDoctor } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: doctor?.full_name || '',
    email: doctor?.email || '',
    specialization: doctor?.specialization || '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  useEffect(() => {
    if (doctor) {
      setProfileData({
        full_name: doctor.full_name || '',
        email: doctor.email || '',
        specialization: doctor.specialization || '',
      });
    }
  }, [doctor]);

  const handleProfileUpdate = async () => {
    if (!profileData.full_name || !profileData.email) {
      toast.error('ФИО и Email обязательны для заполнения');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || '',
        },
        body: JSON.stringify({
          action: 'update_profile',
          doctor_id: doctor?.id,
          full_name: profileData.full_name,
          email: profileData.email,
          specialization: profileData.specialization,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка обновления профиля');
      }

      const data = await response.json();
      updateDoctor(data.doctor);
      toast.success('Профиль обновлён');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка обновления профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Пароль должен быть минимум 6 символов');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(AUTH_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || '',
        },
        body: JSON.stringify({
          action: 'change_password',
          doctor_id: doctor?.id,
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка смены пароля');
      }

      toast.success('Пароль успешно изменен');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка смены пароля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignatureUpload = async () => {
    if (!signatureFile) {
      toast.error('Выберите файл подписи');
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onerror = () => {
      toast.error('Ошибка чтения файла');
      setIsLoading(false);
    };
    
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        
        const response = await fetch(AUTH_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token || '',
          },
          body: JSON.stringify({
            action: 'update_signature',
            doctor_id: doctor?.id,
            signature_url: base64,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Ошибка сохранения подписи');
        }

        const data = await response.json();
        updateDoctor(data.doctor);
        toast.success('Подпись сохранена');
        setSignatureFile(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Ошибка загрузки подписи');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsDataURL(signatureFile);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="User" size={20} />
            Профиль врача
          </CardTitle>
          <CardDescription>Основная информация о враче</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">ФИО</Label>
            <Input
              id="full_name"
              value={profileData.full_name}
              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
              placeholder="Иванов Иван Иванович"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              placeholder="doctor@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Специализация</Label>
            <Input
              id="specialization"
              value={profileData.specialization}
              onChange={(e) => setProfileData({ ...profileData, specialization: e.target.value })}
              placeholder="Кардиолог"
            />
          </div>
          <Button onClick={handleProfileUpdate} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              <>
                <Icon name="Save" className="mr-2" size={18} />
                Сохранить изменения
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="password" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="password">Смена пароля</TabsTrigger>
          <TabsTrigger value="signature">Факсимиле</TabsTrigger>
        </TabsList>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Изменить пароль</CardTitle>
              <CardDescription>Обновите пароль для входа в систему</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="old-password">Старый пароль</Label>
                <Input
                  id="old-password"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, oldPassword: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Подтвердите новый пароль</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  minLength={6}
                />
              </div>
              <Button onClick={handlePasswordChange} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Обновление...
                  </>
                ) : (
                  <>
                    <Icon name="Key" className="mr-2" size={18} />
                    Изменить пароль
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="signature">
          <Card>
            <CardHeader>
              <CardTitle>Факсимиле подписи</CardTitle>
              <CardDescription>
                Загрузите изображение вашей подписи для вставки в протоколы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {doctor?.signature_url && (
                <div className="border rounded-lg p-4 bg-secondary/20">
                  <p className="text-sm font-medium mb-2">Текущая подпись:</p>
                  <img
                    src={doctor.signature_url}
                    alt="Подпись врача"
                    className="max-h-24 border rounded bg-white p-2"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="signature-file">Загрузить новую подпись</Label>
                <Input
                  id="signature-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Рекомендуем PNG с прозрачным фоном, размер до 2 МБ
                </p>
              </div>
              <Button
                onClick={handleSignatureUpload}
                disabled={!signatureFile || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader2" className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Icon name="Upload" className="mr-2" size={18} />
                    Загрузить подпись
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Info" size={20} />
            Дополнительные настройки
          </CardTitle>
          <CardDescription>Персонализация работы системы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
            <Icon name="ListOrdered" size={20} className="mt-1 text-primary" />
            <div className="flex-1">
              <h4 className="font-medium mb-1">Порядок полей быстрого ввода</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Настройте последовательность ввода полей для каждого типа исследования
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={onOpenFieldOrderSettings}
              >
                <Icon name="Settings" size={16} className="mr-2" />
                Настроить порядок
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
            <Icon name="Sliders" size={20} className="mt-1 text-primary" />
            <div>
              <h4 className="font-medium mb-1">Настройка норм исследований</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Вы можете установить персональные нормы для каждого показателя с учетом возраста,
                пола и BSA пациента
              </p>
              <Button variant="outline" size="sm">
                <Icon name="Settings" size={16} className="mr-2" />
                Настроить нормы
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg">
            <Icon name="FileText" size={20} className="mt-1 text-primary" />
            <div>
              <h4 className="font-medium mb-1">Шаблоны заключений</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Создайте автоматические заключения на основе условий по показателям
              </p>
              <Button variant="outline" size="sm">
                <Icon name="Edit" size={16} className="mr-2" />
                Редактировать шаблоны
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorSettings;