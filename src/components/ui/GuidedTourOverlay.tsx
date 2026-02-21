"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_STEPS = [
  {
    tab: "explore",
    title: "Explore",
    description: "Discover events matched to your interests",
  },
  {
    tab: "ideate",
    title: "Ideate",
    description: "Chat with AI to share what you're into",
  },
  {
    tab: "me",
    title: "Me",
    description: "Manage your profile and interests",
  },
];

interface GuidedTourOverlayProps {
  onComplete: () => void;
}

export function GuidedTourOverlay({ onComplete }: GuidedTourOverlayProps) {
  const [step, setStep] = useState(0);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const updatePosition = useCallback(() => {
    const tabEl = document.querySelector(
      `[data-tab="${TOUR_STEPS[step].tab}"]`
    );
    if (tabEl) {
      const rect = tabEl.getBoundingClientRect();
      setPosition({ x: rect.left + rect.width / 2, y: rect.top });
    }
  }, [step]);

  useEffect(() => {
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [updatePosition]);

  const handleTap = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const current = TOUR_STEPS[step];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60"
      onClick={handleTap}
    >
      {position && (
        <div
          className="absolute mb-4 flex flex-col items-center gap-2"
          style={{
            left: position.x,
            top: position.y - 80,
            transform: "translateX(-50%)",
          }}
        >
          <div className="rounded-xl bg-white px-5 py-3 shadow-lg dark:bg-zinc-800">
            <p className="font-semibold">{current.title}</p>
            <p className="text-sm text-zinc-500">{current.description}</p>
          </div>
          <div className="h-3 w-3 rotate-45 bg-white dark:bg-zinc-800" />
        </div>
      )}

      <div className="mb-28 text-center">
        <p className="text-sm text-white/70">
          {step + 1} of {TOUR_STEPS.length} &middot; Tap to continue
        </p>
      </div>
    </div>
  );
}
