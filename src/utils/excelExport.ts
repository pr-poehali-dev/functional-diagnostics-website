import * as XLSX from 'xlsx';
import { Protocol, studyTypes } from '@/types/medical';
import { formatAge } from './ageCalculator';

export const exportProtocolsToExcel = (protocols: Protocol[], filename: string = 'protocols.xlsx') => {
  const worksheetData: any[] = [];

  worksheetData.push([
    'ID',
    'ФИО пациента',
    'Пол',
    'Дата рождения',
    'Возраст',
    'Масса (кг)',
    'Рост (см)',
    'BSA (м²)',
    'Тип исследования',
    'Дата исследования',
    'УЗ аппарат',
    'Показатели',
    'Заключение',
    'Дата создания',
  ]);

  protocols.forEach((protocol) => {
    const resultsString = Object.entries(protocol.results)
      .map(([key, value]) => {
        const study = studyTypes.find(s => s.name === protocol.studyType);
        const param = study?.parameters.find(p => p.id === key);
        return param ? `${param.name}: ${value} ${param.unit}` : '';
      })
      .filter(Boolean)
      .join('; ');

    worksheetData.push([
      protocol.id,
      protocol.patientName,
      protocol.patientData.gender === 'male' ? 'Мужской' : 'Женский',
      protocol.patientData.birthDate,
      protocol.patientData.age ? formatAge(protocol.patientData.age) : '',
      protocol.patientData.weight || '',
      protocol.patientData.height || '',
      protocol.patientData.bsa?.toFixed(2) || '',
      protocol.studyType,
      protocol.patientData.studyDate,
      protocol.patientData.ultrasoundDevice || '',
      resultsString,
      protocol.conclusion,
      protocol.date,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const columnWidths = [
    { wch: 10 },
    { wch: 30 },
    { wch: 10 },
    { wch: 15 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 20 },
    { wch: 50 },
    { wch: 50 },
    { wch: 20 },
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Протоколы');

  XLSX.writeFile(workbook, filename);
};

export const exportSingleProtocolToExcel = (protocol: Protocol) => {
  const study = studyTypes.find(s => s.name === protocol.studyType);

  const worksheetData: any[] = [];

  worksheetData.push(['ПРОТОКОЛ ИССЛЕДОВАНИЯ']);
  worksheetData.push([]);
  worksheetData.push(['Тип исследования', protocol.studyType]);
  worksheetData.push(['Дата исследования', protocol.patientData.studyDate]);
  worksheetData.push([]);

  worksheetData.push(['ДАННЫЕ ПАЦИЕНТА']);
  worksheetData.push(['ФИО', protocol.patientName]);
  worksheetData.push(['Пол', protocol.patientData.gender === 'male' ? 'Мужской' : 'Женский']);
  worksheetData.push(['Дата рождения', protocol.patientData.birthDate]);
  if (protocol.patientData.age) {
    worksheetData.push(['Возраст', formatAge(protocol.patientData.age)]);
  }
  if (protocol.patientData.weight && protocol.patientData.height) {
    worksheetData.push(['Масса', `${protocol.patientData.weight} кг`]);
    worksheetData.push(['Рост', `${protocol.patientData.height} см`]);
    if (protocol.patientData.bsa) {
      worksheetData.push(['BSA', `${protocol.patientData.bsa.toFixed(2)} м²`]);
    }
  }
  if (protocol.patientData.ultrasoundDevice) {
    worksheetData.push(['УЗ аппарат', protocol.patientData.ultrasoundDevice]);
  }
  worksheetData.push([]);

  worksheetData.push(['ПОКАЗАТЕЛИ']);
  worksheetData.push(['Параметр', 'Значение', 'Ед. изм.', 'Норма']);

  if (study) {
    Object.entries(protocol.results).forEach(([key, value]) => {
      const param = study.parameters.find(p => p.id === key);
      if (param) {
        const normalRange = `${param.normalRange.min}-${param.normalRange.max}`;
        worksheetData.push([param.name, value, param.unit, normalRange]);
      }
    });
  }

  worksheetData.push([]);
  worksheetData.push(['ЗАКЛЮЧЕНИЕ']);
  worksheetData.push([protocol.conclusion]);

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const columnWidths = [
    { wch: 25 },
    { wch: 15 },
    { wch: 10 },
    { wch: 15 },
  ];
  worksheet['!cols'] = columnWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Протокол');

  const fileName = `protocol_${protocol.patientName}_${protocol.studyType}_${protocol.patientData.studyDate}.xlsx`
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Zа-яА-Я0-9._-]/g, '');
  XLSX.writeFile(workbook, fileName);
};