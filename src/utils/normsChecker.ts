import { NormTable, NormTableRow, PatientCategory, AgeUnit } from '@/types/norms';
import { PatientData, PatientAge } from '@/types/medical';

export type NormCheckResult = {
  status: 'normal' | 'below' | 'above' | 'borderline_low' | 'borderline_high';
  normRange?: { min: number; max: number };
  borderlineRange?: { low?: number; high?: number };
  conclusion?: string;
  matchedRow?: NormTableRow;
};

const ageToValue = (age: PatientAge, unit: AgeUnit): number => {
  switch (unit) {
    case 'years':
      return age.years + age.months / 12 + age.days / 365.25;
    case 'months':
      return age.years * 12 + age.months + age.days / 30.44;
    case 'days':
      return age.years * 365.25 + age.months * 30.44 + age.days;
    default:
      return 0;
  }
};

const getPatientCategory = (gender: string, age: PatientAge): PatientCategory | null => {
  if (!gender) return null;
  
  const isChild = age.years < 18;
  
  if (gender === 'male') {
    return isChild ? 'child_male' : 'adult_male';
  } else if (gender === 'female') {
    return isChild ? 'child_female' : 'adult_female';
  }
  
  return null;
};

const findMatchingRow = (
  table: NormTable,
  patientData: PatientData
): NormTableRow | null => {
  if (!patientData.age) return null;

  for (const row of table.rows) {
    const rangeFrom = parseFloat(row.rangeFrom);
    const rangeTo = parseFloat(row.rangeTo);
    
    if (isNaN(rangeFrom) || isNaN(rangeTo)) continue;
    
    let compareValue: number;

    switch (table.normType) {
      case 'age':
        if (!row.rangeUnit) continue;
        compareValue = ageToValue(patientData.age, row.rangeUnit);
        break;
      case 'weight':
        compareValue = parseFloat(patientData.weight);
        if (isNaN(compareValue)) continue;
        break;
      case 'height':
        compareValue = parseFloat(patientData.height);
        if (isNaN(compareValue)) continue;
        break;
      case 'bsa':
        compareValue = patientData.bsa || 0;
        if (compareValue === 0) continue;
        break;
      default:
        continue;
    }
    
    if (compareValue >= rangeFrom && compareValue <= rangeTo) {
      return row;
    }
  }

  return null;
};

