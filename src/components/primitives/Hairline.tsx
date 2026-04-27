export function Hairline({ ornament = "·" }: { ornament?: string }) {
  return (
    <div className="hairline">
      <span className="ornament" style={{ flex: "none" }}>
        {ornament}
      </span>
    </div>
  );
}
