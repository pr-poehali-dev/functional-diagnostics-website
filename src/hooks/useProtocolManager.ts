import { useState } from 'react';
import { toast } from 'sonner';
import { StudyType, PatientData, Protocol } from '@/types/medical';
import { useProtocolsAPI } from './useProtocolsAPI';

export const useProtocolManager = (authToken: string | null) => {
  const [selectedStudy, setSelectedStudy] = useState<StudyType | null>(null);
  const [patientData, setPatientData] = useState<PatientData>({
    name: '',
    gender: '',
    birthDate: '',
    weight: '',
    height: '',
    ultrasoundDevice: '',
    studyDate: new Date().toISOString().split('T')[0],
  });
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('home');
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [fieldOrder, setFieldOrder] = useState<string[]>([]);

  const {
    protocols,
    isLoading: protocolsLoading,
    fetchProtocols,
    createProtocol,
    updateProtocol,
    deleteProtocol,
    importProtocols,
  } = useProtocolsAPI(authToken);

  const calculateAge = (birthDate: string): string => {
    if (!birthDate) return '';
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    
    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    const totalDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    
    if (totalDays < 31) {
      return `${totalDays} ${totalDays === 1 ? 'день' : totalDays < 5 ? 'дня' : 'дней'}`;
    }
    
    if (years < 1) {
      if (days === 0) {
        return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
      }
      return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'} ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
    }
    
    if (years < 10) {
      if (months === 0) {
        return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
      }
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} ${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
    }
    
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
  };

  const calculateBSA = (weight: number, height: number): number => {
    if (!weight || !height) return 0;
    return Math.sqrt((weight * height) / 3600);
  };

  const handlePatientDataChange = (field: keyof PatientData, value: string) => {
    const newData = { ...patientData, [field]: value };
    
    if (field === 'birthDate') {
      newData.age = calculateAge(value);
    }
    
    if (field === 'weight' || field === 'height') {
      const weight = field === 'weight' ? parseFloat(value) : parseFloat(patientData.weight);
      const height = field === 'height' ? parseFloat(value) : parseFloat(patientData.height);
      newData.bsa = calculateBSA(weight, height);
    }
    
    setPatientData(newData);
  };

  const handleParameterChange = (id: string, value: string) => {
    setParameters({ ...parameters, [id]: value });
  };

  const handleQuickInputSave = (values: Record<string, string>) => {
    setParameters({ ...parameters, ...values });
    toast.success('Данные сохранены');
  };

  const loadFieldOrder = (studyId: string): string[] => {
    const saved = localStorage.getItem(`field_order_${studyId}`);
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  };

  const saveFieldOrder = (studyId: string, order: string[]) => {
    localStorage.setItem(`field_order_${studyId}`, JSON.stringify(order));
  };

  const openQuickInput = () => {
    if (!selectedStudy) {
      toast.error('Выберите тип исследования');
      return;
    }
    const savedOrder = loadFieldOrder(selectedStudy.id);
    const order = savedOrder.length > 0 ? savedOrder : selectedStudy.parameters.map(p => p.id);
    setFieldOrder(order);
    setIsQuickInputOpen(true);
  };

  const getParameterStatus = (value: number, range: { min: number; max: number }) => {
    if (value < range.min || value > range.max) return 'danger';
    if (value < range.min * 1.1 || value > range.max * 0.9) return 'warning';
    return 'success';
  };

  const generateConclusion = () => {
    if (!selectedStudy) return '';
    
    const abnormal = selectedStudy.parameters.filter(param => {
      const value = parseFloat(parameters[param.id]);
      if (isNaN(value)) return false;
      return value < param.normalRange.min || value > param.normalRange.max;
    });

    if (abnormal.length === 0) {
      return `${selectedStudy.name}: Все показатели в пределах нормы. Патологии не выявлено.`;
    }

    const issues = abnormal.map(param => {
      const value = parseFloat(parameters[param.id]);
      if (value < param.normalRange.min) {
        return `снижение ${param.name} до ${value} ${param.unit}`;
      }
      return `повышение ${param.name} до ${value} ${param.unit}`;
    }).join(', ');

    return `${selectedStudy.name}: Выявлены отклонения - ${issues}. Рекомендована консультация специалиста.`;
  };

  const handleGenerateProtocol = async () => {
    if (!selectedStudy || !patientData.name || !patientData.gender || !patientData.birthDate || Object.keys(parameters).length === 0) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const results: Record<string, number> = {};
    selectedStudy.parameters.forEach(param => {
      const value = parseFloat(parameters[param.id]);
      if (!isNaN(value)) {
        results[param.id] = value;
      }
    });

    const protocol = {
      studyType: selectedStudy.name,
      patientName: patientData.name,
      patientData: { ...patientData },
      results,
      conclusion: generateConclusion(),
    };

    const createdId = await createProtocol(protocol);
    if (createdId) {
      setActiveTab('archive');
    }
  };

  return {
    selectedStudy,
    setSelectedStudy,
    patientData,
    setPatientData,
    parameters,
    setParameters,
    protocols,
    protocolsLoading,
    fetchProtocols,
    updateProtocol,
    deleteProtocol,
    importProtocols,
    activeTab,
    setActiveTab,
    isQuickInputOpen,
    setIsQuickInputOpen,
    fieldOrder,
    setFieldOrder,
    handlePatientDataChange,
    handleParameterChange,
    handleQuickInputSave,
    openQuickInput,
    getParameterStatus,
    generateConclusion,
    handleGenerateProtocol,
    saveFieldOrder,
    loadFieldOrder,
  };
};