import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { StudyType, PatientData, PatientAge, Protocol } from '@/types/medical';
import { useProtocolsAPI } from './useProtocolsAPI';
import { getAllParameterChecks, generateConclusionFromNorms } from '@/utils/normsChecker';
import { NormTable } from '@/types/norms';

export const useProtocolManager = (authToken: string | null, normTables: NormTable[] = []) => {
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
  const [conclusion, setConclusion] = useState<string>('');
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

  // Автоматически обновляем заключение при изменении параметров
  useEffect(() => {
    const hasData = Object.values(parameters).some(v => v !== '');
    if (hasData && selectedStudy) {
      const newConclusion = generateConclusion();
      if (newConclusion !== conclusion) {
        setConclusion(newConclusion);
      }
    }
  }, [parameters, patientData, selectedStudy, normTables]);

  const calculateAgeFromDate = (birthDate: string, referenceDate: string = new Date().toISOString()): PatientAge => {
    if (!birthDate) {
      return { years: 0, months: 0, days: 0 };
    }

    const birth = new Date(birthDate);
    const reference = new Date(referenceDate);
    
    console.log('📅 Расчёт возраста:', {
      birthDate,
      referenceDate,
      birthParsed: birth,
      referenceParsed: reference,
      birthYear: birth.getFullYear(),
      refYear: reference.getFullYear()
    });

    let years = reference.getFullYear() - birth.getFullYear();
    let months = reference.getMonth() - birth.getMonth();
    let days = reference.getDate() - birth.getDate();

    if (days < 0) {
      months--;
      const lastMonth = new Date(reference.getFullYear(), reference.getMonth(), 0);
      days += lastMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  };

  const calculateBSA = (weight: number, height: number): number => {
    if (!weight || !height) return 0;
    return Math.sqrt((weight * height) / 3600);
  };

  const handlePatientDataChange = (field: keyof PatientData, value: string) => {
    const newData = { ...patientData, [field]: value };
    
    if (field === 'birthDate' || field === 'studyDate') {
      if (newData.birthDate && newData.studyDate) {
        const birthDate = new Date(newData.birthDate);
        const studyDate = new Date(newData.studyDate);
        
        if (birthDate > studyDate) {
          toast.error('Дата рождения не может быть позже даты исследования');
          return;
        }
        
        newData.age = calculateAgeFromDate(newData.birthDate, newData.studyDate);
      } else if (newData.birthDate) {
        newData.age = calculateAgeFromDate(newData.birthDate);
      }
    }
    
    if (field === 'weight' || field === 'height') {
      const weight = field === 'weight' ? parseFloat(value) : parseFloat(patientData.weight);
      const height = field === 'height' ? parseFloat(value) : parseFloat(patientData.height);
      newData.bsa = calculateBSA(weight, height);
    }
    
    setPatientData(newData);
  };

  const handleParameterChange = (id: string, value: string) => {
    console.log('🔧 handleParameterChange:', { id, value });
    setParameters((prev) => {
      const newParams = { ...prev, [id]: value };
      console.log('🔧 newParams:', newParams);
      return newParams;
    });
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
    if (value < range.min) return 'warning';
    if (value > range.max) return 'danger';
    return 'success';
  };

  const generateConclusion = () => {
    if (!selectedStudy) return '';
    
    const numericParams: Record<string, number> = {};
    selectedStudy.parameters.forEach(param => {
      const value = parseFloat(parameters[param.id]);
      if (!isNaN(value)) {
        numericParams[param.id] = Math.round(value);
      }
    });

    if (patientData.age && normTables.length > 0) {
      const normChecks = getAllParameterChecks(
        numericParams,
        patientData,
        normTables,
        selectedStudy.id
      );

      const parameterNames: Record<string, string> = {};
      selectedStudy.parameters.forEach(param => {
        parameterNames[param.id] = param.name;
      });

      const normConclusion = generateConclusionFromNorms(normChecks, numericParams, parameterNames);
      if (normConclusion) {
        return normConclusion;
      }
    }
    
    const hasAnyData = Object.keys(numericParams).length > 0;
    if (!hasAnyData) {
      return '';
    }

    const abnormal = selectedStudy.parameters.filter(param => {
      const value = Math.round(parseFloat(parameters[param.id]));
      if (isNaN(value)) return false;
      return value < param.normalRange.min || value > param.normalRange.max;
    });

    if (abnormal.length === 0) {
      return `${selectedStudy.name}: Все показатели в пределах нормы. Патологии не выявлено.`;
    }

    const issues = abnormal.map(param => {
      const value = Math.round(parseFloat(parameters[param.id]));
      if (value < param.normalRange.min) {
        return `снижение ${param.name} до ${value} ${param.unit}`;
      }
      return `повышение ${param.name} до ${value} ${param.unit}`;
    }).join(', ');

    return `${selectedStudy.name}: Выявлены отклонения - ${issues}. Рекомендована консультация специалиста.`;
  };

  const handleGenerateProtocol = async (signed: boolean = false) => {
    if (!selectedStudy || !patientData.name || !patientData.gender || !patientData.birthDate || Object.keys(parameters).length === 0) {
      toast.error('Заполните все обязательные поля');
      return null;
    }

    const results: Record<string, number> = {};
    const resultsMinMax: Record<string, { min?: number; max?: number }> = {};
    const parametersWithMinMax = ['hr', 'pq', 'qrs', 'qt'];
    
    selectedStudy.parameters.forEach(param => {
      const value = parseFloat(parameters[param.id]);
      if (!isNaN(value)) {
        results[param.id] = Math.round(value);
        
        if (parametersWithMinMax.includes(param.id)) {
          const minVal = parseFloat(parameters[`${param.id}_min`]);
          const maxVal = parseFloat(parameters[`${param.id}_max`]);
          
          if (!isNaN(minVal) || !isNaN(maxVal)) {
            resultsMinMax[param.id] = {
              min: !isNaN(minVal) ? Math.round(minVal) : undefined,
              max: !isNaN(maxVal) ? Math.round(maxVal) : undefined,
            };
          }
        }
      }
    });

    console.log('💾 Создание протокола:', {
      results,
      resultsMinMax,
      parameters,
    });

    const protocol = {
      studyType: selectedStudy.name,
      patientName: patientData.name,
      patientData: { ...patientData },
      results,
      resultsMinMax: Object.keys(resultsMinMax).length > 0 ? resultsMinMax : undefined,
      conclusion: conclusion || generateConclusion(),
      signed,
    };

    const createdId = await createProtocol(protocol);
    if (createdId) {
      setActiveTab('archive');
      return createdId;
    }
    return null;
  };

  return {
    selectedStudy,
    setSelectedStudy,
    patientData,
    setPatientData,
    parameters,
    setParameters,
    conclusion,
    setConclusion,
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