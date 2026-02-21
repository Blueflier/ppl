"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { ONBOARDING_QUESTIONS } from "@/lib/constants";
import { QuestionStep } from "@/components/onboarding/QuestionStep";
import { MockGaugingCards } from "@/components/onboarding/MockGaugingCards";
import { CalendarPrompt } from "@/components/onboarding/CalendarPrompt";

type Step = "questions" | "gauging" | "calendar";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthed, isLoading, onboardingComplete } = useAuth();
  const [step, setStep] = useState<Step>("questions");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});

  const saveInterests = useMutation(api.interests.saveOnboardingInterests);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

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
      const interests = Object.entries(updated).flatMap(([id, vals]) => {
        const q = ONBOARDING_QUESTIONS.find((q) => q.id === id)!;
        return vals.map((v) => ({
          category: q.category,
          canonicalValue: v.toLowerCase(),
          rawValue: v,
        }));
      });
      await saveInterests({ interests });
      setStep("gauging");
    }
  };

  const handleGaugingComplete = () => {
    setStep("calendar");
  };

  const handleCalendarSkip = async () => {
    await completeOnboarding({});
    router.replace("/ideate?tour=1");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {step === "questions" && (
          <>
            <div className="mb-3 flex items-center justify-between">
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
              <p className="text-sm text-zinc-500">
                {questionIndex + 1} of {ONBOARDING_QUESTIONS.length}
              </p>
            </div>
            <QuestionStep
              key={questionIndex}
              question={ONBOARDING_QUESTIONS[questionIndex]}
              onNext={handleQuestionNext}
              initialSelected={answers[ONBOARDING_QUESTIONS[questionIndex].id]}
            />
          </>
        )}

        {step === "gauging" && (
          <>
            <h2 className="mb-4 text-2xl font-bold">
              Would you go to these?
            </h2>
            <MockGaugingCards onComplete={handleGaugingComplete} />
          </>
        )}

        {step === "calendar" && (
          <CalendarPrompt onSkip={handleCalendarSkip} />
        )}
      </div>
    </div>
  );
}
