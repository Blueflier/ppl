"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Map, { Marker } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

interface EventMapProps {
  selectedEventId: Id<"events"> | null;
  onSelectEvent: (id: Id<"events">) => void;
  visibleEventIds?: Set<string> | null;
}

export function EventMap({ selectedEventId, onSelectEvent, visibleEventIds }: EventMapProps) {
  const mapRef = useRef<MapRef>(null);
  const allEvents = useQuery(api.events.getMapEvents);

  // Filter to only visible events if a filter is provided
  const events = allEvents && visibleEventIds
    ? allEvents.filter((e) => visibleEventIds.has(e._id))
    : allEvents;

  // Fly to selected event when it changes
  useEffect(() => {
    if (!selectedEventId || !events || !mapRef.current) return;
    const event = events.find((e) => e._id === selectedEventId);
    if (!event) return;
    mapRef.current.flyTo({
      center: [event.longitude, event.latitude],
      zoom: 14,
      duration: 800,
    });
  }, [selectedEventId, events]);

  const handleMarkerClick = useCallback(
    (eventId: Id<"events">, e: { originalEvent: MouseEvent }) => {
      e.originalEvent.stopPropagation();
      onSelectEvent(eventId);
    },
    [onSelectEvent]
  );

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
      initialViewState={{
        longitude: -122.42,
        latitude: 37.77,
        zoom: 12,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/light-v11"
    >
      {events?.map((event) => {
        const isSelected = selectedEventId === event._id;
        return (
          <Marker
            key={event._id}
            longitude={event.longitude}
            latitude={event.latitude}
            anchor="center"
            onClick={(e) => handleMarkerClick(event._id, e)}
          >
            <div
              className={`flex items-center justify-center rounded-full border-2 shadow-md cursor-pointer transition-all ${
                isSelected
                  ? "w-10 h-10 bg-terra border-white scale-110"
                  : "w-8 h-8 bg-sage border-white hover:scale-110"
              }`}
            >
              <span className="text-white text-xs font-bold">
                {event.eventName.charAt(0)}
              </span>
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
