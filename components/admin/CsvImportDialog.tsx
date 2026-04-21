"use client";

import { useState } from "react";
import { X, Upload } from "lucide-react";
import { he } from "@/messages/he";

type Result = {
  added: number;
  updated: number;
  errors: { row: number; reason: string }[];
};

export function CsvImportDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    setCsv(text);
  }

  async function commit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/guests/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(he.common.error);
        return;
      }
      setResult({ added: data.added, updated: data.updated, errors: data.errors });
    } catch {
      setError(he.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-30 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl2 rounded-t-xl2 shadow-soft max-h-[92dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3 border-b border-sage-100">
          <h2 className="font-semibold">{he.admin.csv.import}</h2>
          <button className="btn-ghost p-2" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-ink/60 leading-relaxed">
            פורמט עמודות: <code dir="ltr">firstName, lastName, phone, side, relation, invitedCount</code>.
            <br />
            אפשר לרשום <code dir="ltr">side</code> כ־
            <code>bride/groom/both</code> או <code>כלה/חתן/משותף</code>.
          </p>
          <label className="block border-2 border-dashed border-sage-100 rounded-xl2 p-8 text-center cursor-pointer hover:border-sage-500 transition">
            <Upload className="mx-auto text-sage-600 mb-2" size={22} />
            <span className="block text-sm">{he.admin.csv.dropHere}</span>
            {fileName && <span className="block text-xs text-ink/60 mt-1">{fileName}</span>}
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </label>

          {error && <p className="text-sm text-blush-700">{error}</p>}
          {result && (
            <div className="bg-sage-50 p-3 rounded-xl2 text-sm">
              <div>{he.admin.csv.summary(result.added, result.updated, result.errors.length)}</div>
              {result.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-blush-700">
                    הצג שגיאות
                  </summary>
                  <ul className="mt-2 text-xs space-y-1">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        שורה {e.row}: {e.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button className="btn-secondary flex-1" onClick={onClose}>
              {result ? he.common.close : he.common.cancel}
            </button>
            {!result && (
              <button
                className="btn-primary flex-1"
                onClick={commit}
                disabled={!csv || loading}
              >
                {loading ? he.common.loading : he.admin.csv.commit}
              </button>
            )}
            {result && (
              <button className="btn-primary flex-1" onClick={onDone}>
                {he.common.confirm}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
