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
import type { InferResponseType } from "hono/client";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "../lib/api-client";

// Inferred from the API's own route (apps/api/src/modules/hadiths/router.ts) - one
// source of truth for this shape shared with the backend, no manual duplicate type.
type HadithResponse = InferResponseType<(typeof apiClient.hadiths)[":id"]["$get"], 200>;
type HadithMetadata = NonNullable<HadithResponse["metadata"]>;

function formatHadithLabel(metadata: HadithMetadata | undefined): string | undefined {
  if (!metadata) return undefined;
  const collection = `${metadata.collection.charAt(0).toUpperCase()}${metadata.collection.slice(1)}`;
  return `${collection} · Book ${metadata.book}, Hadith ${metadata.hadithNumber}`;
}

export const Route = createFileRoute("/s/$id")({
  // Load the saved messages of this session before the page renders.
  loader: async ({ params }) => {
    const res = await apiClient.sessions[":id"].messages.$get({ param: { id: params.id } });
    if (!res.ok) throw new Error(`Failed to load session: ${res.status}`);
    // @anvia/core's Message union has literal discriminants Hono's JSON type inference
    // widens, so this one response is cast back to it rather than fought into shape.
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

// Slide-over panel showing a hadith's full text, opened by clicking a citation link
// in the agent's reply (see the markdown `a` override below). Fetches on demand by the
// id the agent cited - the agent's instructions point that id at a Qdrant point lookup
// (GET /api/hadiths/:id), not at a search, so this is always an exact, cheap lookup.
type HadithPanelState =
  | { id: string; status: "loading" }
  | { id: string; status: "error"; error: string }
  | { id: string; status: "ready"; detail: HadithResponse };

function HadithPanel({ panel, onClose }: { panel: HadithPanelState | null; onClose: () => void }) {
  const open = panel !== null;
  const label = panel?.status === "ready" ? formatHadithLabel(panel.detail.metadata) : undefined;

  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-espresso/20 transition-opacity ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col border-l border-taupe bg-cream shadow-xl transition-transform duration-200 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-taupe px-4">
          <span className="text-sm font-medium text-espresso/70">Hadith</span>
          <button type="button" onClick={onClose} className="text-espresso/60 hover:text-espresso" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {panel?.status === "loading" && <p className="text-sm text-espresso/60">Loading...</p>}
          {panel?.status === "error" && <p className="text-sm text-red-700">{panel.error}</p>}
          {panel?.status === "ready" && (
            <>
              {label && <p className="mb-2 text-xs font-medium tracking-wide text-mocha uppercase">{label}</p>}
              <p className="whitespace-pre-line text-sm leading-6 text-espresso">{panel.detail.text}</p>
            </>
          )}
        </div>
      </aside>
    </>
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

  const [hadithPanel, setHadithPanel] = useState<HadithPanelState | null>(null);

  async function openHadith(id: string) {
    setHadithPanel({ id, status: "loading" });
    try {
      const res = await apiClient.hadiths[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error(`Failed to load hadith: ${res.status}`);
      const detail = await res.json();
      setHadithPanel({ id, status: "ready", detail });
    } catch (error) {
      setHadithPanel({ id, status: "error", error: error instanceof Error ? error.message : "Failed to load hadith." });
    }
  }

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
                  {(message) =>
                    // The search_hadiths tool call lands as its own assistant message with no
                    // text part - its result is only used by the model to pick citation ids now,
                    // never rendered directly, so skip that message entirely.
                    message.role === "assistant" && !message.parts.some((part) => part.type === "text") ? null : (
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
                            {(part) =>
                              part.type === "text" ? (
                                // No children: the Markdown reads the part's text itself and streams per block.
                                <MessagePrimitive.Markdown
                                  className="message-markdown space-y-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
                                  components={{
                                    a: ({ href, children }) =>
                                      href?.startsWith("/hadith/") ? (
                                        <button
                                          type="button"
                                          onClick={() => void openHadith(href.slice("/hadith/".length))}
                                          className="font-semibold text-mocha underline underline-offset-2 hover:text-espresso"
                                        >
                                          {children}
                                        </button>
                                      ) : (
                                        <a href={href} target="_blank" rel="noreferrer" className="text-mocha underline">
                                          {children}
                                        </a>
                                      ),
                                  }}
                                />
                              ) : null
                            }
                          </MessagePrimitive.Parts>
                        </MessagePrimitive.Content>
                      </div>
                    )
                  }
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

      <HadithPanel panel={hadithPanel} onClose={() => setHadithPanel(null)} />
    </main>
  );
}
