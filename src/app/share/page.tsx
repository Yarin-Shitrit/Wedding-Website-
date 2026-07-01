import { redirect } from "next/navigation";

// The guest gallery now lives at the site root. Keep the /share URL alive so
// old QR codes and shared links land guests on the homepage gallery.
export const dynamic = "force-dynamic";

export default function SharePage() {
  redirect("/");
}
