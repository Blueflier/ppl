"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { ONBOARDING_QUESTIONS } from "@/lib/constants";
import { QuestionStep } from "@/components/onboarding/QuestionStep";
import { MockGaugingCards } from "@/components/onboarding/MockGaugingCards";
import type { Id } from "../../../convex/_generated/dataModel";

type Step = "questions" | "generating" | "gauging";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthed, isLoading, onboardingComplete } = useAuth();
  const [step, setStep] = useState<Step>("questions");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [generatedIds, setGeneratedIds] = useState<Id<"eventTypes">[]>([]);

  const saveInterests = useMutation(api.interests.saveOnboardingInterests);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const saveGauge = useMutation(api.eventGauges.saveGauge);
  const generateOnboardingEvents = useAction(api.onboardingEvents.generateOnboardingEvents);

  // Reactively fetch generated event types (images update live via Convex reactivity)
  const generatedEventTypes = useQuery(
    api.eventTypes.getEventTypesByIds,
    generatedIds.length > 0 ? { ids: generatedIds } : "skip"
  );

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthed) {
      router.replace("/login");
    } else if (onboardingComplete) {
      router.replace("/explore");
    }
  }, [isAuthed, isLoading, onboardingComplete, router]);

  if (isLoading || !isAuthed || onboardingComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-black dark:border-zinc-600 dark:border-t-white" />
      </div>
    );
  }

  const handleQuestionNext = async (questionAnswers: string[]) => {
    const question = ONBOARDING_QUESTIONS[questionIndex];
    const updated = { ...answers, [question.id]: questionAnswers };
    setAnswers(updated);

    if (questionIndex < ONBOARDING_QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      // Save interests
      const interests = Object.entries(updated).flatMap(([id, vals]) => {
        const q = ONBOARDING_QUESTIONS.find((q) => q.id === id)!;
        if (q.savesAsInterest === false) return [];
        return vals.map((v) => ({
          category: q.category,
          canonicalValue: v.toLowerCase(),
          rawValue: v,
        }));
      });
      await saveInterests({ interests });

      // Generate personalized events
      setStep("generating");
      try {
        const answersForClaude = Object.entries(updated).map(([id, vals]) => {
          const q = ONBOARDING_QUESTIONS.find((q) => q.id === id)!;
          return {
            questionId: id,
            questionText: q.question,
            values: vals,
          };
        });
        const ids = await generateOnboardingEvents({ answers: answersForClaude });
        setGeneratedIds(ids.map((id) => id as Id<"eventTypes">));
        setStep("gauging");
      } catch (e) {
        console.error("Failed to generate onboarding events:", e);
        // Fall through to gauging with empty list — onComplete will still work
        setStep("gauging");
      }
    }
  };

  const handleGaugingComplete = async () => {
    await completeOnboarding({});
    router.replace("/explore/for-you");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {step === "questions" && (
          <>
            <div className="mb-6 flex flex-col gap-3">
              <div className="flex items-center">
                {questionIndex > 0 ? (
                  <button
                    onClick={() => setQuestionIndex(questionIndex - 1)}
                    className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  >
                    &lt; Go back
                  </button>
                ) : (
                  <span />
                )}
              </div>
              <div className="h-1 w-full rounded-full bg-gray-200">
                <div
                  className="h-1 rounded-full bg-sage transition-all duration-300"
                  style={{ width: `${((questionIndex + 1) / ONBOARDING_QUESTIONS.length) * 100}%` }}
                />
              </div>
            </div>
            <QuestionStep
              key={questionIndex}
              question={ONBOARDING_QUESTIONS[questionIndex]}
              onNext={handleQuestionNext}
              initialSelected={answers[ONBOARDING_QUESTIONS[questionIndex].id]}
            />
          </>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
            <p className="text-sm text-zinc-500 text-center">
              Cooking up events just for you...
            </p>
          </div>
        )}

        {step === "gauging" && (
          <>
            <h2 className="mb-4 text-2xl font-bold">
              Would you go to these?
            </h2>
            {!generatedEventTypes || generatedEventTypes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-black" />
                <p className="text-sm text-zinc-500">Loading events...</p>
              </div>
            ) : (
              <MockGaugingCards
                eventTypes={generatedEventTypes.map((et) => ({
                  _id: et._id,
                  displayName: et.displayName,
                  imageUrl: et.imageUrl ?? null,
                }))}
                onGauge={(eventTypeId, response) => {
                  saveGauge({
                    eventTypeId: eventTypeId as Id<"eventTypes">,
                    response,
                  });
                }}
                onComplete={handleGaugingComplete}
              />
            )}
          </>
        )}

      </div>
    </div>
  );
}
