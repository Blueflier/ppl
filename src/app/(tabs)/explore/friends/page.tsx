"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";

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
  const friendEvents = useQuery(
    api.rsvps.getFriendEvents,
    isAuthed ? {} : "skip"
  );
  const saveRsvp = useMutation(api.rsvps.saveRsvp);

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
          className="flex items-start gap-3 rounded-2xl border border-gray-200 p-3"
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
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black leading-tight truncate">
              {event.eventName}
            </p>
            {(event.venueName || event.scheduledTime) && (
              <p className="mt-0.5 text-xs text-gray-400 truncate">
                {[event.venueName, event.scheduledTime ? formatTime(event.scheduledTime) : null]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            <p className="mt-1 text-xs text-sage font-medium">
              {event.friendNames.join(", ")} {event.friendNames.length === 1 ? "is" : "are"} going
            </p>
            <button
              onClick={() => saveRsvp({ eventId: event._id, response: "can_go" })}
              className="mt-2 w-full rounded-lg bg-sage py-1.5 text-xs font-medium text-white hover:bg-sage/90 transition-colors"
            >
              I&apos;m In
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
