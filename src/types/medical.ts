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

export type PatientAge = {
  years: number;
  months: number;
  days: number;
};

export type PatientData = {
  name: string;
  gender: 'male' | 'female' | '';
  birthDate: string;
  age?: PatientAge;
  weight: string;
  height: string;
  bsa?: number;
  ultrasoundDevice: string;
  studyDate: string;
};

export type ECGPositionType = 
  | 'lying' 
  | 'lying_inhale' 
  | 'lying_standing' 
  | 'lying_standing_exercise'
  | 'custom';

export type ECGRhythm = 
  | 'sinus'
  | 'migration'
  | 'atrial'
  | 'av_nodal'
  | 'atrial_fibrillation'
  | 'idioventricular'
  | 'supraventricular_tachycardia'
  | 'av_nodal_tachycardia'
  | 'ventricular_tachycardia'
  | 'custom';

export type ECGAxis = 
  | 'normal'
  | 'vertical'
  | 'horizontal'
  | 'right'
  | 'left'
  | 'sharp_right'
  | 'sharp_left'
  | 's_type'
  | 'custom';

export type ECGPositionData = {
  position: 'lying' | 'inhale' | 'standing' | 'exercise';
  rhythm: ECGRhythm;
  rhythmCustom?: string;
  axis: ECGAxis;
  axisCustom?: string;
  results: Record<string, number>;
};

export type Protocol = {
  id: string;
  studyType: string;
  date: string;
  patientName: string;
  patientData: PatientData;
  results: Record<string, number>;
  resultsMinMax?: Record<string, { min?: number; max?: number }>;
  conclusion: string;
  signed?: boolean;
  ecgPositionType?: ECGPositionType;
  ecgPositions?: ECGPositionData[];
};

export const ECG_POSITION_TYPES = {
  lying: 'Лежа',
  lying_inhale: 'Лежа + на вдохе',
  lying_standing: 'Лежа + Стоя',
  lying_standing_exercise: 'Лежа + Стоя + физ. нагрузка',
  custom: 'Дополнительные позиции',
} as const;

export const ECG_RHYTHMS = {
  sinus: 'синусовый',
  migration: 'миграция водителя ритма',
  atrial: 'предсердный',
  av_nodal: 'АВ узловой',
  atrial_fibrillation: 'фибрилляция предсердий',
  idioventricular: 'идиовентрикулярный',
  supraventricular_tachycardia: 'наджелудочковая тахикардия',
  av_nodal_tachycardia: 'АВ узловая тахикардия',
  ventricular_tachycardia: 'желудочковая тахикардия',
  custom: 'Другое (ввести вручную)',
} as const;

export const ECG_AXIS = {
  normal: 'нормальное положение',
  vertical: 'вертикальное положение',
  horizontal: 'горизонтальное положение',
  right: 'отклонена вправо',
  left: 'отклонена влево',
  sharp_right: 'резко отклонена вправо',
  sharp_left: 'резко отклонена влево',
  s_type: 'S тип',
  custom: 'Другое (ввести вручную)',
} as const;

export const ECG_POSITION_LABELS = {
  lying: 'Лежа',
  inhale: 'На вдохе',
  standing: 'Стоя',
  exercise: 'После физ. нагрузки',
} as const;

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