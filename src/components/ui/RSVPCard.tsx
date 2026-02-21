"use client";

import { useRef } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface RSVPCardProps {
  eventName: string;
  imageUrl?: string | null;
  venueName?: string;
  scheduledTime?: number;
  attendeeCount: number;
  matchReason: string;
  hostName?: string;
  rsvpDeadline?: number;
  currentResponse?: "can_go" | "unavailable" | null;
  isJustConfirmed?: boolean;
  detailHref?: string;
  onCanGo: () => void;
  onUnavailable: () => void;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + " · " + d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeLeft(deadline: number): string {
  const diff = deadline - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours >= 1) return `${hours}h left`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m left`;
}

export function RSVPCard({
  eventName,
  imageUrl,
  venueName,
  scheduledTime,
  attendeeCount,
  matchReason,
  hostName,
  rsvpDeadline,
  currentResponse,
  isJustConfirmed,
  detailHref,
  onCanGo,
  onUnavailable,
}: RSVPCardProps) {
  const canGoRef = useRef<HTMLButtonElement>(null);

  const handleCanGo = () => {
    if (canGoRef.current) {
      const rect = canGoRef.current.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x, y },
        colors: ["#6B8F71", "#8DB48E", "#B7D4B2", "#FFD700", "#FF6B6B"],
        ticks: 120,
        gravity: 1.2,
        scalar: 0.9,
      });
    }
    onCanGo();
  };

  return (
    <div
      className={`flex items-stretch gap-3 rounded-2xl border border-gray-200 p-3 transition-all duration-500 ${
        isJustConfirmed ? "animate-celebrate" : ""
      }`}
    >
      {/* Thumbnail */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={eventName}
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="h-20 w-20 shrink-0 rounded-xl border border-gray-200 flex items-center justify-center">
          <span className="text-2xl font-bold text-gray-300">
            {eventName.charAt(0)}
          </span>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-sm font-semibold text-black leading-tight truncate">
          {eventName}
        </p>

        {(venueName || scheduledTime) && (
          <p className="mt-0.5 text-xs text-gray-400 truncate">
            {[venueName, scheduledTime ? formatTime(scheduledTime) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}

        {attendeeCount > 0 && (
          <p className="mt-0.5 text-xs text-gray-400">
            {attendeeCount} {attendeeCount === 1 ? "other going" : "others going"}
          </p>
        )}

        <p className="mt-0.5 text-xs text-sage italic truncate">
          Matched: {matchReason}
        </p>

        {hostName && (
          <p className="mt-0.5 text-xs text-gray-400">
            {hostName} is hosting
          </p>
        )}

        {detailHref && (
          <Link
            href={detailHref}
            className="mt-1 text-xs font-medium text-blue hover:underline"
          >
            More Info &rsaquo;
          </Link>
        )}
      </div>

      {/* Right column: time + buttons */}
      <div className="w-[20%] shrink-0 flex flex-col items-stretch gap-1.5">
        {rsvpDeadline && (
          <p className="text-[10px] text-terra font-medium text-right leading-tight">
            {timeLeft(rsvpDeadline)}
          </p>
        )}
        <div className="flex-1" />
        <button
          ref={canGoRef}
          onClick={handleCanGo}
          className={`rounded-lg py-2 text-sm font-medium transition-colors ${
            currentResponse === "can_go"
              ? "bg-sage text-white"
              : "border border-gray-200 text-black hover:bg-sage/10"
          }`}
        >
          Can Go
        </button>
        <button
          onClick={onUnavailable}
          className={`rounded-lg py-2 text-sm font-medium transition-colors ${
            currentResponse === "unavailable"
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
