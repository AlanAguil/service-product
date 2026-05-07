import { stringConstants } from './string.constant';

const capitalizeAndJoinWords = (value: string[]): string => {
  return value
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('. ');
};
export { capitalizeAndJoinWords };

export const addDaysToDate = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const generateRandomCode = (length: number) => {
  let result = '';
  const charactersLength = stringConstants.characters.length;
  let counter = 0;
  while (counter < length) {
    result += stringConstants.characters.charAt(
      Math.floor(Math.random() * charactersLength),
    );
    counter += 1;
  }
  return result;
};

export const addDaysToDateString = (dateString: string, days: number): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const parseMonthYearToDateRange = (monthYear: string): { startDate: Date; endDate: Date } => {
  const [year, month] = monthYear.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return { startDate, endDate };
};

export const formatDateRange = (startDate: Date, endDate: Date, locale: string = 'es-MX'): string => {
  return `${startDate.toLocaleDateString(locale)} - ${endDate.toLocaleDateString(locale)}`;
};

export const slugify = (text: string): string => {
  return text.toLowerCase().replace(/\s+/g, '-');
};
