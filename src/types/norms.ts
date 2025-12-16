export type NormType = 'age' | 'weight' | 'height' | 'bsa';

export type NormRange = {
  min: number;
  max: number;
};

export type NormRow = {
  id: string;
  parameter: string;
  minValue: number;
  maxValue: number;
  rangeType?: NormType;
  rangeMin?: number;
  rangeMax?: number;
};

export type PatientCategory = 'adult_male' | 'adult_female' | 'child_male' | 'child_female';

export type NormTable = {
  id: string;
  name: string;
  studyType: string;
  category: PatientCategory;
  normType: NormType;
  rows: NormRow[];
  createdAt: string;
  updatedAt: string;
  source?: 'manual' | 'excel';
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
