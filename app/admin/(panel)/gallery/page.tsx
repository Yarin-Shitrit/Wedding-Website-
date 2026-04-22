import { prisma } from "@/lib/db";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const photos = await prisma.photo.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{he.admin.gallery.pageTitle}</h1>
        <p className="text-sm text-ink/60 mt-1">
          {he.admin.gallery.pageHelp}
        </p>
      </header>
      <GalleryManager initial={photos} />
    </div>
  );
}
