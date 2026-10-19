import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

declare module "@tanstack/react-router" {
  interface HistoryState {
    pendingMessage?: string;
  }
}

export const Route = createFileRoute("/")({
  component: NewChat,
});

// New chat: the composer only. The first message is sent from the session page.
function NewChat() {
  const navigate = useNavigate();
  const [text, setText] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = text.trim();
    if (!message) return;

    const id = crypto.randomUUID();
    void navigate({ to: "/s/$id", params: { id }, state: { pendingMessage: message } });
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col">
      <header className="flex h-12 items-center px-4 text-sm font-medium text-espresso/70">
        Apeii-5 Hadith Assistant
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <h1 className="mb-6 text-2xl font-semibold text-espresso">What can I help you with?</h1>

        <form onSubmit={submit} className="w-full max-w-3xl">
          <div className="flex items-center gap-2 rounded-3xl border border-taupe bg-sand p-2 focus-within:border-coffee">
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="flex-1 bg-transparent px-3 py-2 leading-6 text-espresso outline-none placeholder:text-espresso/40"
              placeholder="Ask about a hadith, its narrator, or its meaning..."
            />
            <button
              type="submit"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-espresso text-cream hover:bg-espresso/90 disabled:bg-taupe disabled:text-espresso/40"
            >
              ↑
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
