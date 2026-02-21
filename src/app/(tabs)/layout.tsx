"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { BottomTabBar } from "@/components/ui/BottomTabBar";

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthed, isLoading, onboardingComplete } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthed) {
      router.replace("/login");
    } else if (!onboardingComplete) {
      router.replace("/onboarding");
    }
  }, [isAuthed, isLoading, onboardingComplete, router]);

  if (isLoading || !isAuthed || !onboardingComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-black dark:border-zinc-600 dark:border-t-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomTabBar />
    </div>
  );
}
