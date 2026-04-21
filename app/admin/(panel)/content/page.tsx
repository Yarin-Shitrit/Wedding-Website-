import { prisma } from "@/lib/db";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

const KEYS = ["hero", "story", "venue", "parking", "gift"] as const;

export default async function AdminContentPage() {
  const blocks = await prisma.contentBlock.findMany();
  const byKey = Object.fromEntries(blocks.map((b) => [b.key, b.valueJson]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{he.admin.content}</h1>
      </header>

      <div className="space-y-6">
        {KEYS.map((k) => (
          <ContentEditor
            key={k}
            blockKey={k}
            initial={(byKey[k] as Record<string, unknown>) ?? {}}
          />
        ))}
      </div>
    </div>
  );
}
