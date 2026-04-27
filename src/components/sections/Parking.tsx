import { Reveal } from "@/components/primitives/Reveal";
import { InfoBlock } from "@/components/primitives/InfoBlock";

export function Parking({
  parkingInfo,
  shuttleInfo,
  dressCode
}: {
  parkingInfo: string;
  shuttleInfo: string;
  dressCode: string;
}) {
  return (
    <section id="parking" style={{ padding: "60px 22px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="eyebrow">הגעה ומידע</div>
          <h2 className="display" style={{ fontSize: 38, margin: "10px 0 6px" }}>
            חניה ושאטלים
          </h2>
          <div className="ornament">· · ·</div>
        </div>
      </Reveal>
      <div style={{ display: "grid", gap: 16 }}>
        {parkingInfo ? (
          <Reveal delay={60}>
            <InfoBlock roman="I" title="חניה באולם" body={parkingInfo} />
          </Reveal>
        ) : null}
        {shuttleInfo ? (
          <Reveal delay={120}>
            <InfoBlock roman="II" title="שאטלים מתל-אביב" body={shuttleInfo} />
          </Reveal>
        ) : null}
        {dressCode ? (
          <Reveal delay={180}>
            <InfoBlock roman="III" title="קוד לבוש" body={dressCode} />
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
