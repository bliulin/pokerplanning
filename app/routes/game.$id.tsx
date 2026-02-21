import { useEffect } from "react";
import { Form, useLoaderData, useRevalidator, useNavigation } from "@remix-run/react";
import {
  createCookie,
  redirect,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import {
  getGame,
  joinGame,
  startRound,
  castVote,
  revealVotes,
  nextRound,
  deleteGame,
  type CardValue,
} from "~/lib/game.server";
import CardDeck from "~/components/CardDeck";
import ParticipantList from "~/components/ParticipantList";
import RoundResults from "~/components/RoundResults";

const playerCookie = createCookie("playerId", {
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24,
  path: "/",
});

async function getPlayerId(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get("Cookie");
  const value = await playerCookie.parse(cookieHeader);
  return typeof value === "string" ? value : null;
}

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  { title: data ? `${data.game.name} — Poker Planning` : "Poker Planning" },
];

export async function loader({ params, request }: LoaderFunctionArgs) {
  const gameId = params.id!;
  const game = getGame(gameId);

  if (!game) {
    throw new Response("Game not found", { status: 404 });
  }

  const playerId = await getPlayerId(request);
  const participant = game.participants.find((p) => p.id === playerId) ?? null;

  return {
    game: {
      id: game.id,
      name: game.name,
      facilitatorId: game.facilitatorId,
      participants: game.participants,
      currentRound: game.currentRound,
      completedRounds: game.completedRounds,
    },
    participant,
  };
}

export async function action({ params, request }: ActionFunctionArgs) {
  const gameId = params.id!;
  const game = getGame(gameId);

  if (!game) {
    throw new Response("Game not found", { status: 404 });
  }

  const formData = await request.formData();
  const intent = String(formData.get("intent"));

  switch (intent) {
    case "join": {
      const name = String(formData.get("name") ?? "").trim();
      if (!name) return { error: "Please enter your name" };

      const role = formData.get("role") === "spectator" ? "spectator" : "player";
      const participant = joinGame(gameId, name, role);
      return redirect(`/game/${gameId}`, {
        headers: {
          "Set-Cookie": await playerCookie.serialize(participant.id),
        },
      });
    }

    case "start-round": {
      const story = String(formData.get("story") ?? "").trim();
      startRound(gameId, story || "Untitled story");
      return redirect(`/game/${gameId}`);
    }

    case "vote": {
      const playerId = await getPlayerId(request);
      if (!playerId) return redirect(`/game/${gameId}`);

      const value = String(formData.get("value")) as CardValue;
      castVote(gameId, playerId, value);
      return redirect(`/game/${gameId}`);
    }

    case "reveal": {
      revealVotes(gameId);
      return redirect(`/game/${gameId}`);
    }

    case "next-round": {
      nextRound(gameId);
      return redirect(`/game/${gameId}`);
    }

    case "close-game": {
      deleteGame(gameId);
      return redirect("/");
    }

    default:
      return { error: "Unknown action" };
  }
}

export function ErrorBoundary() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-50">Game not found</h1>
        <p className="text-slate-400">
          This game has been closed or does not exist.
        </p>
        <a
          href="/"
          className="px-6 py-3 font-semibold text-slate-900 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}

