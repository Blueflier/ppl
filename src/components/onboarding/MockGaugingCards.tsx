"use client";

import { useState } from "react";
import { GaugingCard } from "@/components/ui/GaugingCard";

const MOCK_EVENTS = [
  "Jazz Jam",
  "3v3 Basketball",
  "Founder Roundtable",
  "Board Game Night",
  "Group Hike",
];

interface MockGaugingCardsProps {
  onComplete: (responses: Record<string, "yes" | "no">) => void;
}

export function MockGaugingCards({ onComplete }: MockGaugingCardsProps) {
  const [responses, setResponses] = useState<Record<string, "yes" | "no">>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleResponse = (response: "yes" | "no") => {
    const event = MOCK_EVENTS[currentIndex];
    const updated = { ...responses, [event]: response };
    setResponses(updated);

    if (currentIndex < MOCK_EVENTS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete(updated);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {currentIndex + 1} of {MOCK_EVENTS.length}
      </p>
      <GaugingCard
        displayName={MOCK_EVENTS[currentIndex]}
        onYes={() => handleResponse("yes")}
        onNo={() => handleResponse("no")}
      />
    </div>
  );
}
