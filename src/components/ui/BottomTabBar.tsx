"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    path: "/explore",
    label: "Explore",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    path: "/ideate",
    label: "Ideate",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
        <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
      </svg>
    ),
  },
  {
    path: "/me",
    label: "Me",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "currentColor" : "#a1a1aa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.path || pathname.startsWith(tab.path + "/");
          return (
            <Link
              key={tab.path}
              href={tab.path}
              data-tab={tab.label.toLowerCase()}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                isActive
                  ? "text-black dark:text-white"
                  : "text-zinc-400"
              }`}
            >
              {tab.icon(isActive)}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
