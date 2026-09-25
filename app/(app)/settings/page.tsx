import { logout } from "@/app/login/actions";
import { ChevronRight, LogoutIcon } from "@/components/icons";
import { Logo } from "@/components/Logo";
import { BodyStatsCard } from "@/components/settings/BodyStatsCard";
import { GoalNoteCard, PhotosCard, ToneCard } from "@/components/settings/Preferences";
import { TargetsCard } from "@/components/settings/TargetsCard";
import { PageHeader } from "@/components/ui";
import { bodyProfile, getProfile, latestWeight, liveTargets, today } from "@/lib/data";
import type { Pace } from "@/lib/targets";
import { ageOn } from "@/lib/time";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const [profile, weight] = await Promise.all([getProfile(), latestWeight()]);
  const targets = await liveTargets(profile);
  const body = bodyProfile(profile);
  const day = today();

  return (
    <div className="space-y-4">
      <Logo />
      <PageHeader title="Settings" subtitle="Personalize your plan and preferences." />

      {body && (
        <BodyStatsCard
          age={ageOn(body.date_of_birth, day)}
          today={day}
          overrides={profile.overrides}
          defaults={{
            date_of_birth: body.date_of_birth,
            sex: body.sex,
            height_cm: String(body.height_cm),
            weight_kg: weight === null ? "" : String(weight),
            activity_level: body.activity_level,
            goal: body.goal,
            pace_kg_per_week: ([0.25, 0.5, 0.75].includes(body.pace_kg_per_week ?? 0) ? body.pace_kg_per_week : 0.5) as Pace,
          }}
        />
      )}

      {targets && body && <TargetsCard targets={targets} sex={body.sex} />}

      <GoalNoteCard initial={profile.goal_note ?? ""} />
      <ToneCard initial={profile.review_tone} />
      <PhotosCard initial={profile.save_camera_photos} />

      <form action={logout} className="card p-0">
        <button className="flex w-full items-center gap-3 p-4 text-left">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <LogoutIcon className="h-6 w-6" />
          </span>
          <span className="flex-1">
            <span className="block text-lg font-bold">Log out</span>
            <span className="block text-sm text-muted">Sign out on this device.</span>
          </span>
          <ChevronRight className="h-5 w-5 text-muted" />
        </button>
      </form>
    </div>
  );
}
