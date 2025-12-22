import { ECGPositionData, ECG_POSITION_LABELS, ECG_RHYTHMS, ECG_AXIS } from '@/types/medical';

export const generateECGConclusion = (positions: ECGPositionData[]): string => {
  const conclusions: string[] = [];

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

  return conclusions.join('\n\n');
};