export default function GameRoom() {
  const { game, participant } = useLoaderData<typeof loader>();
  const { revalidate } = useRevalidator();
  const navigation = useNavigation();

  // Poll for updates while idle (other players joining/voting)
  useEffect(() => {
    const id = setInterval(() => {
      if (navigation.state === "idle") revalidate();
    }, 3000);
    return () => clearInterval(id);
  }, [revalidate, navigation.state]);

  // ── Not joined yet ──────────────────────────────────────────────
  if (!participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-slate-800 rounded-xl p-8 w-80 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">{game.name}</h1>
            <p className="text-slate-400 mt-1">Enter your name to join</p>
          </div>
          <Form method="post" className="flex flex-col gap-4">
            <input type="hidden" name="intent" value="join" />
            <input
              type="text"
              name="name"
              placeholder="Your name…"
              className="px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
              required
              autoFocus
            />
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="player"
                  defaultChecked
                  className="accent-sky-400"
                />
                <span className="text-sm text-slate-300">Player</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="spectator"
                  className="accent-sky-400"
                />
                <span className="text-sm text-slate-300">Spectator</span>
              </label>
            </div>
            <button
              type="submit"
              className="px-6 py-3 font-semibold text-slate-900 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors"
            >
              Join game
            </button>
          </Form>
        </div>
      </div>
    );
  }

  const isFacilitator = participant.id === game.facilitatorId;
  const { currentRound } = game;
  const myVote = currentRound?.votes[participant.id] as CardValue | undefined;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-50">{game.name}</h1>
        <span className="text-slate-600">·</span>
        <span className="text-slate-400 text-sm">
          Playing as{" "}
          <span className="text-sky-300 font-medium">{participant.name}</span>
        </span>
        {isFacilitator && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sky-900 text-sky-300">
              Facilitator
            </span>
            <Form method="post">
              <input type="hidden" name="intent" value="close-game" />
              <button
                type="submit"
                onClick={(e) => {
                  if (!window.confirm("Close this game? All progress will be lost and all players will be disconnected.")) {
                    e.preventDefault();
                  }
                }}
                className="text-xs font-medium px-2.5 py-1 rounded-full border border-red-800 text-red-400 hover:bg-red-900/40 transition-colors"
              >
                Close game
              </button>
            </Form>
          </div>
        )}
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Main content */}
        <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          {/* No active round */}
          {!currentRound && (
            <div className="flex flex-col items-center justify-center flex-1 gap-6">
              {isFacilitator ? (
                <Form
                  method="post"
                  className="flex flex-col items-center gap-4 w-full max-w-md"
                >
                  <input type="hidden" name="intent" value="start-round" />
                  <h2 className="text-xl font-semibold text-slate-200">
                    Start a new round
                  </h2>
                  <input
                    type="text"
                    name="story"
                    placeholder="Story or task name (optional)…"
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <button
                    type="submit"
                    className="px-8 py-3 font-semibold text-slate-900 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors"
                  >
                    Start round
                  </button>
                </Form>
              ) : (
                <p className="text-slate-400 text-lg text-center">
                  Waiting for the facilitator to start a round…
                </p>
              )}
            </div>
          )}

          {/* Round active — voting */}
          {currentRound && !currentRound.revealed && (
            <div className="flex flex-col gap-6">
              {currentRound.story && (
                <div className="bg-slate-800 rounded-lg px-6 py-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Story
                  </p>
                  <p className="text-lg font-medium text-slate-100">
                    {currentRound.story}
                  </p>
                </div>
              )}

              {participant.role === "player" ? (
                <CardDeck selectedValue={myVote} />
              ) : (
                <p className="text-slate-400 text-sm">
                  Voting in progress — results will appear once votes are revealed.
                </p>
              )}

              {isFacilitator && (
                <Form method="post" className="flex justify-center mt-2">
                  <input type="hidden" name="intent" value="reveal" />
                  <button
                    type="submit"
                    className="px-8 py-3 font-semibold text-slate-900 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors"
                  >
                    Reveal votes
                  </button>
                </Form>
              )}
            </div>
          )}

          {/* Votes revealed */}
          {currentRound?.revealed && (
            <div className="flex flex-col gap-6">
              <RoundResults
                round={currentRound}
                participants={game.participants}
              />

              {isFacilitator && (
                <Form method="post" className="flex justify-center">
                  <input type="hidden" name="intent" value="next-round" />
                  <button
                    type="submit"
                    className="px-8 py-3 font-semibold text-slate-900 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors"
                  >
                    Next round
                  </button>
                </Form>
              )}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-64 border-l border-slate-800 p-4 overflow-y-auto">
          <ParticipantList
            participants={game.participants}
            facilitatorId={game.facilitatorId}
            votes={currentRound?.votes ?? {}}
            revealed={currentRound?.revealed ?? false}
            currentParticipantId={participant.id}
          />

          {game.completedRounds.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Completed ({game.completedRounds.length})
              </h3>
              <ul className="flex flex-col gap-1">
                {game.completedRounds.map((r, i) => (
                  <li key={i} className="text-sm text-slate-400 truncate">
                    {r.story}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
