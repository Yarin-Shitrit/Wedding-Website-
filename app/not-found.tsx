import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-3xl font-semibold">דף לא נמצא</h1>
      <p className="text-ink/60 mt-2">הקישור שהגעתם אליו אינו זמין.</p>
      <Link href="/" className="btn-primary mt-6">
        חזרה לעמוד הבית
      </Link>
    </div>
  );
}
