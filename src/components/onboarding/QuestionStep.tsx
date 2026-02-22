"use client";

import { useState } from "react";
import { BubbleSelect } from "@/components/ui/BubbleSelect";
import type { OnboardingQuestion } from "@/lib/constants";

interface QuestionStepProps {
  question: OnboardingQuestion;
  onNext: (answers: string[]) => void;
  initialSelected?: string[];
}

export function QuestionStep({ question, onNext, initialSelected }: QuestionStepProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected ?? []);
  const [textValue, setTextValue] = useState(
    question.type === "text" ? (initialSelected?.[0] ?? "") : ""
  );

  const isBinary =
    question.type === "bubble" &&
    question.options?.length === 2 &&
    question.options.includes("Yes") &&
    question.options.includes("No");

  const handleToggle = (option: string) => {
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const canContinue =
    question.type === "text" ? textValue.trim().length > 0 : selected.length > 0;

  const handleNext = () => {
    if (question.type === "text") {
      onNext([textValue.trim()]);
    } else {
      onNext(selected);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl font-bold leading-tight text-black">{question.question}</h2>

      {isBinary ? (
        <>
          <div className="flex gap-3">
            <button
              onClick={() => setSelected(["Yes"])}
              className={`flex-1 rounded-full py-3.5 text-base font-medium transition-colors ${
                selected[0] === "Yes"
                  ? "bg-sage text-white"
                  : "bg-gray-100 text-black"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => setSelected(["No"])}
              className={`flex-1 rounded-full py-3.5 text-base font-medium transition-colors ${
                selected[0] === "No"
                  ? "bg-sage text-white"
                  : "bg-gray-100 text-black"
              }`}
            >
              No
            </button>
          </div>
          <button
            onClick={() => onNext(selected)}
            disabled={selected.length === 0}
            className="rounded-full bg-sage py-3.5 text-white font-medium disabled:opacity-30"
          >
            Continue
          </button>
        </>
      ) : question.type === "bubble" && question.options ? (
        <>
          <BubbleSelect
            options={question.options}
            selected={selected}
            onToggle={handleToggle}
          />
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className="rounded-full bg-sage py-3.5 text-white font-medium disabled:opacity-30"
          >
            Continue
          </button>
        </>
      ) : (
        <>
          <textarea
            autoFocus
            rows={3}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Type your answer..."
            className="rounded-xl border border-gray-100 bg-white px-4 py-3 text-sm text-black outline-none resize-none focus:border-sage"
          />
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className="rounded-full bg-sage py-3.5 text-white font-medium disabled:opacity-30"
          >
            Continue
          </button>
        </>
      )}
    </div>
  );
}
