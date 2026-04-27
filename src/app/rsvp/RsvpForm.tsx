"use client";

import { useState } from "react";

type Status = "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
type Step =
  | "entry"
  | "loading"
  | "notfound"
  | "already"
  | "form"
  | "decline"
  | "confirmed";

type LookupGuest = {
  id: string;
  token: string;
  name: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  seatsInvited: number;
  seatsConfirmed: number;
  status: Status;
  dietary: string | null;
  notes: string | null;
  respondedAt: string | null;
};

function normalizePhone(p: string) {
  return (p || "").replace(/[^0-9]/g, "");
}

function formatRespondedAt(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function RsvpForm({
  initialGuest,
  rsvpDeadline,
  venueName,
  venueAddress,
  weddingDateLabel
}: {
  initialGuest: LookupGuest | null;
  rsvpDeadline: string;
  venueName: string;
  venueAddress: string;
  weddingDateLabel: string;
}) {
  const initialStep: Step = initialGuest
    ? initialGuest.status === "ATTENDING" || initialGuest.status === "DECLINED"
      ? "already"
      : "form"
    : "entry";

  const [step, setStep] = useState<Step>(initialStep);
  const [phone, setPhone] = useState(initialGuest?.phone ?? "");
  const [guest, setGuest] = useState<LookupGuest | null>(initialGuest);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<Status | null>(initialGuest?.status === "PENDING" ? null : initialGuest?.status ?? null);
  const [count, setCount] = useState<number>(
    initialGuest?.seatsConfirmed && initialGuest.seatsConfirmed > 0
      ? initialGuest.seatsConfirmed
      : initialGuest?.seatsInvited ?? 1
  );
  const [diet, setDiet] = useState(initialGuest?.dietary ?? "");
  const [note, setNote] = useState(initialGuest?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleLookup() {
    const norm = normalizePhone(phone);
    if (!norm || norm.length < 9) {
      setError("נא להזין מספר טלפון תקף (9 ספרות לפחות)");
      return;
    }
    setError(null);
    setStep("loading");
    try {
      const res = await fetch(`/api/rsvp/lookup?phone=${encodeURIComponent(norm)}`);
      if (res.status === 404) {
        setStep("notfound");
        return;
      }
      if (!res.ok) throw new Error("lookup failed");
      const data = (await res.json()) as { found: boolean; guest: LookupGuest };
      setGuest(data.guest);
      setStatus(data.guest.status === "PENDING" ? null : data.guest.status);
      setCount(
        data.guest.seatsConfirmed > 0 ? data.guest.seatsConfirmed : data.guest.seatsInvited
      );
      setDiet(data.guest.dietary ?? "");
      setNote(data.guest.notes ?? "");
      if (data.guest.status === "ATTENDING" || data.guest.status === "DECLINED") {
        setStep("already");
      } else {
        setStep("form");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
      setStep("entry");
    }
  }

  async function submitForm() {
    if (!guest || !status) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: guest.token,
          phone: guest.phone ?? normalizePhone(phone),
          firstName: guest.firstName,
          lastName: guest.lastName,
          status,
          seatsConfirmed: status === "ATTENDING" ? count : 0,
          dietary: diet || null,
          notes: note || null
        })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "שליחה נכשלה");
      }
      setStep(status === "DECLINED" ? "decline" : "confirmed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("entry");
    setPhone("");
    setGuest(null);
    setStatus(null);
    setCount(1);
    setDiet("");
    setNote("");
    setError(null);
  }

  return (
    <div style={{ minHeight: 480, padding: "30px 22px 100px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        {step !== "entry" ? (
          <button
            onClick={reset}
            style={{
              background: "none",
              border: 0,
              color: "var(--ink-2)",
              cursor: "pointer",
              fontFamily: "JetBrains Mono",
              fontSize: 11,
              letterSpacing: "0.15em"
            }}
          >
            ← לחיפוש מחדש
          </button>
        ) : (
          <span />
        )}
        <div className="eyebrow">אישור הגעה</div>
      </div>

      {step === "entry" || step === "loading" ? (
        <EntryStep
          phone={phone}
          setPhone={setPhone}
          onSubmit={handleLookup}
          loading={step === "loading"}
          error={error}
        />
      ) : null}
      {step === "notfound" ? (
        <NotFoundStep phone={phone} onRetry={reset} />
      ) : null}
      {step === "already" && guest ? (
        <AlreadyStep guest={guest} onEdit={() => setStep("form")} />
      ) : null}
      {step === "form" && guest ? (
        <FormStep
          guest={guest}
          status={status}
          setStatus={setStatus}
          count={count}
          setCount={setCount}
          diet={diet}
          setDiet={setDiet}
          note={note}
          setNote={setNote}
          onSubmit={submitForm}
          submitting={submitting}
          error={error}
        />
      ) : null}
      {step === "decline" && guest ? (
        <DeclineStep
          guest={guest}
          deadline={rsvpDeadline}
          onUndo={() => {
            setStatus("ATTENDING");
            setStep("form");
          }}
          onClose={reset}
        />
      ) : null}
      {step === "confirmed" && guest ? (
        <ConfirmedStep
          guest={guest}
          count={count}
          venueName={venueName}
          venueAddress={venueAddress}
          weddingDateLabel={weddingDateLabel}
          onEdit={() => setStep("form")}
          onClose={reset}
        />
      ) : null}
    </div>
  );
}

