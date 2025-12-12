import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import { StudyType, PatientData, Protocol, studyTypes } from '@/types/medical';
import PatientDataForm from '@/components/PatientDataForm';
import StudyParametersForm from '@/components/StudyParametersForm';
import ProtocolArchive from '@/components/ProtocolArchive';
import QuickInputModal from '@/components/QuickInputModal';
import DoctorSettings from '@/components/DoctorSettings';

const Index = () => {
  const { doctor, isLoading: authLoading, logout } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="Loader2" className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!doctor) {
    return <AuthForm />;
  }
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
    
    let yPos = 87;
    if (protocol.patientData.weight && protocol.patientData.height) {
      pdf.text(`Масса: ${protocol.patientData.weight} кг, Рост: ${protocol.patientData.height} см`, 20, yPos);
      yPos += 8;
      if (protocol.patientData.bsa) {
        pdf.text(`Площадь поверхности тела: ${protocol.patientData.bsa.toFixed(2)} м\u00B2`, 20, yPos);
        yPos += 8;
      }
    }
    if (protocol.patientData.ultrasoundDevice) {
      pdf.text(`УЗ аппарат: ${protocol.patientData.ultrasoundDevice}`, 20, yPos);
      yPos += 8;
    }
    
    pdf.setFont('helvetica', 'bold');
    let yPosition = yPos + 4;
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
    
    if (doctor?.signature_url) {
      try {
        pdf.addImage(doctor.signature_url, 'PNG', 20, yPosition, 50, 20);
        yPosition += 25;
      } catch (e) {
        pdf.text('_______________________', 20, yPosition);
        yPosition += 7;
      }
    } else {
      pdf.text('_______________________', 20, yPosition);
      yPosition += 7;
    }
    
    pdf.text('Подпись врача', 20, yPosition);
    pdf.setFontSize(9);
    pdf.text(`${doctor?.full_name} (${doctor?.specialization || 'Врач'})`, 20, yPosition + 5);
    
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
            ${protocol.patientData.ultrasoundDevice ? `
            <div class="info-row">
              <span class="info-label">УЗ аппарат:</span>
              <span>${protocol.patientData.ultrasoundDevice}</span>
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
              ${doctor?.signature_url ? `
                <img src="${doctor.signature_url}" alt="Подпись" style="max-height: 60px; margin-bottom: 10px;" />
              ` : '<div class="signature-line"></div>'}
              <p style="margin-top: 5px; font-size: 14px;">Подпись врача</p>
              <p style="margin-top: 2px; font-size: 12px; color: #6b7280;">${doctor?.full_name} (${doctor?.specialization || 'Врач'})</p>
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
              <Button variant="ghost" size="icon" onClick={logout} title="Выйти">
                <Icon name="LogOut" size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="settings" className="gap-2">
              <Icon name="Settings" size={18} />
              Настройки
            </TabsTrigger>
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
                <PatientDataForm
                  patientData={patientData}
                  onPatientDataChange={handlePatientDataChange}
                />

                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon name="Zap" size={20} />
                      Быстрый ввод
                    </CardTitle>
                    <CardDescription>
                      Введите данные в специальном окне с навигацией клавиатурой
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={openQuickInput} className="w-full" variant="outline">
                      <Icon name="Keyboard" size={18} className="mr-2" />
                      Открыть окно быстрого ввода
                    </Button>
                  </CardContent>
                </Card>

                <StudyParametersForm
                  selectedStudy={selectedStudy}
                  parameters={parameters}
                  onParameterChange={handleParameterChange}
                  getParameterStatus={getParameterStatus}
                />

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

          <TabsContent value="settings" className="space-y-6">
            <DoctorSettings />
          </TabsContent>

          <TabsContent value="archive" className="space-y-6">
            <ProtocolArchive
              protocols={protocols}
              onExportToPDF={exportToPDF}
              onPrintProtocol={printProtocol}
              getParameterStatus={getParameterStatus}
            />
          </TabsContent>
        </Tabs>
      </main>

      {selectedStudy && (
        <QuickInputModal
          isOpen={isQuickInputOpen}
          onClose={() => setIsQuickInputOpen(false)}
          parameters={selectedStudy.parameters}
          fieldOrder={fieldOrder}
          values={parameters}
          onSave={handleQuickInputSave}
        />
      )}
    </div>
  );
};

export default Index;