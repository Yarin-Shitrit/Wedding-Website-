import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";

const prisma = new PrismaClient();

type GuestDump = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  side: string;
  relation: string | null;
  invitedCount: number;
  rsvpStatus: string;
  attendingCount: number | null;
  dietary: string | null;
  notes: string | null;
  tableId: string | null;
  createdAt: string;
  updatedAt: string;
};

type TableDump = {
  id: string;
  label: string;
  capacity: number;
  x: number | null;
  y: number | null;
};

type PhotoDump = {
  id: string;
  dataUrl: string;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
};

type StationDump = {
  id: string;
  title: string;
  description: string;
  dataUrl: string;
  sortOrder: number;
  createdAt: string;
};

function cuidish() {
  // good-enough unique id for backfill — not a real cuid but unique + sortable
  return "c" + Date.now().toString(36) + randomBytes(8).toString("hex");
}

function mapSide(side: string): string {
  if (side === "BOTH") return "SHARED";
  if (side === "BRIDE" || side === "GROOM") return side;
  return "SHARED";
}

async function main() {
  const snap = JSON.parse(
    readFileSync("/tmp/migration-snapshot.json", "utf-8")
  ) as {
    guests: GuestDump[];
    tables: TableDump[];
    photos: PhotoDump[];
    stations: StationDump[];
  };

  console.log("Restoring", {
    guests: snap.guests.length,
    tables: snap.tables.length,
    photos: snap.photos.length,
    stations: snap.stations.length
  });

  // 1) Tables (must come first; guests reference tableId)
  for (const t of snap.tables) {
    await prisma.table.create({
      data: {
        id: t.id,
        name: t.label,
        capacity: t.capacity,
        notes: null
      }
    });
  }
  console.log(`✓ tables: ${snap.tables.length}`);

  // 2) Guests
  let guestOk = 0;
  let guestSkip = 0;
  const usedTokens = new Set<string>();
  for (const g of snap.guests) {
    let token = cuidish();
    while (usedTokens.has(token)) token = cuidish();
    usedTokens.add(token);

    try {
      await prisma.guest.create({
        data: {
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName ?? null,
          phone: g.phone ?? null,
          email: null,
          side: mapSide(g.side),
          group: g.relation ?? null,
          seatsInvited: g.invitedCount ?? 1,
          seatsConfirmed: g.attendingCount ?? 0,
          status: g.rsvpStatus ?? "PENDING",
          dietary: g.dietary ?? null,
          notes: g.notes ?? null,
          rsvpToken: token,
          respondedAt:
            g.rsvpStatus && g.rsvpStatus !== "PENDING"
              ? new Date(g.updatedAt)
              : null,
          tableId: g.tableId ?? null,
          createdAt: new Date(g.createdAt)
        }
      });
      guestOk++;
    } catch (err) {
      guestSkip++;
      console.error(
        `! skipped guest ${g.id} (${g.firstName} ${g.lastName}):`,
        err instanceof Error ? err.message.split("\n")[0] : err
      );
    }
  }
  console.log(`✓ guests: ${guestOk} restored, ${guestSkip} skipped`);

  // 3) Photos → GalleryItem
  for (const p of snap.photos) {
    await prisma.galleryItem.create({
      data: {
        id: p.id,
        src: p.dataUrl,
        alt: p.caption ?? "תמונה",
        ratio: "1/1",
        span: 1,
        order: p.sortOrder
      }
    });
  }
  console.log(`✓ gallery: ${snap.photos.length}`);

  // 4) Stations → ScheduleItem (Station has no time → use "—" placeholder)
  for (const s of snap.stations) {
    await prisma.scheduleItem.create({
      data: {
        id: s.id,
        time: "—",
        title: s.title,
        body: s.description,
        order: s.sortOrder
      }
    });
  }
  console.log(`✓ schedule: ${snap.stations.length}`);

  // 5) Settings singleton + seed Moments + FAQ (no source data)
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      brideName: "אילי",
      groomName: "ירין",
      weddingDate: new Date("2026-10-15T19:00:00+03:00"),
      venueName: "אולמי השדרה",
      venueAddress: "דרך השדרות 12, רעננה",
      venueMapUrl:
        "https://www.google.com/maps/search/?api=1&query=דרך+השדרות+12+רעננה",
      parkingInfo:
        "חניון תת־קרקעי, חינם למוזמנים. כניסה מדרך השדרות. בקשו אישור בכניסה — \"לחתונת אילי וירין\".",
      shuttleInfo:
        "שני אוטובוסים יוצאים מתחנת ארלוזורוב ב-18:15 ו-19:00. חזרה ב-00:30 ו-02:00.",
      dressCode:
        "Cocktail Garden — אלגנטי, לא רשמי. גוונים חמים מתאימים לערב הזה.",
      welcomeMessage: "אנחנו מחכים לחגוג איתכם.",
      storyTitle: "הסיפור שלנו",
      storyEyebrow: "פרק ראשון",
      storyBody:
        "נפגשנו בקפיטריה של הפקולטה למדעי המחשב, בערב חורפי אחד שבו לאף אחד מאיתנו לא היה שום תכנון להישאר. ירין הזמין קפה. אילי קראה ספר. שיחה אחת על מוזיקה הפכה לעוד אחת על תכנונים לעתיד, ועד שסגרו את המקום בחצות — כבר ידענו ששנינו לא הולכים לאף מקום בלי השני.",
      storyQuote: "ובלילה ההוא חזרנו ברגל הביתה.",
      heroLayout: "centered",
      palette: "terracotta",
      rsvpDeadline: "12.10"
    }
  });
  console.log("✓ settings");

  const moments = [
    { chapter: "I", year: "2021", title: "המפגש הראשון",
      body: "ערב חורף בתל-אביב. שיחה על מוזיקה שהפכה ללילה ארוך.",
      imageAlt: "first meeting", order: 1 },
    { chapter: "II", year: "2023", title: "הטיול לאיטליה",
      body: "שלושה שבועות, שש ערים, אינסוף פסטה. שם הבנו שזה זה.",
      imageAlt: "italy trip", order: 2 },
    { chapter: "III", year: "2024", title: "הדירה הראשונה",
      body: "מפתחות ביד, קרטון על הגב, מנורה אחת בסלון. ובית.",
      imageAlt: "first apartment", order: 3 },
    { chapter: "IV", year: "2025", title: "ההצעה",
      body: "על המצוק במכתש רמון, שקיעה כתומה, ברך אחת. כן.",
      imageAlt: "the proposal", order: 4 }
  ];
  for (const m of moments) {
    await prisma.moment.upsert({
      where: { id: `seed-moment-${m.order}` },
      update: m,
      create: { id: `seed-moment-${m.order}`, ...m }
    });
  }
  console.log(`✓ moments: ${moments.length}`);

  const faq = [
    { question: "מותר לבוא עם ילדים?",
      answer: "כן! יש פינת ילדים עם בייביסיטר משעה 19:00. נשמח לדעת מראש כמה ילדים מצטרפים בעת אישור ההגעה.",
      order: 1 },
    { question: "יש אופציות צמחוניות / טבעוניות / ללא גלוטן?",
      answer: "כן, לכל המנות. ציינו זאת בטופס אישור ההגעה ונדאג לכם.",
      order: 2 },
    { question: "האם אפשר לישון באזור?",
      answer: "מספר מלונות בקרבת מקום: דן רעננה (3 דק׳), Indigo כפר סבא (8 דק׳). כדאי להזמין מראש.",
      order: 3 },
    { question: "מה לגבי מתנה?",
      answer: "הנוכחות שלכם היא המתנה הטובה ביותר. למי שירצה — תהיה תיבת מעטפות בכניסה.",
      order: 4 },
    { question: "מה אם אני בורח/ת ברגע האחרון?",
      answer: "נצטער אבל נבין. אנא עדכנו אותנו עד 12.10 כדי שנוכל לתכנן בהתאם.",
      order: 5 }
  ];
  for (const f of faq) {
    await prisma.faqItem.upsert({
      where: { id: `seed-faq-${f.order}` },
      update: f,
      create: { id: `seed-faq-${f.order}`, ...f }
    });
  }
  console.log(`✓ faq: ${faq.length}`);

  // If no schedule items came from Station, seed defaults
  if (snap.stations.length === 0) {
    const schedule = [
      { time: "19:00", title: "קבלת פנים", body: "קוקטיילים, מוזיקה אקוסטית בגינה.", order: 1 },
      { time: "20:30", title: "החופה", body: "טקס בלב הפרדס, תחת השמיים הפתוחים.", order: 2 },
      { time: "21:15", title: "ארוחת ערב", body: "ארוחה ישובה, שלוש מנות.", order: 3 },
      { time: "22:30", title: "ריקודים", body: "פתיחת רחבה. הסט הראשי עד 02:00.", order: 4 },
      { time: "01:00", title: "אוכל לילה", body: "פינת שווארמה ומלוואח חם.", order: 5 }
    ];
    for (const s of schedule) {
      await prisma.scheduleItem.upsert({
        where: { id: `seed-schedule-${s.order}` },
        update: s,
        create: { id: `seed-schedule-${s.order}`, ...s }
      });
    }
    console.log(`✓ schedule (seeded): ${schedule.length}`);
  }

  console.log("\nMigration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
