"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { SideNav } from "@/components/ui/BottomTabBar";

export default function TabsLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthed, isLoading, onboardingComplete } = useAuth();
  const isFullWidth = pathname === "/ideate" || pathname.startsWith("/explore") || pathname === "/me";

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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <SideNav />
      <div className={`ml-16 flex-1 ${isFullWidth ? "" : "max-w-2xl mx-auto"}`}>
        {children}
      </div>
    </div>
  );
}
