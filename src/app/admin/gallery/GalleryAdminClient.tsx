"use client";

import { useCallback, useState } from "react";

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  uploaderName: string | null;
  createdAt: string;
}

interface Props {
  initialItems: GalleryItem[];
}

type TileState = "idle" | "confirming" | "deleting" | "error";

export function GalleryAdminClient({ initialItems }: Props) {
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  // Per-item UI state keyed by id. Absent id => "idle".
  const [states, setStates] = useState<Record<string, TileState>>({});

  const setState = useCallback((id: string, s: TileState) => {
    setStates((prev) => ({ ...prev, [id]: s }));
  }, []);

  const clearState = useCallback((id: string) => {
    setStates((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const remove = useCallback(
    async (id: string) => {
      setState(id, "deleting");
      try {
        const resp = await fetch(`/api/guest-photos/${id}`, { method: "DELETE" });
        if (!resp.ok) {
          setState(id, "error");
          return;
        }
        // Optimistically drop the tile on success.
        setItems((prev) => prev.filter((it) => it.id !== id));
        clearState(id);
      } catch {
        setState(id, "error");
      }
    },
    [setState, clearState]
  );

  if (items.length === 0) {
    return (
      <div
        style={{
          marginTop: 24,
          padding: "40px 24px",
          textAlign: "center",
          color: "var(--ink-3)",
          border: "1px solid var(--hair)",
          borderRadius: 12,
          background: "var(--paper)"
        }}
      >
        No guest uploads yet.
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 24,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12
      }}
    >
      {items.map((it) => {
        const state = states[it.id] ?? "idle";
        const busy = state === "deleting";
        return (
          <div
            key={it.id}
            style={{
              border: "1px solid var(--hair)",
              borderRadius: 10,
              overflow: "hidden",
              background: "var(--paper)",
              display: "flex",
              flexDirection: "column"
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                background: "var(--ivory)"
              }}
            >
              {it.type === "video" ? (
                <video
                  src={it.url}
                  controls
                  preload="metadata"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={it.url}
                  alt={it.caption ?? it.uploaderName ?? "Guest upload"}
                  loading="lazy"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              )}
            </div>

            <div
              style={{
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                flex: 1
              }}
            >
              {it.uploaderName ? (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                >
                  {it.uploaderName}
                </div>
              ) : null}
              {it.caption ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-2)",
                    lineHeight: 1.3,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}
                >
                  {it.caption}
                </div>
              ) : null}

              <div style={{ marginTop: "auto", paddingTop: 4 }}>
                {state === "confirming" ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => remove(it.id)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        background: "#c62828",
                        color: "#ffffff",
                        border: 0,
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit"
                      }}
                    >
                      Confirm?
                    </button>
                    <button
                      type="button"
                      onClick={() => clearState(it.id)}
                      style={{
                        padding: "6px 8px",
                        background: "transparent",
                        color: "var(--ink-2)",
                        border: "1px solid var(--hair-strong)",
                        borderRadius: 6,
                        fontSize: 12,
                        cursor: "pointer",
                        fontFamily: "inherit"
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setState(it.id, "confirming")}
                    disabled={busy}
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      background: "transparent",
                      color: busy ? "var(--ink-3)" : "#c62828",
                      border: `1px solid ${busy ? "var(--hair-strong)" : "#c62828"}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: busy ? "not-allowed" : "pointer",
                      fontFamily: "inherit"
                    }}
                  >
                    {busy ? "Deleting…" : "Delete"}
                  </button>
                )}

                {state === "error" ? (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "#c62828"
                    }}
                  >
                    Delete failed. Tap Delete to retry.
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
