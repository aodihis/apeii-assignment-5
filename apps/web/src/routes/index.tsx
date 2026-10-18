import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const Route = createFileRoute("/")({
  component: HomePage,
});

// Falls back to the dev-only Vite proxy path when PUBLIC_API_URL is unset.
const API_BASE = import.meta.env.VITE_API_URL || "/api";

function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      if (!res.ok) throw new Error(`Request failed with ${res.status}`);
      const data: { reply: string } = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex h-screen max-w-2xl flex-col p-4">
      <h1 className="mb-4 text-xl font-semibold">Apeii-5 Helper Agent</h1>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-gray-200 p-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400">Ask the helper agent anything to get started.</p>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.role === "user" ? "text-right" : "text-left"}
          >
            <span
              className={
                "inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm " +
                (message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900")
              }
            >
              {message.content}
            </span>
          </div>
        ))}
        {loading && <p className="text-sm text-gray-400">Thinking…</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <form onSubmit={sendMessage} className="mt-4 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </main>
  );
}
