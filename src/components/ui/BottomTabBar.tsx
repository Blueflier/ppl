"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

const TABS = [
  {
    path: "/explore",
    label: "Explore",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-sage" : "text-gray-400"}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    path: "/ideate",
    label: "Ideate",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-sage" : "text-gray-400"}>
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
        <path d="M18 14l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
      </svg>
    ),
  },
  {
    path: "/me",
    label: "Me",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-sage" : "text-gray-400"}>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function SideNav() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className="fixed left-0 top-0 bottom-0 z-50 w-16 bg-white border-r border-gray-200 flex flex-col items-center pt-6 gap-2">
      {TABS.map((tab) => {
        const isActive =
          pathname === tab.path || pathname.startsWith(tab.path + "/");
        return (
          <Link
            key={tab.path}
            href={tab.path}
            data-tab={tab.label.toLowerCase()}
            className={`flex flex-col items-center gap-1 py-3 w-full text-xs font-medium transition-colors ${
              isActive ? "text-sage" : "text-gray-400"
            }`}
          >
            {tab.icon(isActive)}
            {tab.label}
          </Link>
        );
      })}
      <div className="flex-1" />
      <button
        onClick={logout}
        className="mb-4 flex flex-col items-center gap-1 py-2 w-full text-xs font-medium text-gray-400 hover:text-terra transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Log out
      </button>
    </nav>
  );
}
