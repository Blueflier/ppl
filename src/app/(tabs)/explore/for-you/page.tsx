"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { GaugingCard } from "@/components/ui/GaugingCard";

export default function ForYouPage() {
  const { isAuthed } = useAuth();
  const eventTypes = useQuery(api.eventTypes.getEventTypes);
  const gauges = useQuery(
    api.eventGauges.getUserGauges,
    isAuthed ? {} : "skip"
  );
  const saveGauge = useMutation(api.eventGauges.saveGauge);

  if (!eventTypes || !gauges) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-black dark:border-zinc-600 dark:border-t-white" />
      </div>
    );
  }

  const gaugedIds = new Set(gauges.map((g) => g.eventTypeId));
  const ungauged = eventTypes.filter((et) => !gaugedIds.has(et._id));

  if (ungauged.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-lg font-medium">You&apos;re all caught up!</p>
        <p className="mt-1 text-sm text-zinc-500">
          Check back later for new events
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {ungauged.map((eventType) => (
        <GaugingCard
          key={eventType._id}
          displayName={eventType.displayName}
          onYes={() =>
            saveGauge({
              eventTypeId: eventType._id,
              response: "yes",
            })
          }
          onNo={() =>
            saveGauge({
              eventTypeId: eventType._id,
              response: "no",
            })
          }
        />
      ))}
    </div>
  );
}
