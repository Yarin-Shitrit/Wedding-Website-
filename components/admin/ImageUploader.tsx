"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { compressImage } from "@/lib/image";

type Props = {
  value?: string | null;
  onChange: (dataUrl: string) => void;
  label?: string;
  shape?: "square" | "wide" | "portrait";
};

const shapeClass = {
  square: "aspect-square",
  wide: "aspect-[4/3]",
  portrait: "aspect-[3/4]",
};

export function ImageUploader({
  value,
  onChange,
  label = "בחר תמונה",
  shape = "square",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      onChange(dataUrl);
    } catch {
      setErr("לא הצלחנו לטעון את התמונה");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={`relative w-full ${shapeClass[shape]} rounded-xl2 overflow-hidden border border-sage-100 bg-sage-50 flex items-center justify-center text-sage-700 hover:bg-sage-100 transition`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-sm">
            <ImagePlus size={28} />
            <span>{label}</span>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
      {err && <p className="mt-2 text-xs text-blush-700">{err}</p>}
    </div>
  );
}
