import { PrismaClient, Side, RsvpStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Tables
  const tables = await Promise.all(
    ["שולחן 1 - משפחת החתן", "שולחן 2 - משפחת הכלה", "שולחן 3 - חברים"].map(
      (label, i) =>
        prisma.table.upsert({
          where: { label },
          update: {},
          create: { label, capacity: 10, x: 100 + i * 160, y: 120 },
        })
    )
  );

  // Content blocks
  await prisma.contentBlock.upsert({
    where: { key: "hero" },
    update: {},
    create: {
      key: "hero",
      valueJson: {
        title: "אנחנו מתחתנים!",
        subtitle: "ונשמח לחגוג איתכם",
        heroImageUrl: "",
      },
    },
  });

  await prisma.contentBlock.upsert({
    where: { key: "story" },
    update: {},
    create: {
      key: "story",
      valueJson: {
        title: "הסיפור שלנו",
        body: "נפגשנו, התאהבנו, והחלטנו לחלוק את החיים יחד. שמחים לחגוג איתכם את היום המיוחד שלנו.",
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
        lat: 32.07,
        lng: 34.78,
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
        body: [
          "**חניה חינם** בחניון האולם, כניסה משער מס׳ 2.",
          "",
          "אפשרות חניה ברחוב בסמיכות עד 200 מ׳.",
          "",
          "**שירות שאטל** מהרכבת הקלה כל 15 דקות בין 18:30-21:00.",
          "",
          "נגישות מלאה לבעלי מוגבלויות.",
        ].join("\n"),
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
        body: "הגעתכם היא המתנה הכי יפה. למי שמעוניין, קופת המתנות תהיה זמינה בכניסה.",
      },
    },
  });

  // Sample guests
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
    { firstName: "נועה", lastName: "שלום", phone: "+972507890123", side: "BRIDE", relation: "חברה", invitedCount: 1, tableIdx: 2, rsvpStatus: "ATTENDING", attendingCount: 1 },
    { firstName: "איתי", lastName: "ברק", phone: "+972508901234", side: "GROOM", relation: "חבר עבודה", invitedCount: 2, tableIdx: 0 },
  ];

  for (const g of samples) {
    await prisma.guest.upsert({
      where: { phone: g.phone },
      update: {},
      create: {
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

  console.log("Seed complete:", {
    tables: tables.length,
    guests: samples.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
