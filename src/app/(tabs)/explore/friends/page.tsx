"use client";

import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import Link from "next/link";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useExploreContext } from "../layout";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return (
    d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
    " · " +
    d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  );
}

export default function FriendsPage() {
  const { isAuthed } = useAuth();
  const { selectedEventId, setSelectedEventId, setVisibleEventIds } = useExploreContext();
  const friendEvents = useQuery(
    api.rsvps.getFriendEvents,
    isAuthed ? {} : "skip"
  );
  const saveRsvp = useMutation(api.rsvps.saveRsvp);

  useEffect(() => {
    if (!friendEvents) return;
    setVisibleEventIds(new Set(friendEvents.map((e) => e._id)));
  }, [friendEvents, setVisibleEventIds]);

  if (friendEvents === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
      </div>
    );
  }

  if (friendEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <p className="text-lg font-medium text-black">No friends going to events yet</p>
        <p className="mt-1 text-sm text-gray-400">
          When your friends RSVP to events, they&apos;ll show up here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
        Friends&apos; Events
      </h2>
      {friendEvents.map((event) => (
        <div
          key={event._id}
          className={`flex items-stretch gap-3 rounded-2xl border border-gray-200 p-3 cursor-pointer transition-shadow ${
            selectedEventId === event._id ? "ring-2 ring-sage shadow-lg" : ""
          }`}
          onClick={() => setSelectedEventId(event._id)}
        >
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.eventName}
              className="h-20 w-20 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="h-20 w-20 shrink-0 rounded-xl border border-gray-200 flex items-center justify-center">
              <span className="text-2xl font-bold text-gray-300">
                {event.eventName.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-black leading-tight truncate">
                {event.eventName}
              </p>
              <Link
                href={`/event-type/${event.eventTypeId}`}
                className="text-xs font-medium text-blue shrink-0 hover:underline"
              >
                More Info &rsaquo;
              </Link>
            </div>
            {(event.venueName || event.scheduledTime) && (
              <p className="mt-0.5 text-xs text-gray-400 truncate">
                {[event.venueName, event.scheduledTime ? formatTime(event.scheduledTime) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-0.5 text-xs text-sage font-medium">
              {event.friendNames.join(", ")} {event.friendNames.length === 1 ? "is" : "are"} going
            </p>
          </div>
          <button
            onClick={() =>
              saveRsvp({
                eventId: event._id,
                response: event.currentResponse === "can_go" ? "unavailable" : "can_go",
              })
            }
            className="shrink-0 self-stretch w-20 rounded-lg border border-gray-200 flex flex-col items-stretch overflow-hidden relative"
          >
            {/* Sliding background */}
            <div
              className={`absolute inset-x-0 h-1/2 rounded-md mx-0.5 transition-all duration-300 ease-in-out ${
                event.currentResponse === "can_go"
                  ? "top-0.5 bg-green-600"
                  : "top-[calc(50%-2px)] bg-red-500"
              }`}
            />
            {/* Going label */}
            <div
              className={`flex-1 flex items-center justify-center text-[10px] font-semibold z-10 transition-colors duration-300 ${
                event.currentResponse === "can_go" ? "text-white" : "text-gray-400"
              }`}
            >
              I&apos;m In
            </div>
            {/* Not Going label */}
            <div
              className={`flex-1 flex items-center justify-center text-[10px] font-semibold z-10 transition-colors duration-300 ${
                event.currentResponse !== "can_go" ? "text-white" : "text-gray-400"
              }`}
            >
              Pass
            </div>
          </button>
        </div>
      ))}
    </div>
  );
}
