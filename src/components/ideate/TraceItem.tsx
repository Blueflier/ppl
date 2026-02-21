"use client";

interface TraceItemProps {
  traceType: string;
  content: string;
  metadata?: {
    matchedCount?: number;
    eventTypeName?: string;
    venueName?: string;
    venueLocation?: { lat: number; lng: number };
  };
  animationDelay?: number;
}

const TRACE_ICONS: Record<string, string> = {
  searching_people: "🔍",
  found_match: "👥",
  pinging_user: "📡",
  searching_venue: "📍",
  found_venue: "✅",
  summary: "✨",
};

const TRACE_COLORS: Record<string, string> = {
  searching_people: "text-blue-600",
  found_match: "text-sage",
  pinging_user: "text-purple-600",
  searching_venue: "text-amber-600",
  found_venue: "text-sage",
  summary: "text-sage",
};

export function TraceItem({ traceType, content, metadata, animationDelay = 0 }: TraceItemProps) {
  const icon = TRACE_ICONS[traceType] ?? "•";
  const colorClass = TRACE_COLORS[traceType] ?? "text-gray-600";

  return (
    <div
      className="flex items-start gap-2 px-3 py-2 animate-[fadeSlideIn_0.3s_ease-out_both]"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <span className="text-sm shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className={`text-xs leading-relaxed ${colorClass}`}>
          {content}
        </p>
        {metadata?.matchedCount !== undefined && metadata.matchedCount > 0 && traceType === "found_match" && (
          <div className="mt-1 flex items-center gap-1">
            <div className="flex -space-x-1">
              {Array.from({ length: Math.min(metadata.matchedCount, 5) }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full bg-sage/20 border border-white"
                />
              ))}
            </div>
            {metadata.matchedCount > 5 && (
              <span className="text-[10px] text-gray-400">
                +{metadata.matchedCount - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
