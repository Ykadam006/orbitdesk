"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";
import { apiFetch } from "@/lib/fetch-client";

interface Props {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

export function ProfileClient({ user }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { update: updateSession } = useSession();
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState(user.image);
  const [imageError, setImageError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      await apiFetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: image || null }),
      });
      await updateSession({ name });
      toast("Profile updated successfully", "success");
      router.refresh();
    } catch {
      toast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  }

  const showImage = image && !imageError;

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">Profile</h1>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center overflow-hidden shrink-0">
            {showImage ? (
              <Image
                src={image}
                alt={name || "Profile"}
                fill
                className="object-cover"
                unoptimized
                onError={() => setImageError(true)}
              />
            ) : (
              <User className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.name || "No name set"}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="profile-name"
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            minLength={2}
            required
          />
          <Input
            id="profile-image"
            label="Avatar URL"
            value={image}
            onChange={(e) => {
              setImage(e.target.value);
              setImageError(false);
            }}
            placeholder="https://example.com/avatar.jpg"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-700">
              {user.email}
            </p>
          </div>
          <div className="pt-2">
            <Button type="submit" isLoading={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
