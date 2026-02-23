"use client";

import { useState, useEffect } from "react";
import { GaugingCard } from "@/components/ui/GaugingCard";

interface GaugingEventType {
  _id: string;
  displayName: string;
  imageUrl: string | null;
  description: string | null;
}

interface MockGaugingCardsProps {
  eventTypes: GaugingEventType[];
  onGauge: (eventTypeId: string, response: "yes" | "no") => void;
  onComplete: () => void;
}

export function MockGaugingCards({ eventTypes, onGauge, onComplete }: MockGaugingCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (eventTypes.length === 0) {
      onComplete();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (eventTypes.length === 0) return null;

  const handleResponse = (response: "yes" | "no") => {
    onGauge(eventTypes[currentIndex]._id, response);
    if (currentIndex < eventTypes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        {currentIndex + 1} of {eventTypes.length}
      </p>
      <GaugingCard
        displayName={eventTypes[currentIndex].displayName}
        imageUrl={eventTypes[currentIndex].imageUrl}
        description={eventTypes[currentIndex].description}
        onYes={() => handleResponse("yes")}
        onNo={() => handleResponse("no")}
      />
    </div>
  );
}
