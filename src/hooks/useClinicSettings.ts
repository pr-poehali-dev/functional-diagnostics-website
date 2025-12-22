import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const API_URL = 'https://functions.poehali.dev/10cc71ce-7a44-485c-a1ba-83e4856376e8';
const STORAGE_KEY = 'clinic_settings_migrated';

export type ClinicSettings = {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  logoUrl: string | null;
};

type ApiClinicSettings = {
  id: number;
  doctor_id: number;
  clinic_name: string;
  address: string;
  phone: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
};

function convertFromApi(apiSettings: ApiClinicSettings | null): ClinicSettings {
  if (!apiSettings) {
    return {
      clinicName: '',
      clinicAddress: '',
      clinicPhone: '',
      logoUrl: null,
    };
  }
  
  return {
    clinicName: apiSettings.clinic_name || '',
    clinicAddress: apiSettings.address || '',
    clinicPhone: apiSettings.phone || '',
    logoUrl: apiSettings.logo_url || null,
  };
}

export const useClinicSettings = () => {
  const { doctor } = useAuth();
  const [settings, setSettings] = useState<ClinicSettings>({
    clinicName: '',
    clinicAddress: '',
    clinicPhone: '',
    logoUrl: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    if (!doctor) {
      setSettings({
        clinicName: '',
        clinicAddress: '',
        clinicPhone: '',
        logoUrl: null,
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}?type=clinic_settings&doctor_id=${doctor.id}`, {
        headers: {
          'X-Auth-Token': doctor.email,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load clinic settings');
      }

      const data = await response.json();
      const loadedSettings = convertFromApi(data.settings);
      
      if (!data.settings) {
        const migrated = localStorage.getItem(STORAGE_KEY);
        if (!migrated) {
          const localSettings = localStorage.getItem('clinic_settings');
          if (localSettings) {
            const parsed = JSON.parse(localSettings);
            await saveSettings(parsed);
            localStorage.setItem(STORAGE_KEY, 'true');
            localStorage.removeItem('clinic_settings');
            setSettings(parsed);
            return;
          }
        }
      }
      
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load clinic settings:', error);
      toast.error('Ошибка загрузки настроек клиники');
      setSettings({
        clinicName: '',
        clinicAddress: '',
        clinicPhone: '',
        logoUrl: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, [doctor]);

  const saveSettings = async (newSettings: ClinicSettings): Promise<boolean> => {
    if (!doctor) return false;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': doctor.email,
        },
        body: JSON.stringify({
          action: 'save_clinic_settings',
          doctor_id: doctor.id,
          settings: newSettings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save clinic settings');
      }

      setSettings(newSettings);
      return true;
    } catch (error) {
      console.error('Failed to save clinic settings:', error);
      toast.error('Ошибка сохранения настроек клиники');
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, isLoading, loadSettings, saveSettings, setSettings };
};
