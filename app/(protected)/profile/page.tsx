import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "Profile | OrbitDesk",
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <ProfileClient
      user={{
        id: session.user.id,
        name: session.user.name || "",
        email: session.user.email || "",
        image: session.user.image || "",
      }}
    />
  );
}
