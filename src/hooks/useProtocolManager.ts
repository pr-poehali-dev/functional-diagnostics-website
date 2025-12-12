import { useState } from 'react';
import { toast } from 'sonner';
import { StudyType, PatientData, Protocol } from '@/types/medical';

export const useProtocolManager = () => {
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
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [activeTab, setActiveTab] = useState('home');
  const [isQuickInputOpen, setIsQuickInputOpen] = useState(false);
  const [fieldOrder, setFieldOrder] = useState<string[]>([]);

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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

  const openQuickInput = () => {
    if (!selectedStudy) {
      toast.error('Выберите тип исследования');
      return;
    }
    const defaultOrder = selectedStudy.parameters.map(p => p.id);
    setFieldOrder(defaultOrder);
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

  const handleGenerateProtocol = () => {
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

    const protocol: Protocol = {
      id: Date.now().toString(),
      studyType: selectedStudy.name,
      date: new Date().toLocaleString('ru-RU'),
      patientName: patientData.name,
      patientData: { ...patientData },
      results,
      conclusion: generateConclusion(),
    };

    setProtocols([protocol, ...protocols]);
    toast.success('Протокол сформирован');
    setActiveTab('archive');
  };

  return {
    selectedStudy,
    setSelectedStudy,
    patientData,
    setPatientData,
    parameters,
    setParameters,
    protocols,
    setProtocols,
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
  };
};
