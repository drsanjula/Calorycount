import { logout } from "@/app/login/actions";
import { PageHeader } from "@/components/ui";

export default function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" subtitle="More settings coming in a later step." />
      <form action={logout}>
        <button className="btn-outline">Log out</button>
      </form>
    </div>
  );
}
