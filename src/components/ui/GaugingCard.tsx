"use client";

interface GaugingCardProps {
  displayName: string;
  onYes: () => void;
  onNo: () => void;
  nearbyCount?: number;
}

export function GaugingCard({
  displayName,
  onYes,
  onNo,
  nearbyCount,
}: GaugingCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <p className="mb-1 text-lg font-semibold text-black dark:text-white">
        Would you go to a {displayName}?
      </p>
      {nearbyCount !== undefined && nearbyCount > 0 && (
        <p className="mb-4 text-sm text-zinc-500">
          {nearbyCount} {nearbyCount === 1 ? "person" : "people"} nearby{" "}
          {nearbyCount === 1 ? "is" : "are"} interested
        </p>
      )}
      <div className="flex gap-3 mt-4">
        <button
          onClick={onYes}
          className="flex-1 rounded-xl bg-black py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Yes, I&apos;d go
        </button>
        <button
          onClick={onNo}
          className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-black dark:border-zinc-700 dark:text-white"
        >
          Not for me
        </button>
      </div>
    </div>
  );
}
