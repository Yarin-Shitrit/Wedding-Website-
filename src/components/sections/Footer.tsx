export function Footer({
  bride,
  groom,
  dateLabel
}: {
  bride: string;
  groom: string;
  dateLabel: string;
}) {
  return (
    <footer
      style={{
        padding: "50px 22px 90px",
        borderTop: "1px solid var(--hair)",
        textAlign: "center",
        marginTop: 20
      }}
    >
      <div className="ornament" style={{ marginBottom: 14 }}>
        · · · · ·
      </div>
      <div className="display" style={{ fontSize: 26, lineHeight: 1.1 }}>
        {bride}{" "}
        <span className="serif-italic" style={{ color: "var(--accent)" }}>
          &
        </span>{" "}
        {groom}
      </div>
      <div
        style={{
          fontSize: 12.5,
          lineHeight: 1.7,
          color: "var(--ink-3)",
          marginTop: 8
        }}
      >
        {dateLabel}
      </div>
      <div className="eyebrow" style={{ marginTop: 22 }}>
        made with love · 2026
      </div>
    </footer>
  );
}
