import { toast } from 'sonner';
import { Protocol, studyTypes } from '@/types/medical';
import { ClinicSettings } from '@/hooks/useClinicSettings';
import { NormTable } from '@/types/norms';
import { generateParametersHTML } from './protocol-exporter/generateParametersHTML';
import { generateProtocolHTML } from './protocol-exporter/generateProtocolHTML';

type Doctor = {
  id: number;
  email: string;
  full_name: string;
  specialization: string | null;
  signature_url: string | null;
  created_at: string | null;
};

type ProtocolExporterProps = {
  doctor: Doctor | null;
  getParameterStatus: (value: number, range: { min: number; max: number }) => 'success' | 'warning' | 'danger';
  normTables?: NormTable[];
  clinicSettings: ClinicSettings;
};

export const useProtocolExporter = ({ doctor, getParameterStatus, normTables = [], clinicSettings }: ProtocolExporterProps) => {
  const exportToPDF = (protocol: Protocol) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Разрешите всплывающие окна для экспорта PDF');
      return;
    }
    const study = studyTypes.find(s => s.name === protocol.studyType);
    
    const parametersHTML = generateParametersHTML({
      protocol,
      study,
      normTables,
      getParameterStatus,
    });

    const htmlContent = generateProtocolHTML({
      protocol,
      doctor,
      clinicSettings,
      parametersHTML,
      includePrintButton: false,
    });

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      }, 250);
    };

    toast.success('Откроется окно печати для сохранения в PDF');
  };

  const printProtocol = (protocol: Protocol) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Разрешите всплывающие окна для печати');
      return;
    }

    const study = studyTypes.find(s => s.name === protocol.studyType);
    
    const parametersHTML = generateParametersHTML({
      protocol,
      study,
      normTables,
      getParameterStatus,
    });

    const htmlContent = generateProtocolHTML({
      protocol,
      doctor,
      clinicSettings,
      parametersHTML,
      includePrintButton: true,
    });

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    toast.success('Протокол открыт для печати');
  };

  return { exportToPDF, printProtocol };
};