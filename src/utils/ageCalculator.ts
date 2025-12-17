import { PatientAge } from '@/types/medical';

export const calculateAge = (birthDate: string, referenceDate: string = new Date().toISOString()): PatientAge => {
  if (!birthDate) {
    return { years: 0, months: 0, days: 0 };
  }

  const birth = new Date(birthDate);
  const reference = new Date(referenceDate);

  let years = reference.getFullYear() - birth.getFullYear();
  let months = reference.getMonth() - birth.getMonth();
  let days = reference.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    const lastMonth = new Date(reference.getFullYear(), reference.getMonth(), 0);
    days += lastMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  return { years, months, days };
};

export const ageToTotalDays = (age: PatientAge): number => {
  return age.years * 365.25 + age.months * 30.44 + age.days;
};

export const ageInUnit = (age: PatientAge, unit: 'years' | 'months' | 'days'): number => {
  const totalDays = ageToTotalDays(age);
  
  switch (unit) {
    case 'years':
      return totalDays / 365.25;
    case 'months':
      return totalDays / 30.44;
    case 'days':
      return totalDays;
    default:
      return totalDays;
  }
};

export const formatAge = (age: PatientAge): string => {
  const parts: string[] = [];
  
  if (age.years > 0) {
    parts.push(`${age.years} ${getYearWord(age.years)}`);
  }
  
  if (age.months > 0) {
    parts.push(`${age.months} ${getMonthWord(age.months)}`);
  }
  
  if (age.days > 0 || parts.length === 0) {
    parts.push(`${age.days} ${getDayWord(age.days)}`);
  }
  
  return parts.join(' ');
};

const getYearWord = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) return 'год';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'года';
  return 'лет';
};

const getMonthWord = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) return 'месяц';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'месяца';
  return 'месяцев';
};

const getDayWord = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) return 'день';
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'дня';
  return 'дней';
};
