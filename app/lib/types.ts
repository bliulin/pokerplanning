export type CardValue = "0.5" |"1" | "2" | "3" | "5" | "8" | "13" | "21" | "?" | "☕";

export interface Participant {
  id: string;
  name: string;
  role: "player" | "spectator";
}

export interface Round {
  story: string;
  votes: Record<string, CardValue>;
  revealed: boolean;
}

export interface Game {
  id: string;
  name: string;
  facilitatorId: string;
  participants: Participant[];
  currentRound: Round | null;
  completedRounds: Round[];
}
