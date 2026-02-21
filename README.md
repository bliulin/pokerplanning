# Poker Planning

A real-time scrum estimation app built with **Remix**, **TypeScript**, **Vite**, and **Tailwind CSS**.

## What it does

Players join a shared game room and vote on story point estimates using Fibonacci-style cards. A facilitator controls the flow: starting rounds, revealing votes, and moving to the next story.

## Project structure

```
app/
  root.tsx              ← HTML shell / layout
  tailwind.css          ← global styles entry
  lib/
    types.ts            ← shared type definitions
    game.server.ts      ← server-side game state & logic
  routes/
    _index.tsx          ← "/" — create a game
    game.$id.tsx        ← "/game/:id" — the game room
  components/
    ParticipantList.tsx ← sidebar player list
    RoundResults.tsx    ← post-reveal results view
    CardDeck.tsx        ← voting card UI
vite.config.ts          ← build config (Remix Vite plugin)
```

## Server-side game logic — `game.server.ts`

The `.server.ts` suffix tells Remix to never bundle this file into the browser. All game state lives in a plain in-memory `Map` on the Node server.

| Function | Description |
|---|---|
| `createGame(name)` | Creates a new game with a UUID |
| `getGame(id)` | Looks up a game by ID |
| `joinGame(gameId, name)` | Adds a participant; first joiner becomes facilitator |
| `startRound(gameId, story)` | Sets the active round on the game |
| `castVote(gameId, playerId, value)` | Records a vote in the current round |
| `revealVotes(gameId)` | Flips `currentRound.revealed = true` |
| `nextRound(gameId)` | Archives the current round, resets to null |

> **Note:** State is in-memory only — a server restart wipes all games.

## Routes

### `_index.tsx` — Home page (`/`)

Renders a form to enter a game name. On submit, the Remix `action` calls `createGame()` and redirects to `/game/:id`.

### `game.$id.tsx` — Game room (`/game/:id`)

The main route with three Remix exports:

- **`loader`** — runs on every load/poll. Reads the game from memory and identifies the current player via a `playerId` cookie.
- **`action`** — handles all form submissions via an `intent` field: `join`, `start-round`, `vote`, `reveal`, `next-round`.
- **`GameRoom` component** — renders one of three views depending on state:
  1. Join form (not yet a participant)
  2. Voting view (active round, votes hidden)
  3. Results view (after facilitator reveals votes)

Updates are delivered by polling: the client re-runs the loader every 3 seconds using `useRevalidator()`.

## Running the app

```bash
npm install

# Development
npm run dev

# Production build
npm run build
npm start
```
