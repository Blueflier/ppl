"use client";

interface BubbleSelectProps {
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
  multiple?: boolean;
}

export function BubbleSelect({
  options,
  selected,
  onToggle,
  multiple = true,
}: BubbleSelectProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              if (!multiple && !isSelected) {
                onToggle(option);
              } else {
                onToggle(option);
              }
            }}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-all ${
              isSelected
                ? "border-blue bg-blue/10 text-blue"
                : "border-gray-200 bg-white text-black"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
