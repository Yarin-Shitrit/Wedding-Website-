import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
      venueMapUrl: "https://www.google.com/maps/search/?api=1&query=דרך+השדרות+12+רעננה",
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

  // Moments
  const moments = [
    {
      chapter: "I",
      year: "2021",
      title: "המפגש הראשון",
      body: "ערב חורף בתל-אביב. שיחה על מוזיקה שהפכה ללילה ארוך.",
      imageAlt: "first meeting — café tel-aviv, dec 2021",
      order: 1
    },
    {
      chapter: "II",
      year: "2023",
      title: "הטיול לאיטליה",
      body: "שלושה שבועות, שש ערים, אינסוף פסטה. שם הבנו שזה זה.",
      imageAlt: "italy trip — cinque terre, golden hour",
      order: 2
    },
    {
      chapter: "III",
      year: "2024",
      title: "הדירה הראשונה",
      body: "מפתחות ביד, קרטון על הגב, מנורה אחת בסלון. ובית.",
      imageAlt: "first apartment — moving day, july 2024",
      order: 3
    },
    {
      chapter: "IV",
      year: "2025",
      title: "ההצעה",
      body: "על המצוק במכתש רמון, שקיעה כתומה, ברך אחת. כן.",
      imageAlt: "the proposal — mitzpe ramon, sunset",
      order: 4
    }
  ];
  for (const m of moments) {
    await prisma.moment.upsert({
      where: { id: `seed-moment-${m.order}` },
      update: m,
      create: { id: `seed-moment-${m.order}`, ...m }
    });
  }

  // Gallery
  const gallery = [
    { alt: "morning coffee — saturday", ratio: "5/6", span: 2, order: 1 },
    { alt: "balcony, jerusalem", ratio: "1/1", span: 1, order: 2 },
    { alt: "wedding-dress fitting", ratio: "1/1", span: 1, order: 3 },
    { alt: "tuscany road trip — 2024", ratio: "5/6", span: 1, order: 4 },
    { alt: "engagement night", ratio: "1/1", span: 1, order: 5 },
    { alt: "rooftop, sept 2025", ratio: "1/1", span: 2, order: 6 },
    { alt: "dog park, kfar saba", ratio: "5/6", span: 1, order: 7 },
    { alt: "first dance rehearsal", ratio: "1/1", span: 1, order: 8 },
    { alt: "mom's kitchen — friday", ratio: "1/1", span: 1, order: 9 }
  ];
  for (const g of gallery) {
    await prisma.galleryItem.upsert({
      where: { id: `seed-gallery-${g.order}` },
      update: g,
      create: { id: `seed-gallery-${g.order}`, ...g }
    });
  }

  // Schedule
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

  // FAQ
  const faq = [
    {
      question: "מותר לבוא עם ילדים?",
      answer:
        "כן! יש פינת ילדים עם בייביסיטר משעה 19:00. נשמח לדעת מראש כמה ילדים מצטרפים בעת אישור ההגעה.",
      order: 1
    },
    {
      question: "יש אופציות צמחוניות / טבעוניות / ללא גלוטן?",
      answer: "כן, לכל המנות. ציינו זאת בטופס אישור ההגעה ונדאג לכם.",
      order: 2
    },
    {
      question: "האם אפשר לישון באזור?",
      answer:
        "מספר מלונות בקרבת מקום: דן רעננה (3 דק׳), Indigo כפר סבא (8 דק׳). כדאי להזמין מראש.",
      order: 3
    },
    {
      question: "מה לגבי מתנה?",
      answer:
        "הנוכחות שלכם היא המתנה הטובה ביותר. למי שירצה — תהיה תיבת מעטפות בכניסה.",
      order: 4
    },
    {
      question: "מה אם אני בורח/ת ברגע האחרון?",
      answer:
        "נצטער אבל נבין. אנא עדכנו אותנו עד 12.10 כדי שנוכל לתכנן בהתאם.",
      order: 5
    }
  ];
  for (const f of faq) {
    await prisma.faqItem.upsert({
      where: { id: `seed-faq-${f.order}` },
      update: f,
      create: { id: `seed-faq-${f.order}`, ...f }
    });
  }

  // Tables
  const tableA = await prisma.table.upsert({
    where: { name: "שולחן 1" },
    update: {},
    create: { name: "שולחן 1", capacity: 10, notes: "משפחת אילי" }
  });
  const tableB = await prisma.table.upsert({
    where: { name: "שולחן 2" },
    update: {},
    create: { name: "שולחן 2", capacity: 10, notes: "משפחת ירין" }
  });

  await prisma.guest.upsert({
    where: { rsvpToken: "demo-michal" },
    update: {},
    create: {
      firstName: "מיכל",
      lastName: "כהן",
      phone: "0501234567",
      side: "BRIDE",
      group: "חברים",
      seatsInvited: 2,
      seatsConfirmed: 0,
      status: "PENDING",
      rsvpToken: "demo-michal",
      tableId: tableA.id
    }
  });

  await prisma.guest.upsert({
    where: { rsvpToken: "demo-daniel" },
    update: {},
    create: {
      firstName: "דניאל",
      lastName: "לוי",
      phone: "0529999999",
      side: "GROOM",
      group: "משפחה",
      seatsInvited: 4,
      seatsConfirmed: 3,
      status: "ATTENDING",
      rsvpToken: "demo-daniel",
      tableId: tableB.id,
      respondedAt: new Date("2026-04-12T20:00:00+03:00")
    }
  });

  await prisma.guest.upsert({
    where: { rsvpToken: "demo-noa" },
    update: {},
    create: {
      firstName: "נועה",
      lastName: "אברהם",
      phone: "0508887777",
      side: "SHARED",
      group: "עבודה",
      seatsInvited: 1,
      seatsConfirmed: 0,
      status: "PENDING",
      rsvpToken: "demo-noa"
    }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
