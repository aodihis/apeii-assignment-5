import { createFileRoute, useLocation, useRouter } from "@tanstack/react-router";
import type { Message } from "@anvia/core";
import { createHttpClientTransport, type UIMessage } from "@anvia/client";
import { initialMessagesFromMemory, useChat } from "@anvia/react";
import {
  ChatProvider,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@anvia/react-ui";
import { useEffect, useMemo, useRef, useState } from "react";

// Shape of a search_hadiths tool result (see packages/agents/src/tools/search-hadiths.ts).
type HadithMetadata = {
  collection: string;
  book: number;
  hadithNumber: string;
  babName?: string;
  grade?: string;
};

type HadithResult = {
  id: string;
  document: { text: string; metadata?: HadithMetadata };
  metadata?: HadithMetadata;
};

export const Route = createFileRoute("/s/$id")({
  // Load the saved messages of this session before the page renders.
  loader: async ({ params }) => {
    const res = await fetch(`/api/sessions/${params.id}/messages`);
    if (!res.ok) throw new Error(`Failed to load session: ${res.status}`);
    const messages = (await res.json()) as Message[];
    return { initialMessages: initialMessagesFromMemory(messages) };
  },
  component: SessionPage,
});

function SessionPage() {
  const { id } = Route.useParams();
  const { initialMessages } = Route.useLoaderData();

  // key={id}: a new session gets a fresh chat state.
  return <Chat key={id} sessionId={id} initialMessages={initialMessages} />;
}

// Shows a retrieved hadith below the agent's reply: a short excerpt by default (the
// answer above already explains its meaning), expandable to the full text on demand.
function HadithCard({ result }: { result: HadithResult }) {
  const [expanded, setExpanded] = useState(false);
  const meta = result.document.metadata ?? result.metadata;
  const label = meta
    ? `${meta.collection.charAt(0).toUpperCase()}${meta.collection.slice(1)} · Book ${meta.book}, Hadith ${meta.hadithNumber}`
    : undefined;

  return (
    <div className="rounded-2xl border border-taupe bg-sand p-4 shadow-sm">
      {label && <p className="mb-1.5 text-xs font-medium tracking-wide text-mocha uppercase">{label}</p>}
      <p className={expanded ? "whitespace-pre-line text-sm leading-6 text-espresso" : "line-clamp-3 whitespace-pre-line text-sm leading-6 text-espresso"}>
        {result.document.text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="mt-2 text-xs font-semibold text-mocha hover:underline"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}

function Chat({ sessionId, initialMessages }: { sessionId: string; initialMessages: UIMessage[] }) {
  // /api/chat is proxied to the API's /chat route (see vite.config.ts).
  const transport = useMemo(
    () => createHttpClientTransport({ endpoint: `/api/chat?sessionId=${encodeURIComponent(sessionId)}` }),
    [sessionId],
  );
  const chat = useChat({ transport, initialMessages });
  const lastMessageId = chat.messages.at(-1)?.id;
  const router = useRouter();

  // First message sent from the new-chat composer.
  const pendingMessage = useLocation({
    select: (location) => (location.state as { pendingMessage?: string }).pendingMessage,
  });
  const sentPending = useRef(false);

  useEffect(() => {
    if (!pendingMessage) return;

    // Wait one tick. In StrictMode, React runs this effect, cleans it up, then runs it again.
    // useChat aborts any request that is in flight at that cleanup, so the send must not start before it.
    const timer = window.setTimeout(() => {
      if (sentPending.current) return;
      sentPending.current = true;
      // Once the reply lands, re-run the root loader so this new session appears in the sidebar.
      void chat.sendMessage({ text: pendingMessage }).then(() => router.invalidate());

      // Clear the pending message from history, so a refresh does not send it again.
      const { pendingMessage: _ignored, ...rest } = window.history.state ?? {};
      window.history.replaceState(rest, "");
    }, 0);

    return () => window.clearTimeout(timer);
  }, [pendingMessage, chat, router]);

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-12 items-center px-4 text-sm font-medium text-espresso/70">
        Apeii-5 Hadith Assistant
      </header>

      <ChatProvider controller={chat}>
        <ThreadPrimitive.Root className="flex min-h-0 flex-1 flex-col">
          <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
              <ThreadPrimitive.Empty>
                <div className="mt-24 text-center text-2xl font-semibold text-espresso">
                  What can I help you with?
                </div>
              </ThreadPrimitive.Empty>

              <ThreadPrimitive.Messages className="flex flex-col gap-6">
                <MessagePrimitive.Root>
                  {(message) => (
                    <div
                      className={
                        message.role === "user"
                          ? "ml-auto w-fit max-w-[80%] rounded-3xl bg-coffee px-4 py-2.5 text-espresso"
                          : "max-w-full leading-7 text-espresso"
                      }
                    >
                      <MessagePrimitive.Content>
                        {/* Parts owns the smooth stream for the message that is currently streaming.
                            Newly revealed text gets data-state="revealing", which fades in (styles.css). */}
                        <MessagePrimitive.Parts
                          stream={{
                            isStreaming: chat.status === "streaming" && message.id === lastMessageId,
                            resetKey: message.id,
                            flushImmediately: chat.status === "error",
                          }}
                        >
                          {(part) => {
                            if (part.type === "text") {
                              // No children: the Markdown reads the part's text itself and streams per block.
                              return (
                                <MessagePrimitive.Markdown className="message-markdown space-y-3 [&_a]:text-mocha [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" />
                              );
                            }

                            if (part.type === "tool" && part.toolName === "search_hadiths" && part.state === "output-available") {
                              const results = (part.output as HadithResult[] | null) ?? [];
                              if (results.length === 0) return null;
                              return (
                                <div className="mt-3 flex flex-col gap-3">
                                  {results.map((result) => (
                                    <HadithCard key={result.id} result={result} />
                                  ))}
                                </div>
                              );
                            }

                            return null;
                          }}
                        </MessagePrimitive.Parts>
                      </MessagePrimitive.Content>
                    </div>
                  )}
                </MessagePrimitive.Root>
              </ThreadPrimitive.Messages>

              <ThreadPrimitive.Error className="text-sm text-red-700" />
            </div>
          </ThreadPrimitive.Viewport>

          <ComposerPrimitive.Root className="mx-auto w-full max-w-3xl px-4 pb-6">
            <div className="flex items-center gap-2 rounded-3xl border border-taupe bg-sand p-2 focus-within:border-coffee">
              <ComposerPrimitive.Input
                className="flex-1 bg-transparent px-3 py-2 leading-6 text-espresso outline-none placeholder:text-espresso/40"
                placeholder="Ask about a hadith, its narrator, or its meaning..."
              />
              <ComposerPrimitive.Submit className="flex size-10 shrink-0 items-center justify-center rounded-full bg-espresso text-cream hover:bg-espresso/90 disabled:bg-taupe disabled:text-espresso/40">
                ↑
              </ComposerPrimitive.Submit>
            </div>
          </ComposerPrimitive.Root>
        </ThreadPrimitive.Root>
      </ChatProvider>
    </main>
  );
}