function StepHeader({
  chapter,
  title,
  sub
}: {
  chapter: string;
  title: string;
  sub?: string;
}) {
  return (
    <div style={{ textAlign: "center", marginTop: 30, marginBottom: 28 }}>
      <div
        className="display serif-italic"
        style={{
          color: "var(--accent)",
          fontSize: 32,
          lineHeight: 1,
          marginBottom: 4
        }}
      >
        {chapter}
      </div>
      <div className="ornament" style={{ marginBottom: 14 }}>
        · · ·
      </div>
      <h2 className="display" style={{ fontSize: 32, margin: "0 0 6px" }}>
        {title}
      </h2>
      {sub ? (
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function EntryStep({
  phone,
  setPhone,
  onSubmit,
  loading,
  error
}: {
  phone: string;
  setPhone: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div>
      <StepHeader
        chapter="I"
        title="בואו נמצא אתכם"
        sub="הזינו את מספר הטלפון שאיתו הזמנו אתכם"
      />
      <div style={{ maxWidth: 320, margin: "0 auto" }}>
        <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>
          מספר טלפון
        </label>
        <input
          dir="ltr"
          className="field"
          placeholder="050-123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="numeric"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
        />
        <button
          className="btn btn-accent"
          style={{ marginTop: 22 }}
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? "מחפש…" : "המשך ←"}
        </button>
        {error ? (
          <p
            style={{
              fontSize: 13,
              color: "#a3361b",
              textAlign: "center",
              marginTop: 12
            }}
          >
            {error}
          </p>
        ) : null}
        <p
          style={{
            fontSize: 12,
            color: "var(--ink-3)",
            textAlign: "center",
            marginTop: 16,
            lineHeight: 1.7
          }}
        >
          לדוגמה: 050-123-4567
        </p>
      </div>
    </div>
  );
}

function NotFoundStep({ phone, onRetry }: { phone: string; onRetry: () => void }) {
  return (
    <div>
      <StepHeader
        chapter="·"
        title="לא מצאנו אתכם"
        sub="המספר שהוזן לא ברשימת המוזמנים שלנו"
      />
      <div
        style={{
          maxWidth: 320,
          margin: "0 auto",
          textAlign: "center",
          padding: "20px",
          border: "1px solid var(--hair)",
          background: "var(--paper)"
        }}
      >
        <div
          className="display"
          style={{ fontSize: 22, color: "var(--ink)", marginBottom: 8 }}
        >
          {phone || "—"}
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
          ייתכן שהזנתם מספר שגוי, או שאתם מוזמנים תחת מספר אחר במשפחה. אם זו טעות —
          צרו איתנו קשר ונשמח לעזור.
        </p>
      </div>
      <div
        style={{
          maxWidth: 320,
          margin: "20px auto 0",
          display: "grid",
          gap: 8
        }}
      >
        <button className="btn" onClick={onRetry}>
          נסו מספר אחר
        </button>
      </div>
    </div>
  );
}

function AlreadyStep({
  guest,
  onEdit
}: {
  guest: LookupGuest;
  onEdit: () => void;
}) {
  const isAttending = guest.status === "ATTENDING";
  const firstName = guest.name.split(" ")[0];
  return (
    <div>
      <StepHeader chapter="·" title={`היי ${firstName}`} sub="כבר השבת לנו — תודה!" />
      <div style={{ maxWidth: 320, margin: "0 auto" }}>
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            border: "1px solid var(--hair-strong)",
            background: "var(--paper)"
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            הסטטוס שלך
          </div>
          <div
            className="display"
            style={{ fontSize: 26, color: "var(--accent)" }}
          >
            {isAttending ? "מגיעים!" : "לא נוכל להגיע"}
          </div>
          {isAttending && guest.seatsConfirmed > 0 ? (
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--ink-2)",
                marginTop: 8
              }}
            >
              {guest.seatsConfirmed} סועדים
              {guest.respondedAt
                ? ` · עודכן ב-${formatRespondedAt(guest.respondedAt)}`
                : ""}
            </div>
          ) : null}
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <button className="btn" onClick={onEdit}>
            עדכון התשובה
          </button>
        </div>
      </div>
    </div>
  );
}

