"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { TypeAnimation } from "react-type-animation";
import { TraceItem } from "./TraceItem";

const OPENING_MESSAGE =
  "What are you into? Hobbies, sports, creative stuff — whatever.";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([]);
  const initialCountRef = useRef<number | null>(null);
  const lastDbCountRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatHistory = useQuery(api.ideate.getChatHistory);
  const interests = useQuery(api.interests.getUserInterests);
  const traces = useQuery(api.ideate.getTraces);
  const confirmations = useQuery(api.ideate.getPendingConfirmations);
  const sendMessage = useAction(api.ideateAction.sendMessage);
  const resolveConfirmation = useAction(api.ideateAction.resolveMatchConfirmation);
  const clearChat = useMutation(api.ideate.clearChat);
  const [resolvingIds, setResolvingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (chatHistory && initialCountRef.current === null) {
      initialCountRef.current = chatHistory.length;
    }
  }, [chatHistory]);

  // Clear optimistic messages only when DB actually gets new messages
  useEffect(() => {
    if (!chatHistory) return;
    if (chatHistory.length > lastDbCountRef.current) {
      setOptimisticMessages([]);
    }
    lastDbCountRef.current = chatHistory.length;
  }, [chatHistory]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatHistory, optimisticMessages, isSending, traces]);

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

  const handleClear = async () => {
    await clearChat();
    initialCountRef.current = 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const dbMessages = (chatHistory ?? []).map((m) => ({
    role: m.role,
    content: m.content,
    extractedInterests: m.extractedInterests,
    timestamp: m.timestamp,
  }));
  const allMessages = [
    ...dbMessages,
    ...optimisticMessages.map((m) => ({
      ...m,
      extractedInterests: undefined as string[] | undefined,
      timestamp: Date.now(),
    })),
  ];
  const initialCount = initialCountRef.current ?? allMessages.length;

  // Group traces by proximity to message timestamps
  const sortedTraces = (traces ?? []).sort(
    (a, b) => a.timestamp - b.timestamp
  );

  const getTracesForMessage = (msgTimestamp: number) => {
    // Find traces within 5 seconds after message timestamp
    return sortedTraces.filter(
      (t) => t.timestamp >= msgTimestamp - 1000 && t.timestamp <= msgTimestamp + 5000
    );
  };

  const getConfirmationsForMessage = (msgTimestamp: number) => {
    if (!confirmations) return [];
    return confirmations.filter(
      (c) => c.timestamp >= msgTimestamp - 1000 && c.timestamp <= msgTimestamp + 5000
    );
  };

  // Traces not associated with any message (e.g. from confirmation resolution)
  const lastMsgTimestamp = allMessages.length > 0
    ? allMessages[allMessages.length - 1].timestamp
    : 0;
  const orphanTraces = sortedTraces.filter(
    (t) => t.timestamp > lastMsgTimestamp + 5000
  );

  const handleResolve = async (id: Id<"matchConfirmations">, resolution: "accepted" | "rejected") => {
    setResolvingIds((prev) => new Set(prev).add(id));
    try {
      await resolveConfirmation({ id, resolution });
    } catch (e) {
      console.error("Failed to resolve confirmation:", e);
    } finally {
      setResolvingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl border border-gray-200 px-4 py-3">
          <h1 className="text-xl font-bold text-black">Ideate</h1>
        </div>

        {/* Interest chips — single row, overflow hidden */}
        {interests && interests.length > 0 && (
          <div className="mt-2 flex items-center gap-1.5 overflow-hidden">
            <div className="flex gap-1.5 overflow-hidden">
              {interests.map((interest) => (
                <span
                  key={interest._id}
                  className="inline-flex items-center gap-1 rounded-full bg-sage/10 px-2.5 py-1 text-xs font-medium text-sage whitespace-nowrap shrink-0"
                >
                  {interest.canonicalValue}
                  <svg
                    className="h-3 w-3 text-sage/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
              ))}
            </div>
            <a
              href="/me"
              className="text-xs text-sage font-medium whitespace-nowrap shrink-0 hover:underline"
            >
              {interests.length} total &gt;
            </a>
          </div>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-4">
          <ChatBubble role="assistant" content={OPENING_MESSAGE} />

          {allMessages.map((m, i) => {
            const msgConfirmations = m.role === "assistant" && m.extractedInterests?.length
              ? getConfirmationsForMessage(m.timestamp)
              : [];
            return (
              <div key={i}>
                <ChatBubble
                  role={m.role}
                  content={m.content}
                  shouldAnimate={m.role === "assistant" && i >= initialCount}
                  extractedInterests={m.extractedInterests}
                  traces={
                    m.role === "assistant" && m.extractedInterests?.length
                      ? getTracesForMessage(m.timestamp)
                      : undefined
                  }
                />
                {msgConfirmations.map((c) => (
                  <ConfirmationCard
                    key={c._id}
                    confirmation={c}
                    onResolve={handleResolve}
                    isResolving={resolvingIds.has(c._id)}
                  />
                ))}
              </div>
            );
          })}

          {(isSending || orphanTraces.length > 0) && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <div className="rounded-xl border border-gray-100 bg-gray-50/50 py-1">
                  {orphanTraces.map((trace, i) => (
                    <TraceItem
                      key={trace._id}
                      traceType={trace.traceType}
                      content={trace.content}
                      metadata={trace.metadata}
                      animationDelay={i * 100}
                    />
                  ))}
                  {isSending && (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <span className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                      </span>
                      {orphanTraces.length === 0 && (
                        <span className="text-xs text-gray-400">Thinking...</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tell me what you're into..."
            disabled={isSending}
            className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none focus:border-sage"
          />
          <button
            onClick={handleSend}
            disabled={isSending || !input.trim()}
            className="rounded-xl bg-sage px-4 py-3 text-sm font-medium text-white disabled:opacity-40"
          >
            Send
          </button>
        </div>
        {allMessages.length > 0 && (
          <button
            onClick={handleClear}
            className="mt-2 w-full text-xs text-gray-400 hover:text-black transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>
    </div>
  );
}

function ChatBubble({
  role,
  content,
  shouldAnimate = false,
  extractedInterests,
  traces,
}: {
  role: "user" | "assistant";
  content: string;
  shouldAnimate?: boolean;
  extractedInterests?: string[];
  traces?: {
    _id: string;
    traceType: string;
    content: string;
    metadata?: {
      matchedCount?: number;
      eventTypeName?: string;
      venueName?: string;
      venueLocation?: { lat: number; lng: number };
    };
  }[];
}) {
  const [showTraces, setShowTraces] = useState(false);
  const isUser = role === "user";
  const hasTraces = traces && traces.length > 0;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%]">
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser ? "bg-sage text-white" : "border border-gray-200 text-black"
          }`}
        >
          {shouldAnimate ? (
            <TypeAnimation
              sequence={[content]}
              wrapper="p"
              className="text-sm leading-relaxed whitespace-pre-wrap"
              speed={80}
              cursor={false}
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {content}
            </p>
          )}
        </div>

        {/* Inline trace toggle */}
        {hasTraces && (
          <div className="mt-1">
            <button
              onClick={() => setShowTraces(!showTraces)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Activity {showTraces ? "v" : ">"}
            </button>
            {showTraces && (
              <div className="mt-1 rounded-xl border border-gray-100 bg-gray-50/50 py-1">
                {traces.map((trace, i) => (
                  <TraceItem
                    key={trace._id}
                    traceType={trace.traceType}
                    content={trace.content}
                    metadata={trace.metadata}
                    animationDelay={i * 100}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmationCard({
  confirmation,
  onResolve,
  isResolving,
}: {
  confirmation: {
    _id: Id<"matchConfirmations">;
    interest: string;
    matchedEventTypeName: string;
    suggestedEventName: string;
    status: "pending" | "accepted" | "rejected";
  };
  onResolve: (id: Id<"matchConfirmations">, resolution: "accepted" | "rejected") => void;
  isResolving: boolean;
}) {
  const isPending = confirmation.status === "pending";
  const isAccepted = confirmation.status === "accepted";
  const isRejected = confirmation.status === "rejected";

  return (
    <div className="flex justify-start mt-2">
      <div className="max-w-[85%]">
        <div className="rounded-2xl border border-sage/30 bg-sage/5 px-4 py-3">
          <p className="text-sm text-black">
            Found similar: <span className="font-semibold">&ldquo;{confirmation.matchedEventTypeName}&rdquo;</span>
          </p>
          {isPending && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">Close enough?</span>
              <button
                onClick={() => onResolve(confirmation._id, "accepted")}
                disabled={isResolving}
                className="rounded-lg bg-sage px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
              >
                Yes
              </button>
              <button
                onClick={() => onResolve(confirmation._id, "rejected")}
                disabled={isResolving}
                className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                No
              </button>
            </div>
          )}
          {isAccepted && (
            <p className="mt-1 text-xs text-sage">Joined {confirmation.matchedEventTypeName}</p>
          )}
          {isRejected && (
            <p className="mt-1 text-xs text-sage">Created {confirmation.suggestedEventName}</p>
          )}
        </div>
      </div>
    </div>
  );
}
