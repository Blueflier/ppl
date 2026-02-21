"use client";

import { createContext, useContext, useState } from "react";
import { TopTabBar } from "@/components/ui/TopTabBar";
import { EventMap } from "@/components/ui/EventMap";
import { Id } from "../../../../convex/_generated/dataModel";

interface ExploreContextType {
  selectedEventId: Id<"events"> | null;
  setSelectedEventId: (id: Id<"events"> | null) => void;
}

const ExploreContext = createContext<ExploreContextType>({
  selectedEventId: null,
  setSelectedEventId: () => {},
});

export function useExploreContext() {
  return useContext(ExploreContext);
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [selectedEventId, setSelectedEventId] = useState<Id<"events"> | null>(
    null
  );

  return (
    <ExploreContext.Provider value={{ selectedEventId, setSelectedEventId }}>
      <div className="flex flex-col h-screen">
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="px-4 pt-4 pb-1">
            <p className="text-xs font-medium text-black/50 tracking-wide uppercase">
              San Francisco
            </p>
            <h1 className="text-xl font-bold text-black">Discover Events</h1>
            <p className="text-sm text-black/50">
              Explore popular events near you
            </p>
          </div>
          <TopTabBar />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-1/2 overflow-y-auto">{children}</div>
          <div className="w-1/2">
            <EventMap
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
            />
          </div>
        </div>
      </div>
    </ExploreContext.Provider>
  );
}