function FormStep({
  guest,
  status,
  setStatus,
  count,
  setCount,
  diet,
  setDiet,
  note,
  setNote,
  onSubmit,
  submitting,
  error
}: {
  guest: LookupGuest;
  status: Status | null;
  setStatus: (s: Status) => void;
  count: number;
  setCount: (n: number) => void;
  diet: string;
  setDiet: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const opts: { k: Status; label: string; sub: string }[] = [
    { k: "ATTENDING", label: "נגיע", sub: "באים לחגוג" },
    { k: "MAYBE", label: "אולי", sub: "עוד לא בטוח" },
    { k: "DECLINED", label: "לא נוכל", sub: "מצטערים" }
  ];

  return (
    <div>
      <StepHeader
        chapter="II"
        title={`שלום, ${guest.name}`}
        sub="ספרו לנו אם תוכלו להגיע"
      />
      <div style={{ maxWidth: 340, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 10 }}>
          {opts.map((o) => {
            const sel = status === o.k;
            return (
              <button
                key={o.k}
                onClick={() => setStatus(o.k)}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  textAlign: "right",
                  background: sel ? "var(--ink)" : "transparent",
                  color: sel ? "var(--ivory)" : "var(--ink)",
                  border:
                    "1px solid " +
                    (sel ? "var(--ink)" : "var(--hair-strong)"),
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  transition: "all .2s ease"
                }}
              >
                <div>
                  <div className="display" style={{ fontSize: 18, lineHeight: 1.1 }}>
                    {o.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: sel ? "rgba(245,239,228,0.7)" : "var(--ink-3)",
                      marginTop: 2
                    }}
                  >
                    {o.sub}
                  </div>
                </div>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    border:
                      "1px solid " +
                      (sel ? "var(--ivory)" : "var(--hair-strong)"),
                    background: sel ? "var(--accent)" : "transparent"
                  }}
                />
              </button>
            );
          })}
        </div>

        {status === "ATTENDING" ? (
          <div style={{ marginTop: 26 }}>
            <label className="eyebrow" style={{ display: "block", marginBottom: 10 }}>
              כמה אנשים תגיעו?
              <span style={{ marginInlineStart: 6, color: "var(--ink-3)" }}>
                · מתוך {guest.seatsInvited}
              </span>
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                justifyContent: "center"
              }}
            >
              <button
                onClick={() => setCount(Math.max(1, count - 1))}
                className="btn btn-ghost"
                style={{ width: 48, height: 48, padding: 0, fontSize: 20 }}
                aria-label="פחות"
              >
                −
              </button>
              <div
                className="display"
                style={{
                  fontSize: 44,
                  lineHeight: 1,
                  minWidth: 60,
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {count}
              </div>
              <button
                onClick={() => setCount(Math.min(guest.seatsInvited, count + 1))}
                className="btn btn-ghost"
                style={{ width: 48, height: 48, padding: 0, fontSize: 20 }}
                aria-label="יותר"
              >
                +
              </button>
            </div>

            <div style={{ marginTop: 22 }}>
              <label className="eyebrow" style={{ display: "block", marginBottom: 0 }}>
                העדפות תזונה{" "}
                <span style={{ color: "var(--ink-3)" }}>(אופציונלי)</span>
              </label>
              <input
                className="field"
                placeholder="צמחוני · טבעוני · ללא גלוטן…"
                value={diet}
                onChange={(e) => setDiet(e.target.value)}
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <label className="eyebrow" style={{ display: "block", marginBottom: 0 }}>
                הערה אישית{" "}
                <span style={{ color: "var(--ink-3)" }}>(אופציונלי)</span>
              </label>
              <input
                className="field"
                placeholder="משהו שכדאי שנדע…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {status === "DECLINED" ? (
          <div
            style={{
              marginTop: 22,
              padding: 16,
              background: "var(--paper)",
              border: "1px solid var(--hair)"
            }}
          >
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
              נצטער שלא נראה אתכם — אבל מבינים. תוכלו להוסיף מילה (לא חייב):
            </p>
            <input
              className="field"
              style={{ marginTop: 8 }}
              placeholder="הודעה לבני הזוג…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        ) : null}

        {error ? (
          <p
            style={{
              fontSize: 13,
              color: "#a3361b",
              textAlign: "center",
              marginTop: 14
            }}
          >
            {error}
          </p>
        ) : null}

        <button
          className="btn btn-accent"
          style={{ marginTop: 26 }}
          onClick={onSubmit}
          disabled={!status || submitting}
        >
          {submitting ? "שולח…" : "שליחת התשובה ←"}
        </button>
      </div>
    </div>
  );
}

