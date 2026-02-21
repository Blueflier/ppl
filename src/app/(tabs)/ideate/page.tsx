"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { GuidedTourOverlay } from "@/components/ui/GuidedTourOverlay";

const OPENING_MESSAGE =
  "Hey! I'm here to help find your people in SF. What are you into lately — any hobbies, things you're learning, or problems you're trying to solve?";

export default function IdeatePage() {
  const searchParams = useSearchParams();
  const [showTour, setShowTour] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatHistory = useQuery(api.ideate.getChatHistory);
  const sendMessage = useAction(api.ideateAction.sendMessage);

  useEffect(() => {
    if (searchParams.get("tour") === "1") {
      setShowTour(true);
    }
  }, [searchParams]);

  // Clear optimistic messages once real history catches up
  useEffect(() => {
    if (chatHistory && optimisticMessages.length > 0) {
      setOptimisticMessages([]);
    }
  }, [chatHistory, optimisticMessages.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory, optimisticMessages, isSending]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setInput("");
    setOptimisticMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsSending(true);

    try {
      await sendMessage({ message: text });
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Merge DB history + optimistic
  const dbMessages = (chatHistory ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const allMessages = [...dbMessages, ...optimisticMessages];

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="sticky top-0 z-40 bg-white/80 px-4 pt-4 pb-2 backdrop-blur-lg dark:bg-zinc-950/80">
          <h1 className="text-xl font-bold">Ideate</h1>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto max-w-lg space-y-4">
            {/* Opening message */}
            <ChatBubble role="assistant" content={OPENING_MESSAGE} />

            {/* Chat history */}
            {allMessages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}

            {/* Typing indicator */}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="mx-auto flex max-w-lg items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tell me what you're into..."
              disabled={isSending}
              className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !input.trim()}
              className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-black"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      {showTour && (
        <GuidedTourOverlay onComplete={() => setShowTour(false)} />
      )}
    </>
  );
}

function ChatBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-black text-white dark:bg-white dark:text-black"
            : "bg-zinc-100 dark:bg-zinc-800"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
