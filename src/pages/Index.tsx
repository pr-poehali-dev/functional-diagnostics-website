import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

type StudyType = {
  id: string;
  name: string;
  icon: string;
  description: string;
  parameters: Parameter[];
};

type Parameter = {
  id: string;
  name: string;
  unit: string;
  normalRange: { min: number; max: number };
};

type PatientData = {
  name: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  age?: number;
  weight: string;
  height: string;
  bsa?: number;
  studyDate: string;
};

type Protocol = {
  id: string;
  studyType: string;
  date: string;
  patientName: string;
  patientData: PatientData;
  results: Record<string, number>;
  conclusion: string;
};

const studyTypes: StudyType[] = [
  {
    id: 'ecg',
    name: 'ЭКГ',
    icon: 'Activity',
    description: 'Электрокардиография',
    parameters: [
      { id: 'hr', name: 'ЧСС', unit: 'уд/мин', normalRange: { min: 60, max: 90 } },
      { id: 'pq', name: 'PQ интервал', unit: 'мс', normalRange: { min: 120, max: 200 } },
      { id: 'qrs', name: 'QRS комплекс', unit: 'мс', normalRange: { min: 60, max: 100 } },
      { id: 'qt', name: 'QT интервал', unit: 'мс', normalRange: { min: 340, max: 440 } },
    ],
  },
  {
    id: 'echo',
    name: 'ЭхоКГ',
    icon: 'Heart',
    description: 'Эхокардиография',
    parameters: [
      { id: 'lvef', name: 'ФВ ЛЖ', unit: '%', normalRange: { min: 55, max: 70 } },
      { id: 'lv_edv', name: 'КДО ЛЖ', unit: 'мл', normalRange: { min: 65, max: 195 } },
      { id: 'lv_esv', name: 'КСО ЛЖ', unit: 'мл', normalRange: { min: 18, max: 70 } },
      { id: 'ivs', name: 'МЖП', unit: 'мм', normalRange: { min: 7, max: 11 } },
    ],
  },
  {
    id: 'spirometry',
    name: 'Спирометрия',
    icon: 'Wind',
    description: 'Исследование функции внешнего дыхания',
    parameters: [
      { id: 'fvc', name: 'ФЖЕЛ', unit: 'л', normalRange: { min: 3.5, max: 5.5 } },
      { id: 'fev1', name: 'ОФВ1', unit: 'л', normalRange: { min: 2.8, max: 4.5 } },
      { id: 'fev1_fvc', name: 'ОФВ1/ФЖЕЛ', unit: '%', normalRange: { min: 70, max: 85 } },
      { id: 'pef', name: 'ПСВ', unit: 'л/с', normalRange: { min: 5, max: 10 } },
    ],
  },
];

