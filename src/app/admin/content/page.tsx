import { ContentClient } from "./ContentClient";
import {
  getMoments,
  getGalleryItems,
  getScheduleItems,
  getFaqItems
} from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [moments, gallery, schedule, faq] = await Promise.all([
    getMoments(),
    getGalleryItems(),
    getScheduleItems(),
    getFaqItems()
  ]);

  return (
    <div>
      <h1
        className="display"
        style={{ fontSize: 28, color: "var(--ink)", margin: 0 }}
      >
        Content
      </h1>
      <p style={{ color: "var(--ink-3)", marginTop: 4, fontSize: 14 }}>
        Edit the moments timeline, gallery, schedule, and FAQ. All sortable by
        the <code>order</code> field (lowest first).
      </p>
      <div style={{ marginTop: 24 }}>
        <ContentClient
          initialMoments={moments}
          initialGallery={gallery}
          initialSchedule={schedule}
          initialFaq={faq}
        />
      </div>
    </div>
  );
}
