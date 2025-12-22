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

  console.log('📄 generateParametersHTML:', {
    results: protocol.results,
    resultsMinMax: protocol.resultsMinMax,
  });

  return Object.entries(protocol.results)
    .filter(([key]) => !key.endsWith('_min') && !key.endsWith('_max') && !key.endsWith('_manual'))
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
      const minVal = minMaxData?.min;
      const maxVal = minMaxData?.max;
      const hasMinMax = minVal !== undefined || maxVal !== undefined;
      
      const valueDisplay = `${Math.round(value)} ${param.unit}`;
      let minMaxDisplay = '';
      
      if (hasMinMax) {
        const minMaxText = minVal !== undefined && maxVal !== undefined 
          ? `${Math.round(minVal)}-${Math.round(maxVal)} ${param.unit}`
          : minVal !== undefined 
          ? `от ${Math.round(minVal)} ${param.unit}`
          : `до ${Math.round(maxVal)} ${param.unit}`;
        minMaxDisplay = `<span style="color: #374151; font-size: 14px;">${minMaxText}</span>`;
      }

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${param.name}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center;">${minMaxDisplay || '-'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: 600;">${valueDisplay}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${displayRange.min} - ${displayRange.max} ${param.unit}${hasCustomNorm ? ' <span style="color: #0ea5e9; font-size: 11px;">(табл.)</span>' : ''}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; color: ${statusColor}; font-weight: 600;">${statusText}</td>
        </tr>
      `;
    })
    .join('');
};