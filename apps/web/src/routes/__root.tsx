import { Link, Outlet, createRootRoute } from "@tanstack/react-router";

type SessionSummary = {
  id: string;
  updatedAt: string;
  title: string;
};

export const Route = createRootRoute({
  loader: async () => {
    const res = await fetch("/api/sessions");
    if (!res.ok) throw new Error(`Failed to load sessions: ${res.status}`);
    return { sessions: (await res.json()) as SessionSummary[] };
  },
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="flex h-screen bg-cream text-espresso">
      <Sidebar />
      <Outlet />
    </div>
  );
}

function Sidebar() {
  const { sessions } = Route.useLoaderData();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-taupe bg-sand p-3 text-sm text-espresso md:flex">
      <Link
        to="/"
        className="flex items-center gap-2 rounded-lg border border-taupe bg-cream px-3 py-2 hover:bg-taupe/40"
      >
        <span className="text-lg leading-none">+</span>
        New chat
      </Link>

      <p className="mt-6 px-3 text-xs font-medium text-espresso/50">Chats</p>
      <nav className="mt-2 flex flex-col gap-1 overflow-y-auto">
        {sessions.map((session) => (
          <Link
            key={session.id}
            to="/s/$id"
            params={{ id: session.id }}
            className="truncate rounded-lg px-3 py-2 text-espresso/70 hover:bg-taupe/40"
            activeProps={{ className: "truncate rounded-lg bg-coffee/50 px-3 py-2 font-medium text-espresso" }}
          >
            {session.title}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2 rounded-lg px-3 py-2">
        <span className="flex size-7 items-center justify-center rounded-full bg-espresso text-xs font-semibold text-cream">
          D
        </span>
        <span className="truncate">default-user</span>
      </div>
    </aside>
  );
}
