import { Form, useActionData } from "@remix-run/react";
import {
  redirect,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { createGame } from "~/lib/game.server";

export const meta: MetaFunction = () => [{ title: "Poker Planning" }];

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const gameName = String(formData.get("gameName") ?? "").trim();

  if (!gameName) {
    return { error: "Please enter a game name" };
  }

  const game = createGame(gameName);
  return redirect(`/game/${game.id}`);
}

export default function Index() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center flex flex-col items-center gap-6">
        <h1 className="text-5xl font-bold tracking-tight text-slate-50">
          Poker Planning
        </h1>
        <p className="text-lg text-slate-400">
          Estimate work as a team, fast and fun.
        </p>
        <Form method="post" className="flex flex-col items-center gap-4 w-80">
          <input
            type="text"
            name="gameName"
            placeholder="Game name…"
            className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
            autoFocus
            required
          />
          {actionData && "error" in actionData && (
            <p className="text-red-400 text-sm">{actionData.error}</p>
          )}
          <button
            type="submit"
            className="w-full px-10 py-3.5 text-lg font-semibold text-slate-900 bg-sky-400 rounded-lg hover:bg-sky-300 active:scale-95 transition-all"
          >
            Start new game
          </button>
        </Form>
      </div>
    </div>
  );
}
