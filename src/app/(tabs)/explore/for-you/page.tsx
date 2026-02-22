"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { GaugingCard } from "@/components/ui/GaugingCard";
import { RSVPCard } from "@/components/ui/RSVPCard";
import { useExploreContext } from "../layout";
import { INTEREST_MAP } from "../../../../../convex/matchingUtils";
import type { Id } from "../../../../../convex/_generated/dataModel";

const PAGE_SIZE = 3;

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
  const userInterests = useQuery(
    api.interests.getUserInterests,
    isAuthed ? {} : "skip"
  );
  const saveRsvp = useMutation(api.rsvps.saveRsvp);
  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null);
  const [happeningPage, setHappeningPage] = useState(0);

  // Build reverse map: eventType name → user interest canonical values
  const etMatchReasons = useMemo(() => {
    if (!userInterests || !eventTypes) return new Map<string, string>();
    const reverseMap = new Map<string, string[]>();
    for (const [interestVal, etName] of Object.entries(INTEREST_MAP)) {
      const userHas = userInterests.some((ui) => ui.canonicalValue === interestVal);
      if (userHas) {
        reverseMap.set(etName, [...(reverseMap.get(etName) ?? []), interestVal]);
      }
    }
    // Also fuzzy match for dynamically created event types
    for (const et of eventTypes) {
      if (reverseMap.has(et.name)) continue;
      const etReadable = et.name.replace(/_/g, " ");
      for (const ui of userInterests) {
        const cv = ui.canonicalValue.toLowerCase();
        if (etReadable.includes(cv) || cv.includes(etReadable)) {
          reverseMap.set(et.name, [...(reverseMap.get(et.name) ?? []), cv]);
        }
      }
    }
    // Convert to "because you like X" strings keyed by et name
    const result = new Map<string, string>();
    for (const [etName, interests] of reverseMap) {
      const unique = [...new Set(interests)];
      result.set(etName, `because you like ${unique.join(" & ")}`);
    }
    return result;
  }, [userInterests, eventTypes]);

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

  // Reset page when upcoming events data changes
  const upcomingLength = upcomingEvents?.length ?? 0;
  useEffect(() => {
    setHappeningPage(0);
  }, [upcomingLength]);

  const handleCanGo = useCallback(
    (eventId: Id<"events">) => {
      saveRsvp({ eventId, response: "can_go" });
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

  const gaugeMap = new Map(
    gauges.map((g) => [g.eventTypeId, g.response as "yes" | "no"])
  );

  // Only happeningSoon and passed — goingTo is on its own tab
  const happeningSoon = (upcomingEvents ?? []).filter((e) => !e.currentResponse);
  const passed = (upcomingEvents ?? []).filter((e) => e.currentResponse === "unavailable");

  // Pagination for happeningSoon
  const totalHappeningPages = Math.max(1, Math.ceil(happeningSoon.length / PAGE_SIZE));
  const clampedPage = Math.min(happeningPage, totalHappeningPages - 1);
  const happeningSlice = happeningSoon.slice(clampedPage * PAGE_SIZE, (clampedPage + 1) * PAGE_SIZE);

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
      {/* Happening Soon */}
      {happeningSoon.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Happening Soon
            </h2>
            {totalHappeningPages > 1 && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <button
                  onClick={() => setHappeningPage((p) => Math.max(0, p - 1))}
                  disabled={clampedPage === 0}
                  className="disabled:opacity-30 hover:text-black transition-colors"
                >
                  &lt;
                </button>
                <span>{clampedPage + 1}/{totalHappeningPages}</span>
                <button
                  onClick={() => setHappeningPage((p) => Math.min(totalHappeningPages - 1, p + 1))}
                  disabled={clampedPage >= totalHappeningPages - 1}
                  className="disabled:opacity-30 hover:text-black transition-colors"
                >
                  &gt;
                </button>
              </div>
            )}
          </div>
          {happeningSlice.map(renderEventCard)}
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
          matchReason={etMatchReasons.get(eventType.name)}
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
