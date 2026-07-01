"use client";

import { useCallback, useMemo, useRef, useState } from "react";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const PARALLELISM = 3;

type ItemStatus = "pending" | "uploading" | "done" | "rejected" | "error";

interface UploadItem {
  id: string;
  file: File;
  status: ItemStatus;
  message?: string;
  photoId?: string;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function preflightReason(file: File): string | null {
  if (file.size === 0) return "empty file";
  if (file.size > MAX_BYTES) return `exceeds 25 MB limit (${formatBytes(file.size)})`;
  // Some browsers leave .heic with empty type; allow when extension says so.
  const looksLikeHeic = /\.(heic|heif)$/i.test(file.name);
  if (!file.type && !looksLikeHeic) return "no MIME type";
  if (file.type && !ALLOWED.has(file.type)) return `unsupported type (${file.type})`;
  return null;
}

export function PhotosUploadClient() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(0);

  const counts = useMemo(() => {
    const c = { total: items.length, done: 0, rejected: 0, error: 0, uploading: 0, pending: 0 };
    for (const it of items) c[it.status]++;
    return c;
  }, [items]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const next: UploadItem[] = [];
    for (const f of Array.from(files)) {
      const reason = preflightReason(f);
      next.push({
        id: `f${idRef.current++}`,
        file: f,
        status: reason ? "rejected" : "pending",
        message: reason ?? undefined,
      });
    }
    setItems((prev) => [...prev, ...next]);
  }, []);

  const onPick = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const clearFinished = useCallback(() => {
    setItems((prev) =>
      prev.filter((it) => it.status !== "done" && it.status !== "rejected"),
    );
  }, []);

  const uploadOne = useCallback(
    async (item: UploadItem): Promise<void> => {
      setItems((prev) =>
        prev.map((p) => (p.id === item.id ? { ...p, status: "uploading", message: undefined } : p)),
      );
      const fd = new FormData();
      fd.append("file", item.file, item.file.name);
      try {
        const resp = await fetch("/api/photos/upload", {
          method: "POST",
          body: fd,
        });
        if (!resp.ok) {
          let detail = `HTTP ${resp.status}`;
          try {
            const j = await resp.json();
            if (j?.error) detail = typeof j.error === "string" ? j.error : "upload error";
          } catch {
            /* not JSON, keep status code */
          }
          setItems((prev) =>
            prev.map((p) =>
              p.id === item.id ? { ...p, status: "error", message: detail } : p,
            ),
          );
          return;
        }
        const body = (await resp.json()) as { id: string };
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, status: "done", photoId: body.id } : p,
          ),
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "error", message: (err as Error).message ?? "network error" }
              : p,
          ),
        );
      }
    },
    [],
  );

  const start = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Snapshot the queue once; further additions during a run can be started
      // by clicking "Upload" again.
      const queue = items.filter((it) => it.status === "pending");
      let cursor = 0;
      const workers: Promise<void>[] = [];
      for (let w = 0; w < PARALLELISM; w++) {
        workers.push(
          (async () => {
            while (cursor < queue.length) {
              const i = cursor++;
              await uploadOne(queue[i]);
            }
          })(),
        );
      }
      await Promise.all(workers);
    } finally {
      setBusy(false);
    }
  }, [busy, items, uploadOne]);

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div style={{ marginTop: 24 }}>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        style={{
          border: `2px dashed ${dragging ? "var(--accent)" : "var(--hair-strong)"}`,
          background: dragging ? "var(--paper)" : "var(--ivory)",
          borderRadius: 12,
          padding: "40px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "border-color .15s, background .15s",
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink)" }}>
          Drop photos here, or click to choose
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: "var(--ink-3)" }}>
          JPEG · PNG · WebP · HEIC · up to 25 MB each
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          onChange={onPick}
          style={{ display: "none" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginTop: 16,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={start}
          disabled={busy || pendingCount === 0}
          style={{
            padding: "10px 20px",
            background: pendingCount === 0 || busy ? "var(--hair-strong)" : "var(--accent)",
            color: "var(--ivory)",
            border: 0,
            borderRadius: 9999,
            fontSize: 14,
            fontWeight: 600,
            cursor: busy || pendingCount === 0 ? "not-allowed" : "pointer",
          }}
        >
          {busy ? "Uploading…" : `Upload ${pendingCount} photo${pendingCount === 1 ? "" : "s"}`}
        </button>
        <button
          type="button"
          onClick={clearFinished}
          disabled={busy || (counts.done === 0 && counts.rejected === 0)}
          style={{
            padding: "10px 16px",
            background: "transparent",
            color: "var(--ink-2)",
            border: "1px solid var(--hair-strong)",
            borderRadius: 9999,
            fontSize: 13,
            cursor: busy ? "not-allowed" : "pointer",
          }}
        >
          Clear finished
        </button>
        {items.length > 0 ? (
          <div style={{ marginInlineStart: "auto", fontSize: 13, color: "var(--ink-3)" }}>
            {counts.done} done · {counts.uploading} uploading · {counts.pending} pending ·{" "}
            {counts.rejected + counts.error} failed · {counts.total} total
          </div>
        ) : null}
      </div>

      {items.length > 0 ? (
        <ul
          style={{
            listStyle: "none",
            margin: "20px 0 0",
            padding: 0,
            border: "1px solid var(--hair-strong)",
            borderRadius: 8,
            background: "var(--paper)",
            overflow: "hidden",
          }}
        >
          {items.map((it) => (
            <li
              key={it.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 12,
                padding: "10px 14px",
                borderBottom: "1px solid var(--hair-strong)",
                alignItems: "center",
                fontSize: 13,
              }}
            >
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <div style={{ color: "var(--ink)", fontWeight: 500 }}>{it.file.name}</div>
                {it.message ? (
                  <div
                    style={{
                      color: it.status === "done" ? "var(--ink-3)" : "var(--accent-deep)",
                      fontSize: 12,
                      marginTop: 2,
                    }}
                  >
                    {it.message}
                  </div>
                ) : null}
              </div>
              <div style={{ color: "var(--ink-3)", fontSize: 12 }}>
                {formatBytes(it.file.size)}
              </div>
              <StatusBadge status={it.status} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: ItemStatus }) {
  const map: Record<ItemStatus, { label: string; bg: string; fg: string }> = {
    pending:   { label: "pending",   bg: "var(--ivory)",  fg: "var(--ink-2)" },
    uploading: { label: "uploading", bg: "var(--accent)", fg: "var(--ivory)" },
    done:      { label: "added",     bg: "#2e7d32",       fg: "#ffffff" },
    rejected:  { label: "rejected",  bg: "#c62828",       fg: "#ffffff" },
    error:     { label: "error",     bg: "#b71c1c",       fg: "#ffffff" },
  };
  const s = map[status];
  return (
    <span
      style={{
        background: s.bg,
        color: s.fg,
        padding: "3px 10px",
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {s.label}
    </span>
  );
}
