import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { Protocol, studyTypes } from '@/types/medical';
import { NormTable } from '@/types/norms';
import { checkParameterNorms } from '@/utils/normsChecker';
import { formatAge } from '@/utils/ageCalculator';
import ProtocolEditModal from './ProtocolEditModal';
import ProtocolImportModal from './ProtocolImportModal';
import { exportProtocolsToExcel, exportSingleProtocolToExcel } from '@/utils/excelExport';
import { ImportedProtocol } from '@/utils/excelImport';
import { toast } from 'sonner';

type ProtocolArchiveProps = {
  protocols: Protocol[];
  isLoading: boolean;
  onExportToPDF: (protocol: Protocol) => void;
  onPrintProtocol: (protocol: Protocol) => void;
  onEditProtocol: (protocolId: string, updates: any) => Promise<boolean>;
  onDeleteProtocol: (id: string) => void;
  onImportProtocols: (protocols: ImportedProtocol[]) => Promise<void>;
  onSearchChange: (filters: any) => void;
  getParameterStatus: (value: number, range: { min: number; max: number }) => 'success' | 'warning' | 'danger';
  normTables: NormTable[];
};

const ProtocolArchive = ({
  protocols,
  isLoading,
  onExportToPDF,
  onPrintProtocol,
  onEditProtocol,
  onDeleteProtocol,
  onImportProtocols,
  onSearchChange,
  getParameterStatus,
  normTables,
}: ProtocolArchiveProps) => {
  const [searchName, setSearchName] = useState('');
  const [searchStudyType, setSearchStudyType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [protocolToDelete, setProtocolToDelete] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [protocolToEdit, setProtocolToEdit] = useState<Protocol | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const handleSearch = () => {
    onSearchChange({
      search_name: searchName || undefined,
      search_study_type: searchStudyType || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      sort_by: sortBy,
      sort_order: sortOrder,
    });
  };

  const handleResetFilters = () => {
    setSearchName('');
    setSearchStudyType('');
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('desc');
    onSearchChange({});
  };

  const confirmDelete = (id: string) => {
    setProtocolToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (protocolToDelete) {
      onDeleteProtocol(protocolToDelete);
      setDeleteDialogOpen(false);
      setProtocolToDelete(null);
    }
  };

  const openEditModal = (protocol: Protocol) => {
    setProtocolToEdit(protocol);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setProtocolToEdit(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Archive" size={20} />
                Архив протоколов
              </CardTitle>
              <CardDescription>Всего протоколов: {protocols.length}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (protocols.length > 0) {
                    exportProtocolsToExcel(protocols);
                    toast.success('Протоколы экспортированы в Excel');
                  } else {
                    toast.error('Нет протоколов для экспорта');
                  }
                }}
                disabled={protocols.length === 0}
              >
                <Icon name="FileSpreadsheet" size={16} className="mr-2" />
                Экспорт в Excel
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportModalOpen(true)}
              >
                <Icon name="Upload" size={16} className="mr-2" />
                Импорт из Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="searchName">Поиск по ФИО</Label>
                <Input
                  id="searchName"
                  placeholder="Введите имя..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="searchStudyType">Тип исследования</Label>
                <Select value={searchStudyType || 'all'} onValueChange={(val) => setSearchStudyType(val === 'all' ? '' : val)}>
                  <SelectTrigger id="searchStudyType">
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    {studyTypes.map((type) => (
                      <SelectItem key={type.id} value={type.name}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dateFrom">Дата от</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Дата до</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sortBy">Сортировать по</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sortBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Дате создания</SelectItem>
                    <SelectItem value="study_date">Дате исследования</SelectItem>
                    <SelectItem value="patient_name">ФИО пациента</SelectItem>
                    <SelectItem value="study_type">Типу исследования</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sortOrder">Порядок</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger id="sortOrder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">По убыванию</SelectItem>
                    <SelectItem value="asc">По возрастанию</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex-1">
                <Icon name="Search" size={16} className="mr-2" />
                Применить фильтры
              </Button>
              <Button variant="outline" onClick={handleResetFilters}>
                <Icon name="X" size={16} className="mr-2" />
                Сбросить
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Icon name="Loader2" size={48} className="text-muted-foreground mx-auto mb-4 animate-spin" />
              <p className="text-muted-foreground">Загрузка протоколов...</p>
            </div>
          ) : protocols.length === 0 ? (
            <div className="text-center py-12">
              <Icon name="Inbox" size={48} className="text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Протоколы не найдены</p>
            </div>
          ) : (
            <div className="space-y-4">
              {protocols.map((protocol) => (
                <Card key={protocol.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{protocol.patientName}</CardTitle>
                          {protocol.signed && (
                            <div className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              <Icon name="FileCheck" size={12} />
                              <span>Подписан</span>
                            </div>
                          )}
                        </div>
                        <CardDescription className="space-y-1">
                          <div>{protocol.studyType} • {protocol.patientData.studyDate}</div>
                          <div className="text-xs">
                            {protocol.patientData.gender === 'male' ? 'М' : 'Ж'}
                            {protocol.patientData.age && <>, {formatAge(protocol.patientData.age)}</>}
                            {protocol.patientData.weight && protocol.patientData.height && (
                              <> • {protocol.patientData.weight}кг, {protocol.patientData.height}см</>
                            )}
                            {protocol.patientData.bsa && (
                              <> • BSA: {protocol.patientData.bsa.toFixed(2)}м²</>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant={protocol.signed ? "default" : "outline"} 
                          size="sm" 
                          onClick={async () => {
                            const newSignedStatus = !protocol.signed;
                            await onEditProtocol(protocol.id, { signed: newSignedStatus });
                            toast.success(newSignedStatus ? 'Протокол подписан' : 'Подпись удалена');
                          }}
                          title={protocol.signed ? 'Убрать подпись' : 'Подписать протокол'}
                        >
                          <Icon name={protocol.signed ? "FileCheck" : "PenTool"} size={16} className="mr-2" />
                          {protocol.signed ? 'Подписан' : 'Подписать'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditModal(protocol)}>
                          <Icon name="Edit" size={16} className="mr-2" />
                          Редактировать
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onPrintProtocol(protocol)}>
                          <Icon name="Printer" size={16} className="mr-2" />
                          Печать
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onExportToPDF(protocol)}>
                          <Icon name="Download" size={16} className="mr-2" />
                          PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => {
                          exportSingleProtocolToExcel(protocol);
                          toast.success('Протокол экспортирован в Excel');
                        }}>
                          <Icon name="FileSpreadsheet" size={16} className="mr-2" />
                          Excel
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => confirmDelete(protocol.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Icon name="Trash2" size={16} />
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
                      <div className="space-y-2">
                        {Object.entries(protocol.results)
                          .filter(([key]) => !key.endsWith('_min') && !key.endsWith('_max') && !key.endsWith('_manual'))
                          .map(([key, value]) => {
                          const study = studyTypes.find(s => s.name === protocol.studyType);
                          const param = study?.parameters.find(p => p.id === key);
                          if (!param) return null;

                          const normCheck = protocol.patientData.age
                            ? checkParameterNorms(param.id, value, protocol.patientData, normTables, study.id)
                            : null;

                          const hasCustomNorm = normCheck && normCheck.normRange;
                          const displayRange = hasCustomNorm ? normCheck.normRange : param.normalRange;

                          let status: 'success' | 'warning' | 'danger';
                          if (hasCustomNorm) {
                            status = normCheck.status === 'normal' ? 'success' : normCheck.status === 'below' ? 'warning' : 'danger';
                          } else {
                            status = getParameterStatus(value, param.normalRange);
                          }

                          const statusText = status === 'success' ? 'Норма' : status === 'warning' ? 'Снижено' : 'Повышено';
                          
                          const minVal = protocol.results[`${key}_min`];
                          const maxVal = protocol.results[`${key}_max`];
                          const hasMinMax = minVal !== undefined || maxVal !== undefined;

                          return (
                            <div key={key} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                              <span className="text-muted-foreground flex-1">{param.name}:</span>
                              {hasMinMax ? (
                                <div className="flex items-center gap-1 w-48 justify-end">
                                  <span className="text-xs text-muted-foreground">
                                    {minVal !== undefined && maxVal !== undefined 
                                      ? `${minVal}-${maxVal}`
                                      : minVal !== undefined 
                                      ? `от ${minVal}`
                                      : `до ${maxVal}`}
                                  </span>
                                  <span className="font-medium">(ср. {value} {param.unit})</span>
                                </div>
                              ) : (
                                <span className="font-medium w-24 text-right">{value} {param.unit}</span>
                              )}
                              <span className="text-xs text-muted-foreground w-32 text-center">
                                {displayRange.min.toFixed(1)} - {displayRange.max.toFixed(1)}
                              </span>
                              <span
                                className={`text-xs font-medium w-20 text-center ${
                                  status === 'success'
                                    ? 'text-green-600'
                                    : status === 'warning'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {statusText}
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
                    {protocol.date && (
                      <>
                        <Separator />
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Icon name="Calendar" size={14} />
                          Дата создания протокола: {protocol.date}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить протокол?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Протокол будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ProtocolEditModal
        protocol={protocolToEdit}
        isOpen={editModalOpen}
        onClose={closeEditModal}
        onSave={onEditProtocol}
      />

      <ProtocolImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={onImportProtocols}
      />
    </>
  );
};

export default ProtocolArchive;