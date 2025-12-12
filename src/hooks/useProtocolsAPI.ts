import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Protocol } from '@/types/medical';
import func2url from '../../backend/func2url.json';

const API_URL = func2url.protocols;

type ProtocolFilters = {
  search_name?: string;
  search_study_type?: string;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'study_date' | 'patient_name' | 'study_type';
  sort_order?: 'asc' | 'desc';
};

export const useProtocolsAPI = (authToken: string | null) => {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProtocols = async (filters?: ProtocolFilters) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const url = `${API_URL}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки протоколов');
      }

      const data = await response.json();
      const mappedProtocols = data.protocols.map((p: any) => ({
        id: p.id.toString(),
        studyType: p.study_type,
        date: p.created_at ? new Date(p.created_at).toLocaleString('ru-RU') : '',
        patientName: p.patient_name,
        patientData: {
          name: p.patient_name,
          gender: p.patient_gender,
          birthDate: p.patient_birth_date,
          age: p.patient_age || 0,
          weight: p.patient_weight?.toString() || '',
          height: p.patient_height?.toString() || '',
          bsa: p.patient_bsa || 0,
          ultrasoundDevice: p.ultrasound_device || '',
          studyDate: p.study_date,
        },
        results: p.results,
        conclusion: p.conclusion,
      }));
      
      setProtocols(mappedProtocols);
    } catch (error) {
      toast.error('Не удалось загрузить протоколы');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProtocol = async (protocol: any) => {
    if (!authToken) {
      toast.error('Требуется авторизация');
      return null;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken,
        },
        body: JSON.stringify({
          study_type: protocol.studyType,
          patient_name: protocol.patientName,
          patient_gender: protocol.patientData.gender,
          patient_birth_date: protocol.patientData.birthDate,
          patient_age: protocol.patientData.age,
          patient_weight: parseFloat(protocol.patientData.weight) || null,
          patient_height: parseFloat(protocol.patientData.height) || null,
          patient_bsa: protocol.patientData.bsa || null,
          ultrasound_device: protocol.patientData.ultrasoundDevice || null,
          study_date: protocol.patientData.studyDate,
          results: protocol.results,
          conclusion: protocol.conclusion,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания протокола');
      }

      const data = await response.json();
      toast.success('Протокол сохранён');
      fetchProtocols();
      return data.id;
    } catch (error: any) {
      toast.error(error.message || 'Не удалось создать протокол');
      console.error(error);
      return null;
    }
  };

  const updateProtocol = async (protocolId: string, updates: any) => {
    if (!authToken) {
      toast.error('Требуется авторизация');
      return false;
    }

    try {
      const payload: any = { id: parseInt(protocolId) };

      if (updates.studyType) payload.study_type = updates.studyType;
      if (updates.patientName) payload.patient_name = updates.patientName;
      if (updates.patientData) {
        if (updates.patientData.gender) payload.patient_gender = updates.patientData.gender;
        if (updates.patientData.birthDate) payload.patient_birth_date = updates.patientData.birthDate;
        if (updates.patientData.age) payload.patient_age = updates.patientData.age;
        if (updates.patientData.weight) payload.patient_weight = parseFloat(updates.patientData.weight);
        if (updates.patientData.height) payload.patient_height = parseFloat(updates.patientData.height);
        if (updates.patientData.bsa) payload.patient_bsa = updates.patientData.bsa;
        if (updates.patientData.ultrasoundDevice) payload.ultrasound_device = updates.patientData.ultrasoundDevice;
        if (updates.patientData.studyDate) payload.study_date = updates.patientData.studyDate;
      }
      if (updates.results) payload.results = updates.results;
      if (updates.conclusion) payload.conclusion = updates.conclusion;

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': authToken,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка обновления протокола');
      }

      toast.success('Протокол обновлён');
      fetchProtocols();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Не удалось обновить протокол');
      console.error(error);
      return false;
    }
  };

  const deleteProtocol = async (protocolId: string) => {
    if (!authToken) {
      toast.error('Требуется авторизация');
      return false;
    }

    try {
      const response = await fetch(`${API_URL}?id=${protocolId}`, {
        method: 'DELETE',
        headers: {
          'X-Auth-Token': authToken,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка удаления протокола');
      }

      toast.success('Протокол удалён');
      fetchProtocols();
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Не удалось удалить протокол');
      console.error(error);
      return false;
    }
  };

  const importProtocols = async (importedProtocols: any[]) => {
    if (!authToken) {
      toast.error('Требуется авторизация');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const protocol of importedProtocols) {
      const created = await createProtocol(protocol);
      if (created) {
        successCount++;
      } else {
        failCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`Импортировано ${successCount} протоколов`);
    }
    if (failCount > 0) {
      toast.error(`Не удалось импортировать ${failCount} протоколов`);
    }

    fetchProtocols();
  };

  useEffect(() => {
    if (authToken) {
      fetchProtocols();
    }
  }, [authToken]);

  return {
    protocols,
    isLoading,
    fetchProtocols,
    createProtocol,
    updateProtocol,
    deleteProtocol,
    importProtocols,
  };
};