export const checkParameterNorms = (
  parameterName: string,
  parameterValue: number,
  patientData: PatientData,
  normTables: NormTable[],
  studyTypeId: string
): NormCheckResult => {
  if (isNaN(parameterValue)) {
    return { status: 'normal' };
  }

  const category = getPatientCategory(patientData.gender, patientData.age!);
  
  console.log('🔍 Проверка норм:', {
    parameterName,
    parameterValue,
    category,
    patientAge: patientData.age,
    studyTypeId,
    availableTables: normTables.length,
  });
  
  if (!category || !patientData.age) {
    console.log('⚠️ Нет категории или возраста пациента');
    return { status: 'normal' };
  }

  const candidateTables = normTables.filter(
    (table) =>
      table.studyType === studyTypeId &&
      table.parameter === parameterName &&
      table.category === category
  );

  if (candidateTables.length === 0) {
    console.log('⚠️ Таблица норм не найдена для:', { studyTypeId, parameterName, category });
    return { status: 'normal' };
  }

  let matchedRow: NormTableRow | null = null;
  let matchingTable: NormTable | null = null;

  for (const table of candidateTables) {
    const row = findMatchingRow(table, patientData);
    if (row) {
      matchedRow = row;
      matchingTable = table;
      break;
    }
  }
  
  if (!matchedRow || !matchingTable) {
    console.log('⚠️ Подходящая строка норм не найдена');
    return { status: 'normal' };
  }

  const minNorm = parseFloat(matchedRow.parameterFrom);
  const maxNorm = parseFloat(matchedRow.parameterTo);

  if (isNaN(minNorm) || isNaN(maxNorm)) {
    return { status: 'normal' };
  }

  const borderlineLow = matchedRow.borderlineLow ? parseFloat(matchedRow.borderlineLow) : undefined;
  const borderlineHigh = matchedRow.borderlineHigh ? parseFloat(matchedRow.borderlineHigh) : undefined;

  let status: 'normal' | 'below' | 'above' | 'borderline_low' | 'borderline_high' = 'normal';
  let conclusion: string | undefined;

  if (parameterValue < minNorm) {
    if (borderlineLow !== undefined && parameterValue >= borderlineLow) {
      status = 'borderline_low';
      conclusion = matchingTable.conclusionBorderlineLow || matchingTable.conclusionBelow || undefined;
    } else {
      status = 'below';
      conclusion = matchingTable.conclusionBelow || undefined;
    }
  } else if (parameterValue > maxNorm) {
    if (borderlineHigh !== undefined && parameterValue <= borderlineHigh) {
      status = 'borderline_high';
      conclusion = matchingTable.conclusionBorderlineHigh || matchingTable.conclusionAbove || undefined;
    } else {
      status = 'above';
      conclusion = matchingTable.conclusionAbove || undefined;
    }
  }

  console.log('✅ Результат проверки:', {
    parameterValue,
    normRange: { min: minNorm, max: maxNorm },
    borderlineRange: { low: borderlineLow, high: borderlineHigh },
    status,
    conclusion,
  });

  return {
    status,
    normRange: { min: minNorm, max: maxNorm },
    borderlineRange: { low: borderlineLow, high: borderlineHigh },
    conclusion,
    matchedRow,
  };
};

export const getAllParameterChecks = (
  parameters: Record<string, number>,
  patientData: PatientData,
  normTables: NormTable[],
  studyTypeId: string
): Record<string, NormCheckResult> => {
  const results: Record<string, NormCheckResult> = {};

  Object.entries(parameters).forEach(([paramName, paramValue]) => {
    results[paramName] = checkParameterNorms(
      paramName,
      paramValue,
      patientData,
      normTables,
      studyTypeId
    );
  });

  return results;
};

export const generateConclusionFromNorms = (
  checks: Record<string, NormCheckResult>,
  parameters?: Record<string, number>,
  parameterNames?: Record<string, string>
): string => {
  const conclusions: string[] = [];
  const abnormalConclusions: string[] = [];
  let hasAnyChecks = false;
  let allNormal = true;

  Object.entries(checks).forEach(([paramName, result]) => {
    hasAnyChecks = true;
    if (result.status !== 'normal') {
      allNormal = false;
      if (result.conclusion) {
        abnormalConclusions.push(result.conclusion);
      }
    }
  });

  if (!hasAnyChecks) {
    return '';
  }

  if (allNormal && abnormalConclusions.length === 0) {
    return 'Все показатели в пределах возрастной нормы. Патологии не выявлено.';
  }

  if (parameters && parameterNames) {
    Object.entries(checks).forEach(([paramName, result]) => {
      const value = parameters[paramName];
      const name = parameterNames[paramName] || paramName;
      
      if (value !== undefined && !isNaN(value)) {
        const formattedValue = Number.isInteger(value) ? value.toString() : value.toFixed(1);
        const range = result.normRange;
        
        if (range) {
          const minStr = Number.isInteger(range.min) ? range.min.toString() : range.min.toFixed(1);
          const maxStr = Number.isInteger(range.max) ? range.max.toString() : range.max.toFixed(1);
          conclusions.push(`${name}: ${formattedValue} (норма ${minStr}-${maxStr})`);
        } else {
          conclusions.push(`${name}: ${formattedValue}`);
        }
      }
    });
  }

  if (abnormalConclusions.length > 0) {
    conclusions.push('');
    conclusions.push('Заключение:');
    conclusions.push(...abnormalConclusions);
  }

  return conclusions.length > 0 ? conclusions.join('\n') : '';
};