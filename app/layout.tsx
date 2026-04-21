import type { Metadata, Viewport } from "next";
import { Heebo, Assistant } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  variable: "--font-assistant",
  display: "swap",
});

const bride = process.env.NEXT_PUBLIC_BRIDE_NAME ?? "כלה";
const groom = process.env.NEXT_PUBLIC_GROOM_NAME ?? "חתן";

export const metadata: Metadata = {
  title: `${bride} & ${groom} — אתר החתונה`,
  description: "אתר החתונה של בני הזוג — אישור הגעה, מקום, חניה ומידע שימושי",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FAF7F2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${assistant.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
