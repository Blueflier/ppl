"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import ParticleCanvas from "./components/ParticleCanvas";
import ParticleCard from "./components/ParticleCard";

const steps = [
  { number: "1", title: "Share your interests", description: "Tell us what you're into — hobbies, curiosities, skills, anything." },
  { number: "2", title: "Yes or no to events", description: "We find the right people and pitch you events. Just swipe." },
  { number: "3", title: "Get invites", description: "Show up. The AI handles the rest — time, place, people." },
];

const useCases = [
  {
    title: "Find your bandmates",
    description: "You're a drummer looking for a bassist and pianist. PPL finds musicians near you who actually want to jam — not just talk about it.",
    image: "/jazz.jpg",
    config: { density: 4, size: 5, jitter: 2.75, speed: 0.14, opacity: 0.75 },
  },
  {
    title: "Run it back at the park",
    description: "5v5 basketball at Golden Gate Park this Saturday. PPL pulls together 10 people who are free, competitive, and ready to hoop.",
    image: "/running.jpg",
    config: { density: 7, size: 7.5, jitter: 2.75, speed: 0.12, opacity: 0.85 },
  },
  {
    title: "New city, instant plans",
    description: "You just landed in SF and there's a run club happening tomorrow morning right when you're free. PPL already knows.",
    image: "/sf.jpg",
    config: { density: 4, size: 5.5, jitter: 3.5, speed: 0.13, opacity: 0.85 },
  },
  {
    title: "Build together",
    description: "You love tech and just want to work alongside other builders at a coffee shop. PPL finds your people and picks the spot.",
    image: "/founders.jpg",
    config: { density: 6, size: 7.5, jitter: 1.5, speed: 0.16, opacity: 0.95 },
  },
];

export default function Home() {
  const router = useRouter();
  const { isAuthed, onboardingComplete } = useAuth();
  const [letterIndex, setLetterIndex] = useState(0);
  const [overlayVisible, setOverlayVisible] = useState(true);

  const handleGetStarted = () => {
    if (isAuthed && onboardingComplete) {
      router.push("/explore");
    } else if (isAuthed) {
      router.push("/onboarding");
    } else {
      router.push("/login");
    }
  };

  useEffect(() => {
    // p → p → l, each 500ms apart
    const timers = [
      setTimeout(() => setLetterIndex(1), 500),
      setTimeout(() => setLetterIndex(2), 1000),
      setTimeout(() => setLetterIndex(3), 1500),
      // After all letters shown, start fading out the white overlay
      setTimeout(() => setOverlayVisible(false), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const letters = ["p", "p", "l"];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <ParticleCanvas src="/humans1.jpg" />
        </div>
        <div className="absolute inset-0 bg-white/40" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[15%]"
          style={{
            background: "linear-gradient(to bottom, transparent, white)",
          }}
        />

        {/* White backdrop that fades out */}
        <div
          className="pointer-events-none absolute inset-0 z-20 bg-white"
          style={{
            opacity: overlayVisible ? 1 : 0,
            transition: "opacity 1.5s ease-out",
          }}
        />

        {/* Persistent "ppl" + content — sits on top of everything */}
        <div className="absolute inset-0 z-30 flex h-full flex-col items-center justify-center px-6">
          <h1 className="text-[10rem] font-bold leading-none tracking-tighter text-black">
            {letters.slice(0, letterIndex).join("")}
            {/* Invisible placeholder to prevent layout shift */}
            <span className="invisible">{letters.slice(letterIndex).join("")}</span>
          </h1>
          <p
            className="mt-4 max-w-md text-center text-xl text-black/70"
            style={{
              opacity: overlayVisible ? 0 : 1,
              transition: "opacity 1.5s ease-out",
            }}
          >
            The AI that brings the right people together.
          </p>
          <button
            onClick={handleGetStarted}
            className="mt-8 rounded-full bg-black px-8 py-3 text-lg font-medium text-white transition-transform hover:scale-105"
            style={{
              opacity: overlayVisible ? 0 : 1,
              transition: "opacity 1.5s ease-out",
              pointerEvents: overlayVisible ? "none" : "auto",
            }}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Why? */}
      <section className="mx-auto max-w-6xl px-6 py-32">
        <h2 className="mb-4 text-center text-4xl font-semibold tracking-tight text-black">
          Why?
        </h2>
        <p className="mx-auto mb-20 max-w-2xl text-center text-lg text-black/50">
          We&apos;re lonelier than ever, glued to our screens, and the places that used to bring us together are disappearing.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Card 1 — Loneliness */}
          <div className="flex flex-col">
            <h3 className="mb-3 text-lg font-semibold text-black">
              The loneliness epidemic
            </h3>
            <ParticleCard
              src="/lonely.jpeg"
              label="loneliness"
              initialConfig={{ density: 5, size: 4, jitter: 1.5, speed: 0.15, opacity: 1.0 }}
            />
            <p className="mt-3 text-left text-sm leading-relaxed text-black/50">
              People with 0 close friends went from 3% to 15% in 30 years.
            </p>
          </div>

          {/* Card 2 — Screen time */}
          <div className="flex flex-col">
            <h3 className="mb-3 text-lg font-semibold text-black">
              Screens replaced people
            </h3>
            <ParticleCard
              src="/screens_opt.jpg"
              label="screen time"
              initialConfig={{ density: 5, size: 5.5, jitter: 2, speed: 0.15, opacity: 0.9 }}
            />
            <p className="mt-3 text-left text-sm leading-relaxed text-black/50">
              Average American: 7+ hours of screen time a day. Gen Z: 9 hours.
            </p>
          </div>

          {/* Card 3 — Third spaces */}
          <div className="flex flex-col">
            <h3 className="mb-3 text-lg font-semibold text-black">
              Third spaces vanished
            </h3>
            <ParticleCard
              src="/empty.jpg"
              label="third space"
              initialConfig={{ density: 3, size: 4.5, jitter: 3.25, speed: 0.08, opacity: 0.95 }}
            />
            <p className="mt-3 text-left text-sm leading-relaxed text-black/50">
              Civic org membership down 60% since 1964. Community hubs are gone.
            </p>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="mx-auto max-w-6xl px-6 py-32">
        <h2 className="mb-20 text-center text-4xl font-semibold tracking-tight text-black">
          Imagine this
        </h2>
        <div className="flex flex-col gap-32">
          {useCases.map((useCase, i) => {
            const imageFirst = i % 2 === 0;
            return (
              <div
                key={i}
                className={`flex flex-col items-center gap-12 md:flex-row ${
                  !imageFirst ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className="w-full md:w-1/2">
                  <ParticleCard
                    src={useCase.image}
                    label={useCase.title.toLowerCase().split(" ")[0]}
                    width={600}
                    height={400}
                    initialConfig={useCase.config}
                  />
                </div>
                <div className="flex w-full flex-col justify-center md:w-1/2">
                  <h3 className="mb-4 text-3xl font-semibold tracking-tight text-black">
                    {useCase.title}
                  </h3>
                  <p className="text-lg leading-relaxed text-black/60">
                    {useCase.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-4xl px-6 py-32">
        <h2 className="mb-16 text-center text-4xl font-semibold tracking-tight text-black">
          How it works
        </h2>
        <div className="grid gap-12 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-black text-lg font-bold text-white">
                {step.number}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-black">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-black/60">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 flex justify-center">
          <button
            onClick={handleGetStarted}
            className="rounded-full bg-black px-10 py-4 text-lg font-medium text-white transition-transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </section>
    </div>
  );
}
