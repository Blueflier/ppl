"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { VENUE_SUGGESTIONS } from "./discoveryConstants";

export function DiscoveryPanel() {
  // Only use interests extracted from chat — not onboarding interests
  const chatHistory = useQuery(api.ideate.getChatHistory);
  const saveRsvp = useMutation(api.rsvps.saveRsvp);

  // Collect extracted interests from chat messages
  const chatInterests = (chatHistory ?? [])
    .flatMap((m) => m.extractedInterests ?? [])
    .filter((v, i, a) => a.indexOf(v) === i); // dedupe

  const matchingEventTypes = useQuery(
    api.eventTypes.getMatchingEventTypes,
    chatInterests.length > 0 ? { interests: chatInterests } : "skip"
  );

  // Split into pending events vs interest matches
  const withActiveEvent = (matchingEventTypes ?? []).filter(
    (et) => et.activeEvent
  );
  const withoutActiveEvent = (matchingEventTypes ?? []).filter(
    (et) => !et.activeEvent
  );

  const hasContent =
    matchingEventTypes && matchingEventTypes.length > 0;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Discover
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {!hasContent ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-300 text-center leading-relaxed">
              Your matches will appear here
              <br />
              as you share interests...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Events — created by matching engine */}
            {withActiveEvent.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-sage uppercase tracking-wide">
                  New Events For You
                </h3>
                {withActiveEvent.map((et, i) => (
                  <PendingEventCard
                    key={et._id}
                    displayName={et.displayName}
                    imageUrl={et.imageUrl}
                    matchedInterests={et.matchedInterests}
                    activeEvent={et.activeEvent!}
                    onCanGo={() =>
                      saveRsvp({
                        eventId: et.activeEvent!._id as any,
                        response: "can_go",
                      })
                    }
                    onUnavailable={() =>
                      saveRsvp({
                        eventId: et.activeEvent!._id as any,
                        response: "unavailable",
                      })
                    }
                    animationDelay={i * 100}
                  />
                ))}
              </div>
            )}

            {/* Interest Matches — no event yet */}
            {withoutActiveEvent.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Interest Matches
                </h3>
                {withoutActiveEvent.map((et, i) => (
                  <DiscoveryCard
                    key={et._id}
                    eventTypeId={et._id}
                    displayName={et.displayName}
                    imageUrl={et.imageUrl}
                    interestedCount={et.interestedCount}
                    venueType={et.venueType}
                    matchedInterests={et.matchedInterests}
                    animationDelay={i * 100}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingEventCard({
  displayName,
  imageUrl,
  matchedInterests,
  activeEvent,
  onCanGo,
  onUnavailable,
  animationDelay,
}: {
  displayName: string;
  imageUrl: string | null;
  matchedInterests: string[];
  activeEvent: {
    _id: string;
    status: string;
    scheduledTime?: number;
    matchReason: string;
    venueName?: string;
    rsvpDeadline?: number;
    attendeeCount: number;
    currentResponse: "can_go" | "unavailable" | null;
  };
  onCanGo: () => void;
  onUnavailable: () => void;
  animationDelay: number;
}) {
  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return (
      d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) +
      " · " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  };

  const timeLeft = (deadline: number) => {
    const diff = deadline - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours >= 1) return `${hours}h left`;
    const mins = Math.floor(diff / (1000 * 60));
    return `${mins}m left`;
  };

  const matchReason = `because you like ${matchedInterests.join(" & ")}`;

  return (
    <div
      className="rounded-2xl border border-gray-200 p-3 animate-[fadeSlideIn_0.3s_ease-out_both]"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-center gap-3">
        {/* Square thumbnail */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="h-20 w-20 shrink-0 rounded-xl border border-gray-200 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-300">
              {displayName.charAt(0)}
            </span>
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-black leading-tight truncate">
            {displayName}
          </p>
          {activeEvent.venueName && activeEvent.scheduledTime && (
            <p className="mt-0.5 text-xs text-gray-400 truncate">
              {activeEvent.venueName} · {formatTime(activeEvent.scheduledTime)}
            </p>
          )}
          {activeEvent.attendeeCount > 0 && (
            <p className="mt-0.5 text-xs text-gray-400">
              {activeEvent.attendeeCount}{" "}
              {activeEvent.attendeeCount === 1 ? "other going" : "others going"}
            </p>
          )}
          <p className="mt-0.5 text-xs text-sage italic truncate">
            Matched: {matchReason}
          </p>
        </div>
      </div>

      {/* RSVP buttons */}
      <div className="flex gap-2 mt-3">
        {activeEvent.rsvpDeadline && (
          <span className="text-[10px] text-terra font-medium self-center mr-auto">
            {timeLeft(activeEvent.rsvpDeadline)}
          </span>
        )}
        <button
          onClick={onCanGo}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
            activeEvent.currentResponse === "can_go"
              ? "bg-sage text-white"
              : "border border-gray-200 text-black hover:bg-sage/10"
          }`}
        >
          Can Go
        </button>
        <button
          onClick={onUnavailable}
          className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
            activeEvent.currentResponse === "unavailable"
              ? "bg-gray-600 text-white"
              : "border border-gray-200 text-black hover:bg-gray-50"
          }`}
        >
          Unavailable
        </button>
      </div>
    </div>
  );
}

function DiscoveryCard({
  eventTypeId,
  displayName,
  imageUrl,
  interestedCount,
  venueType,
  matchedInterests,
  animationDelay,
}: {
  eventTypeId: string;
  displayName: string;
  imageUrl: string | null;
  interestedCount: number;
  venueType: string;
  matchedInterests: string[];
  animationDelay: number;
}) {
  const venue = VENUE_SUGGESTIONS[venueType];
  const href = `/event-type/${eventTypeId}`;

  return (
    <div
      className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3 animate-[fadeSlideIn_0.3s_ease-out_both]"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Square thumbnail */}
      <Link href={href} className="shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="h-20 w-20 rounded-xl object-cover hover:opacity-80 transition-opacity"
          />
        ) : (
          <div className="h-20 w-20 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <span className="text-2xl font-bold text-gray-300">
              {displayName.charAt(0)}
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={href}>
          <p className="text-sm font-semibold text-black leading-tight truncate hover:text-sage transition-colors">
            {displayName}
          </p>
        </Link>

        <div className="mt-1 flex items-center gap-2">
          <div className="flex -space-x-1.5">
            {Array.from({ length: Math.min(interestedCount, 4) }).map(
              (_, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full bg-sage/20 border-2 border-white"
                />
              )
            )}
          </div>
          <span className="text-xs text-gray-400">
            {interestedCount > 0
              ? `${interestedCount} interested`
              : "Be the first!"}
          </span>
        </div>

        {venue && (
          <p className="mt-1 text-xs text-gray-400 truncate">{venue.name}</p>
        )}

        <p className="mt-1 text-xs text-sage italic truncate">
          Matched: because you like {matchedInterests.join(" & ")}
        </p>
      </div>
    </div>
  );
}