function DeclineStep({
  guest,
  deadline,
  onUndo,
  onClose
}: {
  guest: LookupGuest;
  deadline: string;
  onUndo: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <StepHeader chapter="·" title="חבל שלא תגיעו" sub="אבל תודה שעדכנתם" />
      <div style={{ maxWidth: 320, margin: "0 auto", textAlign: "center" }}>
        <div
          className="display serif-italic"
          style={{
            fontSize: 28,
            color: "var(--accent)",
            padding: "20px 0"
          }}
        >
          “נחשוב עליכם בערב הזה.”
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)" }}>
          {guest.name}, סומנת כלא מגיע/ה. אם תשתנה דעתך — אפשר לחזור ולעדכן עד {deadline}.
        </p>
        <div style={{ display: "grid", gap: 8, marginTop: 22 }}>
          <button className="btn btn-ghost" onClick={onUndo}>
            שיניתי את דעתי
          </button>
          <button className="btn" onClick={onClose}>
            סיום
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmedStep({
  guest,
  count,
  venueName,
  venueAddress,
  weddingDateLabel,
  onEdit,
  onClose
}: {
  guest: LookupGuest;
  count: number;
  venueName: string;
  venueAddress: string;
  weddingDateLabel: string;
  onEdit: () => void;
  onClose: () => void;
}) {
  return (
    <div>
      <StepHeader
        chapter="III"
        title="נתראה ב-15.10"
        sub="קיבלנו את התשובה שלכם"
      />
      <div style={{ maxWidth: 340, margin: "0 auto" }}>
        <div
          style={{
            padding: "26px 20px",
            textAlign: "center",
            background: "var(--paper)",
            border: "1px solid var(--hair-strong)",
            position: "relative"
          }}
        >
          {(["tl", "tr", "bl", "br"] as const).map((c) => (
            <span
              key={c}
              className="serif-italic"
              style={{
                position: "absolute",
                width: 12,
                height: 12,
                color: "var(--accent)",
                fontSize: 18,
                lineHeight: 1,
                ...(c === "tl"
                  ? { top: 6, insetInlineStart: 6 }
                  : c === "tr"
                  ? { top: 6, insetInlineEnd: 6 }
                  : c === "bl"
                  ? { bottom: 6, insetInlineStart: 6 }
                  : { bottom: 6, insetInlineEnd: 6 })
              }}
            >
              ✦
            </span>
          ))}
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            אישור הגעה
          </div>
          <div className="display" style={{ fontSize: 28, margin: "4px 0 8px" }}>
            {guest.name}
          </div>
          <div className="ornament" style={{ marginBottom: 8 }}>
            · · ·
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)" }}>
            <div>
              <strong style={{ color: "var(--ink)" }}>{count}</strong> סועדים
            </div>
            <div style={{ marginTop: 2 }}>{weddingDateLabel}</div>
            <div>
              {venueName} · {venueAddress}
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 8, marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={onEdit}>
            לעדכן את התשובה
          </button>
          <button className="btn" onClick={onClose}>
            חזרה לאתר
          </button>
        </div>
      </div>
    </div>
  );
}
