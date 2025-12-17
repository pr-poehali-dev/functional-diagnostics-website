import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { StudyType, PatientData, Protocol, studyTypes } from '@/types/medical';
import { NormTable } from '@/types/norms';
import PatientDataForm from '@/components/PatientDataForm';
import StudyParametersForm from '@/components/StudyParametersForm';
import ProtocolArchive from '@/components/ProtocolArchive';
import DoctorSettings from '@/components/DoctorSettings';
import { ClinicSettings } from '@/components/ClinicSettings';
import { NormsManager } from '@/components/NormsManager';

type MainTabsProps = {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedStudy: StudyType | null;
  setSelectedStudy: (study: StudyType | null) => void;
  patientData: PatientData;
  handlePatientDataChange: (field: keyof PatientData, value: string) => void;
  parameters: Record<string, string>;
  setParameters: (params: Record<string, string>) => void;
  handleParameterChange: (id: string, value: string) => void;
  openQuickInput: () => void;
  getParameterStatus: (value: number, range: { min: number; max: number }) => 'success' | 'warning' | 'danger';
  generateConclusion: () => string;
  handleGenerateProtocol: () => void;
  protocols: Protocol[];
  protocolsLoading: boolean;
  fetchProtocols: (filters?: any) => void;
  updateProtocol: (protocolId: string, updates: any) => Promise<boolean>;
  deleteProtocol: (id: string) => void;
  importProtocols: (protocols: any[]) => Promise<void>;
  exportToPDF: (protocol: Protocol) => void;
  printProtocol: (protocol: Protocol) => void;
  onOpenFieldOrderSettings: () => void;
  normTables: NormTable[];
};

const MainTabs = ({
  activeTab,
  setActiveTab,
  selectedStudy,
  setSelectedStudy,
  patientData,
  handlePatientDataChange,
  parameters,
  setParameters,
  handleParameterChange,
  openQuickInput,
  getParameterStatus,
  generateConclusion,
  handleGenerateProtocol,
  protocols,
  protocolsLoading,
  fetchProtocols,
  updateProtocol,
  deleteProtocol,
  importProtocols,
  exportToPDF,
  printProtocol,
  onOpenFieldOrderSettings,
  normTables,
}: MainTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-8">
        <TabsTrigger value="settings" className="gap-2">
          <Icon name="Settings" size={18} />
          Настройки
        </TabsTrigger>
        <TabsTrigger value="home" className="gap-2">
          <Icon name="Home" size={18} />
          Главная
        </TabsTrigger>
        <TabsTrigger value="norms" className="gap-2">
          <Icon name="Table" size={18} />
          Нормы
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
              patientData={patientData}
              normTables={normTables}
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

      <TabsContent value="norms" className="space-y-6">
        <NormsManager />
      </TabsContent>

      <TabsContent value="settings" className="space-y-6">
        <DoctorSettings 
          onOpenFieldOrderSettings={onOpenFieldOrderSettings}
        />
        <ClinicSettings />
      </TabsContent>

      <TabsContent value="archive" className="space-y-6">
        <ProtocolArchive
          protocols={protocols}
          isLoading={protocolsLoading}
          onExportToPDF={exportToPDF}
          onPrintProtocol={printProtocol}
          onEditProtocol={updateProtocol}
          onDeleteProtocol={deleteProtocol}
          onImportProtocols={importProtocols}
          onSearchChange={fetchProtocols}
          getParameterStatus={getParameterStatus}
        />
      </TabsContent>
    </Tabs>
  );
};

export default MainTabs;