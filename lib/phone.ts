import { parsePhoneNumberFromString } from "libphonenumber-js";

export function normalizePhone(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim().replace(/[\s-()]/g, "");
  const parsed = parsePhoneNumberFromString(trimmed, "IL");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

export function formatPhoneDisplay(phone: string): string {
  const parsed = parsePhoneNumberFromString(phone, "IL");
  return parsed?.formatInternational() ?? phone;
}
