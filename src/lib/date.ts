// Shared Hebrew date formatting. Extracted from celebration/page.tsx so both the
// invitation page and the gallery header render the wedding date identically.

export const HE_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export const HE_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר"
];

// Full: "יום חמישי · 25 ביוני 2026" — used on the invitation hero/footer.
export function formatHebrewDate(d: Date): string {
  const day = HE_DAYS[d.getDay()];
  const month = HE_MONTHS[d.getMonth()];
  return `יום ${day} · ${d.getDate()} ב${month} ${d.getFullYear()}`;
}

// Short: "25 ביוני 2026" — used in the gallery header eyebrow.
export function formatHebrewDateShort(d: Date): string {
  const month = HE_MONTHS[d.getMonth()];
  return `${d.getDate()} ב${month} ${d.getFullYear()}`;
}
