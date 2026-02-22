"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { RSVPCard } from "@/components/ui/RSVPCard";
import { useExploreContext } from "../layout";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function GoingToPage() {
  const { isAuthed } = useAuth();
  const { selectedEventId } = useExploreContext();
  const upcomingEvents = useQuery(
    api.events.getUpcomingEvents,
    isAuthed ? {} : "skip"
  );
  const saveRsvp = useMutation(api.rsvps.saveRsvp);
  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEventId) {
      document
        .getElementById(`event-${selectedEventId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (justConfirmedId) {
      const el = document.getElementById(`event-${justConfirmedId}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
        setTimeout(() => setJustConfirmedId(null), 1500);
      }
    }
  }, [justConfirmedId, upcomingEvents]);

  const handleCanGo = useCallback(
    (eventId: Id<"events">) => {
      saveRsvp({ eventId, response: "can_go" });
      setTimeout(() => setJustConfirmedId(eventId), 300);
    },
    [saveRsvp]
  );

  if (!upcomingEvents) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
      </div>
    );
  }

  const goingTo = upcomingEvents.filter((e) => e.currentResponse === "can_go");

  if (goingTo.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <p className="text-sm text-gray-400">
          No events yet. RSVP to events in For You to see them here!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {goingTo.map((event) => (
        <div
          key={event._id}
          className={`rounded-2xl transition-shadow ${
            selectedEventId === event._id ? "ring-2 ring-sage shadow-lg" : ""
          }`}
          id={`event-${event._id}`}
        >
          <RSVPCard
            eventName={event.eventName}
            imageUrl={event.imageUrl}
            venueName={event.venueName}
            scheduledTime={event.scheduledTime}
            attendeeCount={event.attendeeCount}
            matchReason={event.matchReason}
            hostName={event.hostName}
            rsvpDeadline={event.rsvpDeadline}
            currentResponse={event.currentResponse}
            isJustConfirmed={justConfirmedId === event._id}
            detailHref={`/event-type/${event.eventTypeId}`}
            onCanGo={() => handleCanGo(event._id)}
            onUnavailable={() =>
              saveRsvp({ eventId: event._id, response: "unavailable" })
            }
          />
        </div>
      ))}
    </div>
  );
}
