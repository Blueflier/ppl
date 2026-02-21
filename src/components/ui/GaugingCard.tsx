"use client";

import Link from "next/link";

interface GaugingCardProps {
  displayName: string;
  imageUrl?: string | null;
  currentResponse?: "yes" | "no" | null;
  onYes: () => void;
  onNo: () => void;
  nearbyCount?: number;
  href?: string;
}

export function GaugingCard({
  displayName,
  imageUrl,
  currentResponse,
  onYes,
  onNo,
  nearbyCount,
  href,
}: GaugingCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3">
      {/* Thumbnail — links to detail */}
      {href ? (
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
      ) : imageUrl ? (
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

      {/* Info + Buttons */}
      <div className="flex-1 min-w-0">
        {href ? (
          <Link href={href}>
            <p className="text-sm font-semibold text-black leading-tight truncate hover:text-sage transition-colors">
              {displayName}
            </p>
          </Link>
        ) : (
          <p className="text-sm font-semibold text-black leading-tight truncate">
            {displayName}
          </p>
        )}
        {nearbyCount !== undefined && nearbyCount > 0 && (
          <p className="mt-0.5 text-xs text-gray-400">
            {nearbyCount} interested nearby
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <button
            onClick={onYes}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              currentResponse === "yes"
                ? "bg-sage text-white"
                : "border border-gray-200 text-black hover:bg-sage/10"
            }`}
          >
            Yes
          </button>
          <button
            onClick={onNo}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
              currentResponse === "no"
                ? "bg-gray-600 text-white"
                : "border border-gray-200 text-black hover:bg-gray-50"
            }`}
          >
            Nah
          </button>
        </div>
      </div>
    </div>
  );
}
