import { redirect } from "next/navigation";

// The SnapFinder selfie face-match flow has been retired (the service is no
// longer fed by admin uploads). Keep the /photos URL alive — old links and any
// printed QR codes now lead guests to the shared guest gallery instead.
export const dynamic = "force-dynamic";

export default function PhotosPage() {
  redirect("/share");
}
