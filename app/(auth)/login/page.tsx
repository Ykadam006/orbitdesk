import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign In | OrbitDesk",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-gray-500 dark:text-gray-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
