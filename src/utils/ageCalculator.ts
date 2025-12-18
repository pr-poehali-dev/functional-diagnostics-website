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

/**
 * Форматирует возраст пациента в зависимости от возрастного диапазона:
 * - До 1 месяца (0-30 дней): только дни (например, "15 дней")
 * - От 1 месяца до 1 года: месяцы и дни (например, "5 месяцев 10 дней")
 * - От 1 года: годы и месяцы (например, "3 года 6 месяцев")
 */
export const formatAge = (age: PatientAge): string => {
  const { years, months, days } = age;

  // Первый месяц жизни (0 лет, 0 месяцев) - только дни
  if (years === 0 && months === 0) {
    return `${days} ${getDayWord(days)}`;
  }

  // До года (0 лет, есть месяцы) - месяцы и дни
  if (years === 0 && months > 0) {
    if (days === 0) {
      return `${months} ${getMonthWord(months)}`;
    }
    return `${months} ${getMonthWord(months)} ${days} ${getDayWord(days)}`;
  }

  // От года - годы и месяцы
  if (months === 0) {
    return `${years} ${getYearWord(years)}`;
  }
  return `${years} ${getYearWord(years)} ${months} ${getMonthWord(months)}`;
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