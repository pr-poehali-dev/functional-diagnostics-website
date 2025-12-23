import { ECGPositionData, ECG_POSITION_LABELS, ECG_RHYTHMS, ECG_AXIS, PatientData } from '@/types/medical';
import { NormTable } from '@/types/norms';
import { checkParameterNorms, getAllParameterChecks, generateConclusionFromNorms } from './normsChecker';

export const generateECGConclusion = (
  positions: ECGPositionData[], 
  patientData?: PatientData, 
  normTables?: NormTable[]
): string => {
  const conclusions: string[] = [];

  // Основная часть - позиции и ритм
  positions.forEach((position) => {
    const positionLabel = ECG_POSITION_LABELS[position.position];
    
    // Формируем ритм
    const rhythmText = position.rhythm === 'custom' && position.rhythmCustom
      ? position.rhythmCustom
      : ECG_RHYTHMS[position.rhythm];

    // Формируем ЭОС (только для положения "Лежа")
    let axisText = '';
    if (position.position === 'lying') {
      const axis = position.axis === 'custom' && position.axisCustom
        ? position.axisCustom
        : ECG_AXIS[position.axis];
      axisText = ` ЭОС: ${axis}.`;
    }

    // Начинаем заключение: Положение - ритм
    let conclusionText = `${positionLabel} - ритм ${rhythmText}.`;
    
    // Добавляем ЭОС если есть
    if (axisText) {
      conclusionText += axisText;
    }

    conclusions.push(conclusionText);
  });

  // Если есть данные пациента и нормативные таблицы, добавляем анализ параметров
  if (patientData && normTables && positions.length > 0) {
    const firstPosition = positions[0];
    const parameters: Record<string, number> = {};
    const parameterNames: Record<string, string> = {
      hr: 'ЧСС',
      pq: 'PQ интервал',
      qrs: 'QRS комплекс',
      qt: 'QT интервал',
    };
    
    // Собираем параметры для проверки (только средние значения)
    ['hr', 'pq', 'qrs', 'qt'].forEach(paramId => {
      if (firstPosition.results[paramId]) {
        parameters[paramId] = firstPosition.results[paramId];
      }
    });
    
    if (Object.keys(parameters).length > 0) {
      // Проверяем параметры по нормам
      const checks = getAllParameterChecks(parameters, patientData, normTables, 'ecg');
      
      // Собираем min-max данные для отображения в заключении
      const resultsMinMax: Record<string, { min?: number; max?: number }> = {};
      ['hr', 'pq', 'qrs', 'qt'].forEach(paramId => {
        const minVal = firstPosition.results[`${paramId}_min`];
        const maxVal = firstPosition.results[`${paramId}_max`];
        if (minVal || maxVal) {
          resultsMinMax[paramId] = {
            min: minVal,
            max: maxVal,
          };
        }
      });
      
      // Генерируем заключение на основе норм
      const normsConclusion = generateConclusionFromNorms(checks, parameters, parameterNames, resultsMinMax);
      if (normsConclusion) {
        conclusions.push('');
        conclusions.push(normsConclusion);
      }
    }
  }

  return conclusions.join('\n\n');
};