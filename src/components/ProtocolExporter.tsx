import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { Protocol, studyTypes } from '@/types/medical';
import { getClinicSettings } from './ClinicSettings';

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

const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z',
    'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
    'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z',
    'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
    'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  return text.split('').map(char => map[char] || char).join('');
};

export const useProtocolExporter = ({ doctor, getParameterStatus }: ProtocolExporterProps) => {
  const exportToPDF = (protocol: Protocol) => {
    const pdf = new jsPDF();
    const clinicSettings = getClinicSettings();
    
    let yPosition = 20;
    
    if (clinicSettings.logoUrl) {
      try {
        pdf.addImage(clinicSettings.logoUrl, 'PNG', 20, yPosition, 30, 30);
      } catch (e) {
        console.error('Error adding logo:', e);
      }
    }
    
    if (clinicSettings.clinicName || clinicSettings.logoUrl) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text(transliterate(clinicSettings.clinicName || ''), clinicSettings.logoUrl ? 55 : 20, yPosition + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      if (clinicSettings.clinicAddress) {
        pdf.text(transliterate(clinicSettings.clinicAddress), clinicSettings.logoUrl ? 55 : 20, yPosition + 12);
      }
      if (clinicSettings.clinicPhone) {
        pdf.text(transliterate(clinicSettings.clinicPhone), clinicSettings.logoUrl ? 55 : 20, yPosition + 18);
      }
      
      yPosition += 40;
      pdf.line(20, yPosition - 5, 190, yPosition - 5);
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text('PROTOKOL ISSLEDOVANIYA', 105, yPosition, { align: 'center' });
    yPosition += 5;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    yPosition += 10;
    pdf.text(`Tip issledovaniya: ${transliterate(protocol.studyType)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Data issledovaniya: ${protocol.patientData.studyDate}`, 20, yPosition);
    
    yPosition += 12;
    pdf.setFont('helvetica', 'bold');
    pdf.text('DANNYE PACIENTA:', 20, yPosition);
    pdf.setFont('helvetica', 'normal');
    yPosition += 8;
    pdf.text(`FIO: ${transliterate(protocol.patientName)}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Pol: ${protocol.patientData.gender === 'male' ? 'Muzhskoj' : 'Zhenskij'}`, 20, yPosition);
    yPosition += 8;
    const ageText = protocol.patientData.age ? transliterate(` (vozrast: ${protocol.patientData.age})`) : '';
    pdf.text(`Data rozhdeniya: ${protocol.patientData.birthDate}${ageText}`, 20, yPosition);
    
    yPosition += 8;
    if (protocol.patientData.weight && protocol.patientData.height) {
      pdf.text(`Massa: ${protocol.patientData.weight} kg, Rost: ${protocol.patientData.height} sm`, 20, yPosition);
      yPosition += 8;
      if (protocol.patientData.bsa) {
        pdf.text(`Ploshchad' poverhnosti tela: ${protocol.patientData.bsa.toFixed(2)} m2`, 20, yPosition);
        yPosition += 8;
      }
    }
    if (protocol.patientData.ultrasoundDevice) {
      pdf.text(`UZ apparat: ${transliterate(protocol.patientData.ultrasoundDevice)}`, 20, yPosition);
      yPosition += 8;
    }
    
    pdf.setFont('helvetica', 'bold');
    yPosition += 4;
    pdf.text('POKAZATELI:', 20, yPosition);
    yPosition += 8;
    
    const study = studyTypes.find(s => s.name === protocol.studyType);
    
    if (study) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.rect(20, yPosition, 170, 8);
      pdf.text('Parametr', 22, yPosition + 5);
      pdf.text('Znachenie', 80, yPosition + 5);
      pdf.text('Norma', 120, yPosition + 5);
      pdf.text('Status', 155, yPosition + 5);
      yPosition += 8;
      
      pdf.setFont('helvetica', 'normal');
      Object.entries(protocol.results).forEach(([key, value]) => {
        const param = study.parameters.find(p => p.id === key);
        if (param) {
          const status = getParameterStatus(value, param.normalRange);
          const statusText = status === 'success' ? 'OK' : status === 'warning' ? '!' : '!!';
          const normalRange = `${param.normalRange.min}-${param.normalRange.max}`;
          
          pdf.rect(20, yPosition, 170, 7);
          pdf.text(transliterate(param.name), 22, yPosition + 5);
          pdf.text(`${value} ${transliterate(param.unit)}`, 80, yPosition + 5);
          pdf.text(normalRange, 120, yPosition + 5);
          pdf.text(statusText, 155, yPosition + 5);
          yPosition += 7;
        }
      });
      yPosition += 3;
    }
    
    yPosition += 5;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ZAKLYUCHENIE:', 20, yPosition);
    
    yPosition += 10;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const conclusionLines = pdf.splitTextToSize(transliterate(protocol.conclusion), 170);
    pdf.text(conclusionLines, 20, yPosition);
    
    yPosition += conclusionLines.length * 7 + 15;
    
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }
    
    pdf.setFontSize(10);
    
    const signatureY = yPosition;
    
    if (doctor?.signature_url) {
      try {
        pdf.addImage(doctor.signature_url, 'PNG', 20, signatureY, 50, 20);
        yPosition = signatureY + 25;
      } catch (e) {
        pdf.text('_______________________', 20, signatureY);
        yPosition = signatureY + 7;
      }
    } else {
      pdf.text('_______________________', 20, signatureY);
      yPosition = signatureY + 7;
    }
    
    pdf.text('Podpis vracha', 20, yPosition);
    pdf.setFontSize(9);
    pdf.text(`${transliterate(doctor?.full_name || '')} (${transliterate(doctor?.specialization || 'Vrach')})`, 20, yPosition + 5);
    
    const dateY = signatureY;
    pdf.setFontSize(10);
    pdf.text('_______________________', 130, dateY);
    pdf.text('Data', 130, dateY + 7);
    pdf.setFontSize(9);
    pdf.text(protocol.date || new Date().toLocaleDateString('ru-RU'), 130, dateY + 12);
    
    const fileName = `protocol_${transliterate(protocol.patientName)}_${transliterate(protocol.studyType)}_${protocol.patientData.studyDate}.pdf`
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    pdf.save(fileName);
    toast.success('PDF протокол успешно сохранён');
  };

  const printProtocol = (protocol: Protocol) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Разрешите всплывающие окна для печати');
      return;
    }

    const clinicSettings = getClinicSettings();
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
          <title>Протокол - ${protocol.patientName} - ${protocol.studyType} - ${protocol.patientData.studyDate}</title>
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
              border-bottom: 3px solid #0ea5e9;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              align-items: center;
              gap: 20px;
            }
            .header-logo {
              max-width: 80px;
              max-height: 80px;
              object-fit: contain;
            }
            .header-info {
              flex: 1;
            }
            .header h1 {
              margin: 0 0 5px 0;
              color: #0ea5e9;
              font-size: 24px;
            }
            .clinic-info {
              margin: 0;
              color: #6b7280;
              font-size: 14px;
              line-height: 1.6;
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
            ${clinicSettings.logoUrl ? `<img src="${clinicSettings.logoUrl}" alt="Логотип" class="header-logo" />` : ''}
            <div class="header-info">
              ${clinicSettings.clinicName ? `<h1>${clinicSettings.clinicName}</h1>` : '<h1>ПРОТОКОЛ ФУНКЦИОНАЛЬНОЙ ДИАГНОСТИКИ</h1>'}
              ${clinicSettings.clinicAddress || clinicSettings.clinicPhone ? `
                <p class="clinic-info">
                  ${clinicSettings.clinicAddress ? clinicSettings.clinicAddress + '<br>' : ''}
                  ${clinicSettings.clinicPhone ? 'Тел: ' + clinicSettings.clinicPhone : ''}
                </p>
              ` : ''}
            </div>
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
              <span>${protocol.patientData.birthDate}${protocol.patientData.age ? ` (возраст: ${protocol.patientData.age})` : ''}</span>
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
              <p style="margin-top: 2px; font-size: 12px; color: #6b7280;">${protocol.date || new Date().toLocaleDateString('ru-RU')}</p>
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