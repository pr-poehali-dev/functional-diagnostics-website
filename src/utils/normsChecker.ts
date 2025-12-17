import { NormTable, NormTableRow, PatientCategory, AgeUnit } from '@/types/norms';
import { PatientData, PatientAge } from '@/types/medical';

export type NormCheckResult = {
  status: 'normal' | 'below' | 'above';
  normRange?: { min: number; max: number };
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

  let compareValue: number;

  switch (table.normType) {
    case 'age':
      if (!table.rows[0]?.rangeUnit) return null;
      compareValue = ageToValue(patientData.age, table.rows[0].rangeUnit);
      break;
    case 'weight':
      compareValue = parseFloat(patientData.weight);
      if (isNaN(compareValue)) return null;
      break;
    case 'height':
      compareValue = parseFloat(patientData.height);
      if (isNaN(compareValue)) return null;
      break;
    case 'bsa':
      compareValue = patientData.bsa || 0;
      if (compareValue === 0) return null;
      break;
    default:
      return null;
  }

  for (const row of table.rows) {
    const rangeFrom = parseFloat(row.rangeFrom);
    const rangeTo = parseFloat(row.rangeTo);
    
    if (isNaN(rangeFrom) || isNaN(rangeTo)) continue;
    
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
  if (!category || !patientData.age) {
    return { status: 'normal' };
  }

  const matchingTable = normTables.find(
    (table) =>
      table.studyType === studyTypeId &&
      table.parameter === parameterName &&
      table.category === category
  );

  if (!matchingTable) {
    return { status: 'normal' };
  }

  const matchedRow = findMatchingRow(matchingTable, patientData);
  
  if (!matchedRow) {
    return { status: 'normal' };
  }

  const minNorm = parseFloat(matchedRow.parameterFrom);
  const maxNorm = parseFloat(matchedRow.parameterTo);

  if (isNaN(minNorm) || isNaN(maxNorm)) {
    return { status: 'normal' };
  }

  let status: 'normal' | 'below' | 'above' = 'normal';
  let conclusion: string | undefined;

  if (parameterValue < minNorm) {
    status = 'below';
    conclusion = matchingTable.conclusionBelow || undefined;
  } else if (parameterValue > maxNorm) {
    status = 'above';
    conclusion = matchingTable.conclusionAbove || undefined;
  }

  return {
    status,
    normRange: { min: minNorm, max: maxNorm },
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
  checks: Record<string, NormCheckResult>
): string => {
  const conclusions: string[] = [];

  Object.entries(checks).forEach(([paramName, result]) => {
    if (result.status !== 'normal' && result.conclusion) {
      conclusions.push(result.conclusion);
    }
  });

  return conclusions.join('\n');
};
