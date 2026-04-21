import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const SettingsInput = z.object({
  brideName: z.string().min(1),
  groomName: z.string().min(1),
  weddingDate: z.string().datetime(),
  venueName: z.string().default(""),
  venueAddress: z.string().default(""),
  venueMapUrl: z.string().default(""),
  parkingInfo: z.string().default(""),
  dressCode: z.string().default(""),
  welcomeMessage: z.string().default("")
});

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = SettingsInput.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = {
    ...parsed.data,
    weddingDate: new Date(parsed.data.weddingDate)
  };
  const saved = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data }
  });
  return NextResponse.json(saved);
}
