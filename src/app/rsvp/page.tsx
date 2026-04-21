import { SiteNav } from "@/components/SiteNav";
import { RsvpForm } from "./RsvpForm";
import { prisma } from "@/lib/prisma";

export default async function RsvpPage({
  searchParams
}: {
  searchParams: { token?: string; phone?: string };
}) {
  let guest = null as Awaited<ReturnType<typeof prisma.guest.findUnique>> | null;
  if (searchParams.token) {
    guest = await prisma.guest.findUnique({ where: { rsvpToken: searchParams.token } });
  } else if (searchParams.phone) {
    guest = await prisma.guest.findUnique({ where: { phone: searchParams.phone } });
  }

  return (
    <>
      <SiteNav />
      <main className="max-w-xl mx-auto px-6 py-16">
        <h1 className="text-4xl text-rose-600 text-center">RSVP</h1>
        <p className="mt-2 text-center text-stone-600">
          Please confirm your attendance. You can come back to update this any time.
        </p>
        <div className="mt-8 card">
          <RsvpForm guest={guest} />
        </div>
      </main>
    </>
  );
}
