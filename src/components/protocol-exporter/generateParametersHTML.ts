import { Protocol, studyTypes, StudyType } from '@/types/medical';
import { NormTable } from '@/types/norms';
import { checkParameterNorms } from '@/utils/normsChecker';

type GenerateParametersHTMLParams = {
  protocol: Protocol;
  study: StudyType | undefined;
  normTables: NormTable[];
  getParameterStatus: (value: number, range: { min: number; max: number }) => 'success' | 'warning' | 'danger';
};

export const generateParametersHTML = ({
  protocol,
  study,
  normTables,
  getParameterStatus,
}: GenerateParametersHTMLParams): string => {
  if (!study) return '';

  return Object.entries(protocol.results)
    .map(([key, value]) => {
      const param = study.parameters.find(p => p.id === key);
      if (!param) return '';

      const normCheck = protocol.patientData.age && normTables.length > 0
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

      const statusColor = status === 'success' ? '#10b981' : status === 'warning' ? '#eab308' : '#ef4444';
      const statusText = status === 'success' ? 'Норма' : status === 'warning' ? 'Снижено' : 'Повышено';

      const minMaxData = protocol.resultsMinMax?.[key];
      const hasMinMax = minMaxData && (minMaxData.min !== undefined || minMaxData.max !== undefined);
      
      let valueDisplay = `${value} ${param.unit}`;
      if (hasMinMax) {
        const minMaxText = minMaxData.min !== undefined && minMaxData.max !== undefined 
          ? `${minMaxData.min}-${minMaxData.max}`
          : minMaxData.min !== undefined 
          ? `${minMaxData.min}`
          : `${minMaxData.max}`;
        valueDisplay = `<span style="color: #6b7280; font-size: 12px;">${minMaxText} →</span> ${value} ${param.unit}`;
      }

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${param.name}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">${valueDisplay}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${displayRange.min} - ${displayRange.max} ${param.unit}${hasCustomNorm ? ' <span style="color: #0ea5e9; font-size: 11px;">(табл.)</span>' : ''}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; color: ${statusColor}; font-weight: 600;">${statusText}</td>
        </tr>
      `;
    })
    .join('');
};