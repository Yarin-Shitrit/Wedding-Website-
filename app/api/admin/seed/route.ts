import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { Side, RsvpStatus } from "@prisma/client";

// One-shot seeder. Requires an authenticated admin session AND an empty DB
// (no guests, no tables). Safe to leave deployed — rejects on anything but
// a pristine database.
export async function POST() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [guestCount, tableCount] = await Promise.all([
    prisma.guest.count(),
    prisma.table.count(),
  ]);
  if (guestCount > 0 || tableCount > 0) {
    return NextResponse.json(
      { ok: false, error: "already_populated", guestCount, tableCount },
      { status: 409 }
    );
  }

  const tables = await Promise.all(
    ["שולחן 1 - משפחת החתן", "שולחן 2 - משפחת הכלה", "שולחן 3 - חברים"].map((label, i) =>
      prisma.table.create({
        data: { label, capacity: 10, x: 100 + i * 160, y: 120 },
      })
    )
  );

  await prisma.contentBlock.upsert({
    where: { key: "hero" },
    update: {},
    create: {
      key: "hero",
      valueJson: { title: "אנחנו מתחתנים!", subtitle: "ונשמח לחגוג איתכם" },
    },
  });
  await prisma.contentBlock.upsert({
    where: { key: "story" },
    update: {},
    create: {
      key: "story",
      valueJson: {
        title: "הסיפור שלנו",
        body: "נפגשנו, התאהבנו, והחלטנו לחלוק את החיים יחד.",
      },
    },
  });
  await prisma.contentBlock.upsert({
    where: { key: "venue" },
    update: {},
    create: {
      key: "venue",
      valueJson: {
        name: "גן האירועים",
        address: "רחוב האהבה 1, תל אביב",
        embedUrl:
          "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3380!2d34.78!3d32.07!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1",
        wazeUrl: "https://waze.com/ul?ll=32.0700,34.7800&navigate=yes",
        description: "החניון פתוח מהשעה 18:00. קבלת פנים בכניסה הראשית.",
      },
    },
  });
  await prisma.contentBlock.upsert({
    where: { key: "parking" },
    update: {},
    create: {
      key: "parking",
      valueJson: {
        title: "חניה ומידע שימושי",
        body: "**חניה חינם** בחניון האולם, כניסה משער מס׳ 2.\n\nשירות שאטל מהרכבת הקלה כל 15 דקות בין 18:30-21:00.\n\nנגישות מלאה לבעלי מוגבלויות.",
      },
    },
  });
  await prisma.contentBlock.upsert({
    where: { key: "gift" },
    update: {},
    create: {
      key: "gift",
      valueJson: {
        title: "מתנה",
        body: "הגעתכם היא המתנה הכי יפה.",
      },
    },
  });

  const samples: Array<{
    firstName: string;
    lastName: string;
    phone: string;
    side: Side;
    relation: string;
    invitedCount: number;
    tableIdx: number;
    rsvpStatus?: RsvpStatus;
    attendingCount?: number;
  }> = [
    { firstName: "דנה", lastName: "כהן", phone: "+972501234567", side: "BRIDE", relation: "אחות", invitedCount: 2, tableIdx: 1, rsvpStatus: "ATTENDING", attendingCount: 2 },
    { firstName: "יוסי", lastName: "לוי", phone: "+972502345678", side: "GROOM", relation: "אח", invitedCount: 2, tableIdx: 0, rsvpStatus: "ATTENDING", attendingCount: 2 },
    { firstName: "מיכל", lastName: "אברהם", phone: "+972503456789", side: "BOTH", relation: "חברה", invitedCount: 2, tableIdx: 2 },
    { firstName: "רון", lastName: "מזרחי", phone: "+972504567890", side: "GROOM", relation: "חבר", invitedCount: 1, tableIdx: 2, rsvpStatus: "DECLINED" },
    { firstName: "שיר", lastName: "פרץ", phone: "+972505678901", side: "BRIDE", relation: "דודה", invitedCount: 2, tableIdx: 1 },
    { firstName: "אלון", lastName: "גולן", phone: "+972506789012", side: "GROOM", relation: "דוד", invitedCount: 2, tableIdx: 0, rsvpStatus: "MAYBE" },
  ];

  for (const g of samples) {
    await prisma.guest.create({
      data: {
        firstName: g.firstName,
        lastName: g.lastName,
        phone: g.phone,
        side: g.side,
        relation: g.relation,
        invitedCount: g.invitedCount,
        rsvpStatus: g.rsvpStatus ?? "PENDING",
        attendingCount: g.attendingCount ?? null,
        tableId: tables[g.tableIdx].id,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    tables: tables.length,
    guests: samples.length,
  });
}
