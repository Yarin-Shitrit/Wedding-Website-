export function InfoBlock({
  roman,
  title,
  body
}: {
  roman: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        padding: "16px 0",
        borderTop: "1px solid var(--hair)",
        display: "grid",
        gridTemplateColumns: "32px 1fr",
        gap: 14
      }}
    >
      <div
        className="display serif-italic"
        style={{
          color: "var(--accent)",
          fontSize: 26,
          lineHeight: 1
        }}
      >
        {roman}
      </div>
      <div>
        <h3 className="display" style={{ fontSize: 19, margin: "0 0 4px" }}>
          {title}
        </h3>
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--ink-2)",
            margin: 0
          }}
        >
          {body}
        </p>
      </div>
    </div>
  );
}
