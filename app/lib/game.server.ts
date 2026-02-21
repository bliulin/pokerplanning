import type { CardValue, Game, Participant, Round } from "./types";

export type { CardValue, Game, Participant, Round };

const games = new Map<string, Game>();

export function createGame(name: string): Game {
  const id = crypto.randomUUID();
  const game: Game = {
    id,
    name,
    facilitatorId: "",
    participants: [],
    currentRound: null,
    completedRounds: [],
  };
  games.set(id, game);
  return game;
}

export function getGame(id: string): Game | undefined {
  return games.get(id);
}

export function joinGame(gameId: string, participantName: string): Participant {
  const game = games.get(gameId);
  if (!game) throw new Error(`Game ${gameId} not found`);

  const participant: Participant = {
    id: crypto.randomUUID(),
    name: participantName,
  };

  game.participants.push(participant);

  if (game.participants.length === 1) {
    game.facilitatorId = participant.id;
  }

  return participant;
}

export function startRound(gameId: string, story: string): Round {
  const game = games.get(gameId);
  if (!game) throw new Error(`Game ${gameId} not found`);

  const round: Round = { story, votes: {}, revealed: false };
  game.currentRound = round;
  return round;
}

export function castVote(
  gameId: string,
  participantId: string,
  value: CardValue
): void {
  const game = games.get(gameId);
  if (!game) throw new Error(`Game ${gameId} not found`);
  if (!game.currentRound) throw new Error("No active round");
  if (game.currentRound.revealed) throw new Error("Votes already revealed");

  game.currentRound.votes[participantId] = value;
}

export function revealVotes(gameId: string): void {
  const game = games.get(gameId);
  if (!game) throw new Error(`Game ${gameId} not found`);
  if (!game.currentRound) throw new Error("No active round");

  game.currentRound.revealed = true;
}

export function nextRound(gameId: string): void {
  const game = games.get(gameId);
  if (!game) throw new Error(`Game ${gameId} not found`);

  if (game.currentRound) {
    game.completedRounds.push(game.currentRound);
    game.currentRound = null;
  }
}
