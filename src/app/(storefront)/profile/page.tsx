import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";

export const metadata: Metadata = {
  title: "My account",
  description: "Manage your profile, phone number, and password.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
