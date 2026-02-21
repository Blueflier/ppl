"use client";

interface CalendarPromptProps {
  onSkip: () => void;
}

export function CalendarPrompt({ onSkip }: CalendarPromptProps) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold">Connect your calendar</h2>
        <p className="mt-2 text-sm text-zinc-500">
          We&apos;ll use your availability to find the best times for events.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <button
          onClick={onSkip}
          className="rounded-xl bg-black py-3 text-white font-medium dark:bg-white dark:text-black"
        >
          Connect Google Calendar
        </button>
        <button
          onClick={onSkip}
          className="rounded-xl border border-zinc-200 py-3 text-sm font-medium dark:border-zinc-700"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
