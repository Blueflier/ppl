"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import Link from "next/link";

export default function EventTypeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const detail = useQuery(api.eventTypes.getEventTypeDetail, {
    eventTypeId: id as Id<"eventTypes">,
  });

  if (detail === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-sage/30 border-t-sage" />
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Event type not found.</p>
        <Link href="/explore" className="text-sage text-sm mt-2 inline-block">
          Back to Explore
        </Link>
      </div>
    );
  }

  const sinceDate = detail.createdAt
    ? new Date(detail.createdAt).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-5">
      {/* Back link */}
      <Link
        href="/explore"
        className="text-sm text-gray-400 hover:text-black transition-colors"
      >
        &larr; Back
      </Link>

      {/* Hero image */}
      <div className="flex justify-center">
        {detail.imageUrl ? (
          <img
            src={detail.imageUrl}
            alt={detail.displayName}
            className="w-64 h-64 rounded-2xl object-cover"
          />
        ) : (
          <div className="w-64 h-64 rounded-2xl bg-gradient-to-br from-sage/30 to-peach/40 flex items-center justify-center">
            <span className="text-6xl font-bold text-white/70">
              {detail.displayName.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Title + description */}
      <div>
        <h1 className="text-3xl font-bold text-black">
          {detail.displayName}
        </h1>
        {detail.description && (
          <p className="text-base text-gray-500 mt-1">{detail.description}</p>
        )}
      </div>

      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-sage/15 text-sage">
          {detail.yesCount} interested
        </span>
        {sinceDate && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-500">
            since {sinceDate}
          </span>
        )}
      </div>

      {/* Active event */}
      {detail.activeEvent && (
        <div className="rounded-2xl border-2 border-sage/30 bg-sage/5 p-4">
          <h2 className="text-sm font-semibold text-sage uppercase tracking-wide mb-2">
            Active event
          </h2>
          <p className="text-sm text-black">
            Status:{" "}
            <span className="font-medium">
              {detail.activeEvent.status.replace(/_/g, " ")}
            </span>
          </p>
          {detail.activeEvent.scheduledTime && (
            <p className="text-sm text-gray-500 mt-1">
              Scheduled:{" "}
              {new Date(detail.activeEvent.scheduledTime).toLocaleDateString(
                "en-US",
                { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }
              )}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
