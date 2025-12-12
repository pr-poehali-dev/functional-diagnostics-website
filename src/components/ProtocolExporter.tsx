import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Protocol, studyTypes } from '@/types/medical';

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
};

export const useProtocolExporter = ({ doctor, getParameterStatus }: ProtocolExporterProps) => {
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

  return { exportToPDF, printProtocol };
};
