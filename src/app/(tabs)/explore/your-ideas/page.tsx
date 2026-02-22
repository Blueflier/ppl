"use client";

import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useExploreContext } from "../layout";

export default function YourIdeasPage() {
  const { isAuthed } = useAuth();
  const { setVisibleEventIds } = useExploreContext();
  const ideatedEventTypes = useQuery(
    api.eventTypes.getUserIdeatedEventTypes,
    isAuthed ? {} : "skip"
  );

  // Your Ideas tab has no map events
  useEffect(() => {
    setVisibleEventIds(new Set());
  }, [setVisibleEventIds]);

  if (!ideatedEventTypes) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
      </div>
    );
  }

  if (ideatedEventTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <p className="text-sm text-gray-400">
          No ideas yet. Chat in Ideate to suggest events!
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {ideatedEventTypes.map((et) => (
        <a
          key={et._id}
          href={`/event-type/${et._id}`}
          className="flex items-center gap-3 rounded-2xl border border-sage/20 bg-sage/5 p-3 hover:bg-sage/10 transition-colors"
        >
          {et.imageUrl ? (
            <img
              src={et.imageUrl}
              alt={et.displayName}
              className="h-12 w-12 rounded-xl object-cover"
            />
          ) : (
            <div className="h-12 w-12 rounded-xl bg-sage/10 flex items-center justify-center">
              <span className="text-lg font-bold text-sage/40">
                {et.displayName.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black truncate">
              {et.displayName}
            </p>
            <p className="text-xs text-gray-400">
              {et.interestedCount} interested{et.hasActiveEvent ? " · event scheduled" : ""}
            </p>
          </div>
          <span className="text-xs text-sage font-medium shrink-0">Your idea</span>
        </a>
      ))}
    </div>
  );
}