const Index = () => {
  const [selectedStudy, setSelectedStudy] = useState<StudyType | null>(null);
  const [patientData, setPatientData] = useState<PatientData>({
    name: '',
    gender: '',
    birthDate: '',
    weight: '',
    height: '',
    studyDate: new Date().toISOString().split('T')[0],
  });
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [activeTab, setActiveTab] = useState('home');

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

  const exportToPDF = (protocol: Protocol) => {
    const pdf = new jsPDF();
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('ПРОТОКОЛ ИССЛЕДОВАНИЯ', 105, 20, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.text(`Тип исследования: ${protocol.studyType}`, 20, 35);
    pdf.text(`Дата исследования: ${protocol.patientData.studyDate}`, 20, 43);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('ДАННЫЕ ПАЦИЕНТА:', 20, 55);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`ФИО: ${protocol.patientName}`, 20, 63);
    pdf.text(`Пол: ${protocol.patientData.gender === 'male' ? 'Мужской' : 'Женский'}`, 20, 71);
    pdf.text(`Дата рождения: ${protocol.patientData.birthDate} (возраст: ${protocol.patientData.age} лет)`, 20, 79);
    if (protocol.patientData.weight && protocol.patientData.height) {
      pdf.text(`Масса: ${protocol.patientData.weight} кг, Рост: ${protocol.patientData.height} см`, 20, 87);
      if (protocol.patientData.bsa) {
        pdf.text(`Площадь поверхности тела: ${protocol.patientData.bsa.toFixed(2)} м\u00B2`, 20, 95);
      }
    }
    
    pdf.setFont('helvetica', 'bold');
    let yPosition = protocol.patientData.weight && protocol.patientData.height ? 107 : 91;
    pdf.text('ПОКАЗАТЕЛИ:', 20, yPosition);
    
    const study = studyTypes.find(s => s.name === protocol.studyType);
    yPosition += 10;
    
    if (study) {
      pdf.setFont('helvetica', 'normal');
      Object.entries(protocol.results).forEach(([key, value]) => {
        const param = study.parameters.find(p => p.id === key);
        if (param) {
          const status = getParameterStatus(value, param.normalRange);
          const statusText = status === 'success' ? 'Норма' : status === 'warning' ? 'Погр.' : 'Откл.';
          const normalRange = `${param.normalRange.min}-${param.normalRange.max} ${param.unit}`;
          
          pdf.text(`${param.name}: ${value} ${param.unit} [${statusText}] (Норма: ${normalRange})`, 25, yPosition);
          yPosition += 8;
        }
      });
    }
    
    yPosition += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.text('ЗАКЛЮЧЕНИЕ:', 20, yPosition);
    
    yPosition += 10;
    pdf.setFont('helvetica', 'normal');
    const conclusionLines = pdf.splitTextToSize(protocol.conclusion, 170);
    pdf.text(conclusionLines, 20, yPosition);
    
    yPosition += conclusionLines.length * 7 + 15;
    pdf.setFontSize(10);
    pdf.text('_______________________', 20, yPosition);
    pdf.text('Подпись врача', 20, yPosition + 7);
    
    pdf.save(`protocol_${protocol.patientName}_${protocol.id}.pdf`);
    toast.success('PDF протокол успешно сохранён');
  };

  const printProtocol = (protocol: Protocol) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Разрешите всплывающие окна для печати');
      return;
    }

    const study = studyTypes.find(s => s.name === protocol.studyType);
    
    const parametersHTML = study ? Object.entries(protocol.results).map(([key, value]) => {
      const param = study.parameters.find(p => p.id === key);
      if (!param) return '';
      
      const status = getParameterStatus(value, param.normalRange);
      const statusColor = status === 'success' ? '#10b981' : status === 'warning' ? '#eab308' : '#ef4444';
      const statusText = status === 'success' ? 'Норма' : status === 'warning' ? 'Погр.' : 'Откл.';
      
      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${param.name}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">${value} ${param.unit}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${param.normalRange.min} - ${param.normalRange.max} ${param.unit}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; color: ${statusColor}; font-weight: 600;">${statusText}</td>
        </tr>
      `;
    }).join('') : '';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Протокол - ${protocol.patientName}</title>
          <style>
            @media print {
              body { margin: 0; padding: 20px; }
              .no-print { display: none; }
            }
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              color: #1f2937;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #0ea5e9;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #0ea5e9;
              font-size: 24px;
            }
            .info-section {
              margin-bottom: 30px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: 600;
              width: 180px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              background-color: #0ea5e9;
              color: white;
              padding: 10px;
              text-align: left;
              border: 1px solid #0ea5e9;
            }
            .conclusion {
              background-color: #f0f9ff;
              border-left: 4px solid #0ea5e9;
              padding: 15px;
              margin-bottom: 40px;
            }
            .conclusion h3 {
              margin-top: 0;
              color: #0ea5e9;
            }
            .signature {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              width: 200px;
              padding-top: 40px;
            }
            .print-button {
              background-color: #0ea5e9;
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 16px;
              border-radius: 6px;
              cursor: pointer;
              margin-bottom: 20px;
            }
            .print-button:hover {
              background-color: #0284c7;
            }
          </style>
        </head>
        <body>
          <button class="print-button no-print" onclick="window.print()">🖨️ Печать</button>
          
          <div class="header">
            <h1>ПРОТОКОЛ ФУНКЦИОНАЛЬНОЙ ДИАГНОСТИКИ</h1>
          </div>
          
          <div class="info-section">
            <h2 style="color: #0ea5e9; margin-top: 0;">Информация об исследовании</h2>
            <div class="info-row">
              <span class="info-label">Тип исследования:</span>
              <span>${protocol.studyType}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Дата исследования:</span>
              <span>${protocol.patientData.studyDate}</span>
            </div>
          </div>
          
          <div class="info-section">
            <h2 style="color: #0ea5e9; margin-top: 0;">Данные пациента</h2>
            <div class="info-row">
              <span class="info-label">ФИО:</span>
              <span>${protocol.patientName}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Пол:</span>
              <span>${protocol.patientData.gender === 'male' ? 'Мужской' : 'Женский'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Дата рождения:</span>
              <span>${protocol.patientData.birthDate} (возраст: ${protocol.patientData.age} лет)</span>
            </div>
            ${protocol.patientData.weight ? `
            <div class="info-row">
              <span class="info-label">Масса тела:</span>
              <span>${protocol.patientData.weight} кг</span>
            </div>` : ''}
            ${protocol.patientData.height ? `
            <div class="info-row">
              <span class="info-label">Рост:</span>
              <span>${protocol.patientData.height} см</span>
            </div>` : ''}
            ${protocol.patientData.bsa ? `
            <div class="info-row">
              <span class="info-label">Площадь поверхности тела:</span>
              <span>${protocol.patientData.bsa.toFixed(2)} м²</span>
            </div>` : ''}
          </div>
          
          <h2 style="color: #0ea5e9;">Результаты измерений</h2>
          <table>
            <thead>
              <tr>
                <th>Показатель</th>
                <th>Значение</th>
                <th>Норма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              ${parametersHTML}
            </tbody>
          </table>
          
          <div class="conclusion">
            <h3>Заключение</h3>
            <p>${protocol.conclusion}</p>
          </div>
          
          <div class="signature">
            <div>
              <div class="signature-line"></div>
              <p style="margin-top: 5px; font-size: 14px;">Подпись врача</p>
            </div>
            <div>
              <div class="signature-line"></div>
              <p style="margin-top: 5px; font-size: 14px;">Дата</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Открыто окно печати');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <Icon name="Stethoscope" className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">МедДиагностика</h1>
              <p className="text-sm text-muted-foreground">Система функциональной диагностики</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="home" className="gap-2">
              <Icon name="Home" size={18} />
              Главная
            </TabsTrigger>
            <TabsTrigger value="calculator" className="gap-2">
              <Icon name="Calculator" size={18} />
              Калькулятор
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-2">
              <Icon name="FolderOpen" size={18} />
              Архив
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-8">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Выберите тип исследования</h2>
              <p className="text-muted-foreground">Начните работу с выбора необходимой диагностики</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {studyTypes.map((study) => (
                <Card
                  key={study.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 group"
                  onClick={() => {
                    setSelectedStudy(study);
                    setParameters({});
                    setActiveTab('calculator');
                    toast.success(`Выбрано: ${study.name}`);
                  }}
                >
                  <CardHeader>
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon name={study.icon as any} className="text-primary" size={32} />
                    </div>
                    <CardTitle>{study.name}</CardTitle>
                    <CardDescription>{study.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="ListChecks" size={16} />
                      {study.parameters.length} показателей
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {protocols.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon name="Clock" size={20} />
                    Последние протоколы
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {protocols.slice(0, 3).map((protocol) => (
                    <div key={protocol.id} className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">{protocol.patientName}</p>
                        <p className="text-sm text-muted-foreground">{protocol.studyType} • {protocol.date}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => printProtocol(protocol)} title="Печать">
                          <Icon name="Printer" size={18} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => exportToPDF(protocol)} title="Скачать PDF">
                          <Icon name="Download" size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Выбор исследования</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedStudy?.id}
                  onValueChange={(value) => {
                    const study = studyTypes.find(s => s.id === value);
                    setSelectedStudy(study || null);
                    setParameters({});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип исследования" />
                  </SelectTrigger>
                  <SelectContent>
                    {studyTypes.map((study) => (
                      <SelectItem key={study.id} value={study.id}>
                        <div className="flex items-center gap-2">
                          <Icon name={study.icon as any} size={16} />
                          {study.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedStudy && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="User" size={20} />
                      Данные пациента
                    </CardTitle>
                    <CardDescription>Заполните все обязательные поля</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="patientName">ФИО пациента <span className="text-red-500">*</span></Label>
                        <Input
                          id="patientName"
                          placeholder="Иванов Иван Иванович"
                          value={patientData.name}
                          onChange={(e) => handlePatientDataChange('name', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="gender">Пол <span className="text-red-500">*</span></Label>
                        <Select
                          value={patientData.gender}
                          onValueChange={(value) => handlePatientDataChange('gender', value)}
                        >
                          <SelectTrigger id="gender">
                            <SelectValue placeholder="Выберите пол" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Мужской</SelectItem>
                            <SelectItem value="female">Женский</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Дата рождения <span className="text-red-500">*</span></Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={patientData.birthDate}
                          onChange={(e) => handlePatientDataChange('birthDate', e.target.value)}
                        />
                      </div>
                      
                      {patientData.birthDate && (
                        <div className="space-y-2">
                          <Label>Возраст</Label>
                          <Input
                            value={`${patientData.age} лет`}
                            disabled
                            className="bg-secondary"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="studyDate">Дата исследования</Label>
                        <Input
                          id="studyDate"
                          type="date"
                          value={patientData.studyDate}
                          onChange={(e) => handlePatientDataChange('studyDate', e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Масса тела (кг)</Label>
                        <Input
                          id="weight"
                          type="number"
                          step="0.1"
                          placeholder="70"
                          value={patientData.weight}
                          onChange={(e) => handlePatientDataChange('weight', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="height">Рост (см)</Label>
                        <Input
                          id="height"
                          type="number"
                          step="0.1"
                          placeholder="175"
                          value={patientData.height}
                          onChange={(e) => handlePatientDataChange('height', e.target.value)}
                        />
                      </div>
                      
                      {patientData.weight && patientData.height && patientData.bsa && (
                        <div className="space-y-2 md:col-span-2">
                          <Label>Площадь поверхности тела (м²)</Label>
                          <Input
                            value={`${patientData.bsa.toFixed(2)} м² (формула Дюбуа)`}
                            disabled
                            className="bg-secondary font-medium"
                          />
                          <p className="text-xs text-muted-foreground">
                            Рассчитано автоматически по формуле: √(масса × рост / 3600)
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name={selectedStudy.icon as any} size={20} />
                      {selectedStudy.name} - Показатели
                    </CardTitle>
                    <CardDescription>{selectedStudy.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedStudy.parameters.map((param) => {
                      const value = parseFloat(parameters[param.id]);
                      const status = !isNaN(value) ? getParameterStatus(value, param.normalRange) : null;

                      return (
                        <div key={param.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={param.id}>{param.name}</Label>
                            {status && (
                              <Badge
                                variant={status === 'success' ? 'default' : 'destructive'}
                                className={
                                  status === 'success'
                                    ? 'bg-green-500'
                                    : status === 'warning'
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }
                              >
                                {status === 'success' ? 'Норма' : status === 'warning' ? 'Погр.' : 'Откл.'}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2 items-center">
                            <Input
                              id={param.id}
                              type="number"
                              placeholder={`${param.normalRange.min} - ${param.normalRange.max}`}
                              value={parameters[param.id] || ''}
                              onChange={(e) => handleParameterChange(param.id, e.target.value)}
                              className={
                                status === 'danger'
                                  ? 'border-red-500'
                                  : status === 'warning'
                                  ? 'border-yellow-500'
                                  : status === 'success'
                                  ? 'border-green-500'
                                  : ''
                              }
                            />
                            <span className="text-sm text-muted-foreground min-w-[60px]">{param.unit}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Норма: {param.normalRange.min} - {param.normalRange.max} {param.unit}
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {Object.keys(parameters).length > 0 && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon name="FileText" size={20} />
                        Предварительное заключение
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{generateConclusion()}</p>
                    </CardContent>
                  </Card>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerateProtocol}
                  disabled={!patientData.name || !patientData.gender || !patientData.birthDate || Object.keys(parameters).length === 0}
                >
                  <Icon name="FileCheck" size={20} className="mr-2" />
                  Сформировать протокол
                </Button>
              </>
            )}

            {!selectedStudy && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Icon name="ArrowUp" size={48} className="text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Выберите тип исследования для начала работы</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="archive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon name="Archive" size={20} />
                  Архив протоколов
                </CardTitle>
                <CardDescription>Всего протоколов: {protocols.length}</CardDescription>
              </CardHeader>
              <CardContent>
                {protocols.length === 0 ? (
                  <div className="text-center py-12">
                    <Icon name="Inbox" size={48} className="text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Протоколы пока не созданы</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {protocols.map((protocol) => (
                      <Card key={protocol.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-lg">{protocol.patientName}</CardTitle>
                              <CardDescription className="space-y-1">
                                <div>{protocol.studyType} • {protocol.patientData.studyDate}</div>
                                <div className="text-xs">
                                  {protocol.patientData.gender === 'male' ? 'М' : 'Ж'}, {protocol.patientData.age} лет
                                  {protocol.patientData.weight && protocol.patientData.height && (
                                    <> • {protocol.patientData.weight}кг, {protocol.patientData.height}см</>
                                  )}
                                  {protocol.patientData.bsa && (
                                    <> • BSA: {protocol.patientData.bsa.toFixed(2)}м²</>
                                  )}
                                </div>
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => printProtocol(protocol)}>
                                <Icon name="Printer" size={16} className="mr-2" />
                                Печать
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => exportToPDF(protocol)}>
                                <Icon name="Download" size={16} className="mr-2" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Icon name="Activity" size={16} />
                              Показатели:
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {Object.entries(protocol.results).map(([key, value]) => {
                                const study = studyTypes.find(s => s.name === protocol.studyType);
                                const param = study?.parameters.find(p => p.id === key);
                                if (!param) return null;

                                const status = getParameterStatus(value, param.normalRange);

                                return (
                                  <div key={key} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{param.name}:</span>
                                    <span className="font-medium flex items-center gap-2">
                                      {value} {param.unit}
                                      <div
                                        className={`h-2 w-2 rounded-full ${
                                          status === 'success'
                                            ? 'bg-green-500'
                                            : status === 'warning'
                                            ? 'bg-yellow-500'
                                            : 'bg-red-500'
                                        }`}
                                      />
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <Separator />
                          <div>
                            <h4 className="font-medium mb-2">Заключение:</h4>
                            <p className="text-sm text-muted-foreground">{protocol.conclusion}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;