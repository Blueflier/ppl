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
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950 dark:text-blue-300"
                : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
