export function SectionDivider({ dots = "· · ·" }: { dots?: string }) {
  return (
    <div className="ornament" style={{ textAlign: "center" }}>
      {dots}
    </div>
  );
}
