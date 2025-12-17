import { Protocol } from '@/types/medical';
import { getProtocolStyles } from './getProtocolStyles';

type Doctor = {
  id: number;
  email: string;
  full_name: string;
  specialization: string | null;
  signature_url: string | null;
  created_at: string | null;
};

type ClinicSettings = {
  clinicName: string;
  clinicAddress: string;
  clinicPhone: string;
  logoUrl: string;
};

type GenerateProtocolHTMLParams = {
  protocol: Protocol;
  doctor: Doctor | null;
  clinicSettings: ClinicSettings;
  parametersHTML: string;
  includePrintButton?: boolean;
};

export const generateProtocolHTML = ({
  protocol,
  doctor,
  clinicSettings,
  parametersHTML,
  includePrintButton = false,
}: GenerateProtocolHTMLParams): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Протокол - ${protocol.patientName} - ${protocol.studyType} - ${protocol.patientData.studyDate}</title>
        <style>
          ${getProtocolStyles({ includePrintButton })}
        </style>
      </head>
      <body>
        ${includePrintButton ? '<button class="print-button no-print" onclick="window.print()">🖨️ Печать</button>' : ''}
        
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
            ${protocol.signed && doctor?.signature_url ? `<img src="${doctor.signature_url}" alt="Подпись" class="signature-image" />` : '<div class="signature-line"></div>'}
            <div style="margin-top: 10px;">
              <strong>Подпись врача</strong><br>
              <span style="font-size: 14px;">${doctor?.full_name || ''} (${doctor?.specialization || 'Врач'})</span>
            </div>
          </div>
          <div>
            <div class="signature-line"></div>
            <div style="margin-top: 10px;">
              <strong>Дата</strong><br>
              <span style="font-size: 14px;">${protocol.patientData.studyDate}</span>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};
