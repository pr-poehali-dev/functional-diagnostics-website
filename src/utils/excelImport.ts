import * as XLSX from 'xlsx';
import { studyTypes } from '@/types/medical';

export type ImportedProtocol = {
  patientName: string;
  gender: string;
  birthDate: string;
  weight?: string;
  height?: string;
  studyType: string;
  studyDate: string;
  ultrasoundDevice?: string;
  results: Record<string, number>;
  conclusion: string;
};

export const importProtocolsFromExcel = (file: File): Promise<ImportedProtocol[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          reject(new Error('Файл пуст или имеет неправильный формат'));
          return;
        }

        const headers = jsonData[0];
        const protocols: ImportedProtocol[] = [];

        const expectedHeaders = [
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
        ];

        const headersMatch = expectedHeaders.every((h, i) => headers[i] === h);
        if (!headersMatch) {
          reject(new Error('Неверный формат файла. Используйте шаблон экспорта.'));
          return;
        }

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const patientName = row[1];
          const gender = row[2] === 'Мужской' ? 'male' : 'female';
          const birthDate = row[3];
          const weight = row[5] ? String(row[5]) : undefined;
          const height = row[6] ? String(row[6]) : undefined;
          const studyType = row[8];
          const studyDate = row[9];
          const ultrasoundDevice = row[10] || undefined;
          const resultsString = row[11] || '';
          const conclusion = row[12] || '';

          if (!patientName || !birthDate || !studyType || !studyDate) {
            continue;
          }

          const results: Record<string, number> = {};
          const study = studyTypes.find(s => s.name === studyType);

          if (study && resultsString) {
            const resultPairs = resultsString.split(';').map((s: string) => s.trim());
            resultPairs.forEach((pair: string) => {
              const match = pair.match(/^(.+?):\s*([0-9.]+)\s*(.+)$/);
              if (match) {
                const paramName = match[1].trim();
                const value = parseFloat(match[2]);
                const param = study.parameters.find(p => p.name === paramName);
                if (param && !isNaN(value)) {
                  results[param.id] = value;
                }
              }
            });
          }

          protocols.push({
            patientName,
            gender,
            birthDate,
            weight,
            height,
            studyType,
            studyDate,
            ultrasoundDevice,
            results,
            conclusion,
          });
        }

        if (protocols.length === 0) {
          reject(new Error('Не найдено протоколов для импорта'));
          return;
        }

        resolve(protocols);
      } catch (error) {
        reject(new Error('Ошибка при чтении файла: ' + (error as Error).message));
      }
    };

    reader.onerror = () => {
      reject(new Error('Ошибка при чтении файла'));
    };

    reader.readAsBinaryString(file);
  });
};
