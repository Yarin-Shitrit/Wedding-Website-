import { parsePhoneNumberFromString } from "libphonenumber-js";

// Normalize phone to E.164. Handles:
//  - Full international (+972...)
//  - Israeli with leading 0 (050-1234567)
//  - Israeli 9-digit mobile without leading 0 (501234567 — common when
//    exporting from Excel/Sheets, which strips the leading zero from
//    numeric cells). We only do this when the number starts with a
//    valid IL mobile prefix (5) so we don't hide typos elsewhere.
//  - Empty / whitespace → null
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  let trimmed = String(input).trim().replace(/[\s\-()]/g, "");
  if (!trimmed) return null;
  if (/^\d{9}$/.test(trimmed) && trimmed.startsWith("5")) {
    trimmed = "0" + trimmed;
  }
  const parsed = parsePhoneNumberFromString(trimmed, "IL");
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number;
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "";
  const parsed = parsePhoneNumberFromString(phone, "IL");
  return parsed?.formatInternational() ?? phone;
}
