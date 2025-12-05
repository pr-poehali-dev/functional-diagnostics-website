export type StudyType = {
  id: string;
  name: string;
  icon: string;
  description: string;
  parameters: Parameter[];
};

export type Parameter = {
  id: string;
  name: string;
  unit: string;
  normalRange: { min: number; max: number };
};

export type PatientData = {
  name: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  age?: number;
  weight: string;
  height: string;
  bsa?: number;
  studyDate: string;
};

export type Protocol = {
  id: string;
  studyType: string;
  date: string;
  patientName: string;
  patientData: PatientData;
  results: Record<string, number>;
  conclusion: string;
};

export const studyTypes: StudyType[] = [
  {
    id: 'ecg',
    name: 'ЭКГ',
    icon: 'Activity',
    description: 'Электрокардиография',
    parameters: [
      { id: 'hr', name: 'ЧСС', unit: 'уд/мин', normalRange: { min: 60, max: 90 } },
      { id: 'pq', name: 'PQ интервал', unit: 'мс', normalRange: { min: 120, max: 200 } },
      { id: 'qrs', name: 'QRS комплекс', unit: 'мс', normalRange: { min: 60, max: 100 } },
      { id: 'qt', name: 'QT интервал', unit: 'мс', normalRange: { min: 340, max: 440 } },
    ],
  },
  {
    id: 'echo',
    name: 'ЭхоКГ',
    icon: 'Heart',
    description: 'Эхокардиография',
    parameters: [
      { id: 'lvef', name: 'ФВ ЛЖ', unit: '%', normalRange: { min: 55, max: 70 } },
      { id: 'lv_edv', name: 'КДО ЛЖ', unit: 'мл', normalRange: { min: 65, max: 195 } },
      { id: 'lv_esv', name: 'КСО ЛЖ', unit: 'мл', normalRange: { min: 18, max: 70 } },
      { id: 'ivs', name: 'МЖП', unit: 'мм', normalRange: { min: 7, max: 11 } },
    ],
  },
  {
    id: 'spirometry',
    name: 'Спирометрия',
    icon: 'Wind',
    description: 'Исследование функции внешнего дыхания',
    parameters: [
      { id: 'fvc', name: 'ФЖЕЛ', unit: 'л', normalRange: { min: 3.5, max: 5.5 } },
      { id: 'fev1', name: 'ОФВ1', unit: 'л', normalRange: { min: 2.8, max: 4.5 } },
      { id: 'fev1_fvc', name: 'ОФВ1/ФЖЕЛ', unit: '%', normalRange: { min: 70, max: 85 } },
      { id: 'pef', name: 'ПСВ', unit: 'л/с', normalRange: { min: 5, max: 10 } },
    ],
  },
];
