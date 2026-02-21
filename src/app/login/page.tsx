"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthed, onboardingComplete } = useAuth();
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthed) {
      router.replace(onboardingComplete ? "/explore" : "/onboarding");
    }
  }, [isAuthed, onboardingComplete, router]);

  if (isAuthed) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", email);
      formData.set("password", password);
      formData.set("flow", step);
      await signIn("password", formData);
    } catch {
      setError(
        step === "signUp"
          ? "Could not create account. Try a different email."
          : "Invalid email or password."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-3xl font-bold">PPL</h1>
        <p className="mb-8 text-zinc-500">
          {step === "signIn"
            ? "Sign in to your account"
            : "Create a new account"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:placeholder:text-zinc-500"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-black py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isLoading
              ? "..."
              : step === "signIn"
                ? "Sign in"
                : "Sign up"}
          </button>
        </form>

        <button
          onClick={() => setStep(step === "signIn" ? "signUp" : "signIn")}
          className="mt-4 text-sm text-zinc-500 underline"
        >
          {step === "signIn" ? "Create an account" : "Already have an account?"}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
