/**
 * Indian Mobile Number Normalization & Validation Utility
 * Standardizes numbers to 10 digits (starting with 6, 7, 8, or 9)
 */

export const normalizeIndianPhone = (rawPhone: string | number | undefined | null): string => {
  if (!rawPhone) return '';

  // Convert to string and remove all non-numeric characters
  let digits = String(rawPhone).replace(/\D/g, '');

  // Strip leading 0 if 11 digits (e.g. 09876543210)
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Strip country code 91 if 12 digits (e.g. 919876543210)
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  return digits;
};

export const isValidIndianMobile = (phone: string): boolean => {
  const normalized = normalizeIndianPhone(phone);
  // Must be exactly 10 digits starting with 6, 7, 8, or 9
  return /^[6-9]\d{9}$/.test(normalized);
};

export const formatIndianPhoneDisplay = (rawPhone: string): string => {
  const normalized = normalizeIndianPhone(rawPhone);
  if (normalized.length === 10) {
    return `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
  }
  return rawPhone;
};
