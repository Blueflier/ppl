"use client";

import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { GaugingCard } from "@/components/ui/GaugingCard";
import { RSVPCard } from "@/components/ui/RSVPCard";
import { useExploreContext } from "../layout";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function ForYouPage() {
  const { isAuthed } = useAuth();
  const { selectedEventId } = useExploreContext();
  const eventTypes = useQuery(api.eventTypes.getEventTypes);
  const gauges = useQuery(
    api.eventGauges.getUserGauges,
    isAuthed ? {} : "skip"
  );
  const upcomingEvents = useQuery(
    api.events.getUpcomingEvents,
    isAuthed ? {} : "skip"
  );
  const saveGauge = useMutation(api.eventGauges.saveGauge);
  const saveRsvp = useMutation(api.rsvps.saveRsvp);

  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedEventId) {
      document
        .getElementById(`event-${selectedEventId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedEventId]);

  // After re-render with the card in "Going To", scroll to it
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
      // Small delay so confetti fires first, then mark for scroll
      setTimeout(() => setJustConfirmedId(eventId), 300);
    },
    [saveRsvp]
  );

  if (!eventTypes || !gauges) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
      </div>
    );
  }

  // Build a map of eventTypeId → response for gauging cards
  const gaugeMap = new Map(
    gauges.map((g) => [g.eventTypeId, g.response as "yes" | "no"])
  );

  // Split upcoming events into sections
  const goingTo = (upcomingEvents ?? []).filter((e) => e.currentResponse === "can_go");
  const happeningSoon = (upcomingEvents ?? []).filter((e) => !e.currentResponse);
  const passed = (upcomingEvents ?? []).filter((e) => e.currentResponse === "unavailable");

  const renderEventCard = (event: NonNullable<typeof upcomingEvents>[number]) => (
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
        onUnavailable={() => saveRsvp({ eventId: event._id, response: "unavailable" })}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Going To */}
      {goingTo.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-sage uppercase tracking-wide">
            Going To
          </h2>
          {goingTo.map(renderEventCard)}
        </>
      )}

      {/* Happening Soon */}
      {happeningSoon.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Happening Soon
          </h2>
          {happeningSoon.map(renderEventCard)}
        </>
      )}

      {/* Gauging Section */}
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        What interests you?
      </h2>
      {eventTypes.map((eventType) => (
        <GaugingCard
          key={eventType._id}
          displayName={eventType.displayName}
          imageUrl={eventType.imageUrl}
          currentResponse={gaugeMap.get(eventType._id) ?? null}
          href={`/event-type/${eventType._id}`}
          onYes={() =>
            saveGauge({ eventTypeId: eventType._id, response: "yes" })
          }
          onNo={() =>
            saveGauge({ eventTypeId: eventType._id, response: "no" })
          }
        />
      ))}

      {/* Passed */}
      {passed.length > 0 && (
        <>
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mt-4">
            Passed
          </h2>
          <div className="opacity-60">
            {passed.map(renderEventCard)}
          </div>
        </>
      )}
    </div>
  );
}
