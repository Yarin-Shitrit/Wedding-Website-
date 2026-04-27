import { redirect } from "next/navigation";

export default function InfoPage() {
  // Parking, dress code, and FAQ now live on the home page.
  redirect("/#parking");
}
