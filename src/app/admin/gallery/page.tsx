import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GalleryAdminClient } from "./GalleryAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  if (!(await getSession())) redirect("/admin/login");

  const photos = await prisma.guestPhoto.findMany({
    orderBy: { createdAt: "desc" }
  });

  const items = photos.map((p) => ({
    id: p.id,
    url: p.url,
    type: p.type === "video" ? ("video" as const) : ("image" as const),
    caption: p.caption,
    uploaderName: p.uploaderName,
    createdAt: p.createdAt.toISOString()
  }));

  const count = items.length;

  return (
    <div>
      <h1 className="text-3xl font-display text-stone-800">Guest Gallery</h1>
      <p className="text-stone-500 mt-1">
        {count} {count === 1 ? "upload" : "uploads"}
      </p>
      <GalleryAdminClient initialItems={items} />
    </div>
  );
}
