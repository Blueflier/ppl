"use client";

import { ReactNode } from "react";

interface IdeateLayoutProps {
  chatPanel: ReactNode;
  discoveryPanel: ReactNode;
}

export function IdeateLayout({ chatPanel, discoveryPanel }: IdeateLayoutProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr] h-[calc(100vh-5rem)] gap-0">
      <div className="overflow-hidden">
        {chatPanel}
      </div>
      <div className="border-l border-gray-200 overflow-hidden">
        {discoveryPanel}
      </div>
    </div>
  );
}
