import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { getProfile } from "@/lib/data";

// Every page reads live data from Supabase.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile.onboarded) redirect("/setup");
  return (
    <>
      <main className="mx-auto max-w-md px-4 pt-4 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
