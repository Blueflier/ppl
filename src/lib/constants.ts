export interface OnboardingQuestion {
  id: string;
  question: string;
  type: "bubble" | "text";
  options?: string[];
  category: "hobby" | "problem" | "learning" | "skill";
  savesAsInterest?: boolean;
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "athletics",
    question: "Are you into athletics?",
    type: "bubble",
    options: ["Yes", "No"],
    category: "hobby",
    savesAsInterest: false,
  },
  {
    id: "talking",
    question: "What do you like talking about?",
    type: "bubble",
    options: [
      "Tech",
      "Business",
      "Philosophy",
      "Pop culture",
      "Science",
      "Art",
      "Sports",
      "Politics",
    ],
    category: "hobby",
  },
  {
    id: "learning",
    question: "Are you learning anything right now?",
    type: "bubble",
    options: [
      "A language",
      "A skill",
      "A subject",
      "Always learning",
      "Not actively",
    ],
    category: "learning",
    savesAsInterest: false,
  },
  {
    id: "want_more",
    question: "What do you want more of?",
    type: "bubble",
    options: ["New friends", "Collaborators", "Community", "All of the above"],
    category: "skill",
    savesAsInterest: false,
  },
  {
    id: "show_up",
    question: "What would make you show up?",
    type: "bubble",
    options: [
      "It's competitive",
      "I'd learn something",
      "I'd create something",
      "Good people will be there",
    ],
    category: "hobby",
    savesAsInterest: false,
  },
  {
    id: "bucket_list",
    question: "What's one thing you've always wanted to do but never organized?",
    type: "text",
    category: "hobby",
  },
];

export const TAB_ROUTES = [
  { path: "/explore", label: "Explore", icon: "compass" },
  { path: "/ideate", label: "Ideate", icon: "sparkles" },
  { path: "/me", label: "Me", icon: "user" },
] as const;
