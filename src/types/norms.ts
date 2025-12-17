export type NormType = 'age' | 'weight' | 'height' | 'bsa';

export type NormTableRow = {
  id: string;
  rangeFrom: string;
  rangeTo: string;
  parameterFrom: string;
  parameterTo: string;
};

export type PatientCategory = 'adult_male' | 'adult_female' | 'child_male' | 'child_female';

export type NormTable = {
  id: string;
  studyType: string;
  category: PatientCategory;
  parameter: string;
  normType: NormType;
  rows: NormTableRow[];
  showInReport: boolean;
  conclusionBelow: string;
  conclusionAbove: string;
  createdAt: string;
  updatedAt: string;
};

export const PATIENT_CATEGORIES: Record<PatientCategory, string> = {
  adult_male: 'Взрослые (мужчины)',
  adult_female: 'Взрослые (женщины)',
  child_male: 'Дети (мальчики)',
  child_female: 'Дети (девочки)',
};

export const NORM_TYPES: Record<NormType, string> = {
  age: 'По возрасту (лет)',
  weight: 'По массе тела (кг)',
  height: 'По росту (см)',
  bsa: 'По площади поверхности тела (м²)',
};