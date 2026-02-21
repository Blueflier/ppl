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

  const rolesText = detail.requiredRoles
    .map((r) => `${r.role} (${r.min}${r.max ? `-${r.max}` : "+"})`)
    .join(", ");

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      {/* Back link */}
      <Link
        href="/explore"
        className="text-sm text-gray-400 hover:text-black transition-colors"
      >
        &larr; Back
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        {detail.imageUrl ? (
          <img
            src={detail.imageUrl}
            alt={detail.displayName}
            className="h-24 w-24 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <div className="h-24 w-24 shrink-0 rounded-2xl border border-gray-200 flex items-center justify-center bg-gray-50">
            <span className="text-3xl font-bold text-gray-300">
              {detail.displayName.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-black">
            {detail.displayName}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {detail.venueType.replace(/_/g, " ")} &middot; {rolesText}
          </p>
          {detail.hostRequired && (
            <span className="inline-block mt-1 text-xs bg-peach/30 text-terra px-2 py-0.5 rounded-full">
              Host required
            </span>
          )}
        </div>
      </div>

      {/* Interest Stats */}
      <div className="rounded-2xl border border-gray-200 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Interest
        </h2>
        <div className="flex gap-6">
          <div>
            <p className="text-3xl font-bold text-sage">{detail.yesCount}</p>
            <p className="text-xs text-gray-400">interested</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-300">{detail.noCount}</p>
            <p className="text-xs text-gray-400">passed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-black">{detail.totalGauges}</p>
            <p className="text-xs text-gray-400">total responses</p>
          </div>
        </div>

        {/* Timeline bar chart grouped by week with month labels */}
        {detail.gaugeTimeline.length > 0 && (() => {
          // Group daily data into weeks
          const weeks: { weekLabel: string; monthLabel: string; yes: number; no: number }[] = [];
          const weekMap = new Map<string, { yes: number; no: number; date: Date }>();
          for (const day of detail.gaugeTimeline) {
            const d = new Date(day.date);
            // Week key = ISO week start (Monday)
            const mon = new Date(d);
            mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
            const wk = mon.toISOString().split("T")[0];
            const existing = weekMap.get(wk) ?? { yes: 0, no: 0, date: mon };
            existing.yes += day.yes;
            existing.no += day.no;
            weekMap.set(wk, existing);
          }
          for (const [key, val] of Array.from(weekMap.entries()).sort()) {
            const d = val.date;
            weeks.push({
              weekLabel: key,
              monthLabel: d.toLocaleDateString("en-US", { month: "short" }),
              yes: val.yes,
              no: val.no,
            });
          }
          const maxTotal = Math.max(...weeks.map((w) => w.yes + w.no));

          // Determine which bars should show a month label (first bar of each month)
          let lastMonth = "";

          return (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Interest over time</p>
              <div className="flex items-end gap-1 h-24">
                {weeks.map((week) => {
                  const total = week.yes + week.no;
                  const barHeight = Math.max(4, (total / maxTotal) * 64);
                  const yesRatio = total > 0 ? week.yes / total : 0;
                  const showMonth = week.monthLabel !== lastMonth;
                  lastMonth = week.monthLabel;
                  return (
                    <div
                      key={week.weekLabel}
                      className="flex-1 flex flex-col items-center justify-end"
                      title={`Week of ${week.weekLabel}: ${week.yes} yes, ${week.no} no`}
                    >
                      <div className="w-full flex flex-col justify-end">
                        <div
                          className="rounded-t w-full"
                          style={{
                            height: `${barHeight * yesRatio}px`,
                            backgroundColor: "var(--sage)",
                          }}
                        />
                        <div
                          className="rounded-b w-full"
                          style={{
                            height: `${barHeight * (1 - yesRatio)}px`,
                            backgroundColor: "#e5e7eb",
                          }}
                        />
                      </div>
                      <span className={`text-[9px] text-gray-400 mt-1 ${showMonth ? "" : "invisible"}`}>
                        {week.monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* First mention */}
      {detail.firstMention && (
        <div className="rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            First mentioned
          </h2>
          <p className="text-sm text-black">
            {detail.firstMention.userName ?? "Someone"} first brought this up on{" "}
            {new Date(detail.firstMention.timestamp).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Past events */}
      {detail.completedEventCount > 0 && (
        <div className="rounded-2xl border border-gray-200 p-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Past events
          </h2>
          <p className="text-sm text-black">
            {detail.completedEventCount} event
            {detail.completedEventCount > 1 ? "s" : ""} completed
            {detail.totalAttendees > 0 && (
              <> &middot; {detail.totalAttendees} total attendees</>
            )}
          </p>
        </div>
      )}

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
