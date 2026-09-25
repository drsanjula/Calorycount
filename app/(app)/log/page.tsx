import { getProfile } from "@/lib/data";
import { LogFlow } from "./LogFlow";

export const metadata = { title: "Log a meal" };

export default async function LogPage() {
  const profile = await getProfile();
  return <LogFlow saveCameraPhotos={profile.save_camera_photos} />;
}
