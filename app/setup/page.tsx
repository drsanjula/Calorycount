import { redirect } from "next/navigation";
import { BodyStatsForm } from "@/components/BodyStatsForm";
import { Logo } from "@/components/Logo";
import { getProfile, today } from "@/lib/data";
import { completeSetup } from "../profileActions";

export const dynamic = "force-dynamic";

export const metadata = { title: "Set up" };

export default async function SetupPage() {
  const profile = await getProfile();
  if (profile.onboarded) redirect("/");
  return (
    <main className="mx-auto max-w-md px-4 pt-6 pb-10">
      <Logo />
      <h1 className="h-display mt-5">Let’s personalize your plan</h1>
      <p className="mt-2 mb-5 text-muted">Tell us a bit about yourself to get your daily targets.</p>
      <BodyStatsForm
        today={today()}
        submitLabel="Continue →"
        onSubmit={completeSetup}
        defaults={{
          date_of_birth: "",
          sex: "male",
          height_cm: "",
          weight_kg: "",
          activity_level: "light",
          goal: "maintain",
          pace_kg_per_week: 0.5,
        }}
      />
    </main>
  );
}
