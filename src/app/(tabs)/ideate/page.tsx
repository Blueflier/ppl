"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { GuidedTourOverlay } from "@/components/ui/GuidedTourOverlay";
import { IdeateLayout } from "@/components/ideate/IdeateLayout";
import { ChatPanel } from "@/components/ideate/ChatPanel";
import { DiscoveryPanel } from "@/components/ideate/DiscoveryPanel";

export default function IdeatePage() {
  const searchParams = useSearchParams();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (searchParams.get("tour") === "1") {
      setShowTour(true);
    }
  }, [searchParams]);

  return (
    <>
      <IdeateLayout
        chatPanel={<ChatPanel />}
        discoveryPanel={<DiscoveryPanel />}
      />

      {showTour && (
        <GuidedTourOverlay onComplete={() => setShowTour(false)} />
      )}
    </>
  );
}
