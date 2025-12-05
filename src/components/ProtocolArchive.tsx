import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { Protocol, studyTypes } from '@/types/medical';

type ProtocolArchiveProps = {
  protocols: Protocol[];
  onExportToPDF: (protocol: Protocol) => void;
  onPrintProtocol: (protocol: Protocol) => void;
  getParameterStatus: (value: number, range: { min: number; max: number }) => 'success' | 'warning' | 'danger';
};

const ProtocolArchive = ({
  protocols,
  onExportToPDF,
  onPrintProtocol,
  getParameterStatus,
}: ProtocolArchiveProps) => {
  return (
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
                      <Button variant="outline" size="sm" onClick={() => onPrintProtocol(protocol)}>
                        <Icon name="Printer" size={16} className="mr-2" />
                        Печать
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onExportToPDF(protocol)}>
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
  );
};

export default ProtocolArchive;
