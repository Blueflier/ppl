"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB_TABS = [
  { path: "/explore/for-you", label: "For You" },
  { path: "/explore/friends", label: "Friends" },
];

export function TopTabBar() {
  const pathname = usePathname();

  return (
    <div className="flex border-b border-zinc-200 dark:border-zinc-800">
      {SUB_TABS.map((tab) => {
        const isActive = pathname === tab.path;
        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              isActive
                ? "border-b-2 border-black text-black dark:border-white dark:text-white"
                : "text-zinc-400"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
