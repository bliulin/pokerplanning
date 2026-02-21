import type { Participant, CardValue } from "~/lib/types";

interface ParticipantListProps {
  participants: Participant[];
  facilitatorId: string;
  votes: Record<string, CardValue>;
  revealed: boolean;
  currentParticipantId: string;
}

export default function ParticipantList({
  participants,
  facilitatorId,
  votes,
  revealed,
  currentParticipantId,
}: ParticipantListProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        Players ({participants.length})
      </h2>
      <ul className="flex flex-col gap-2">
        {participants.map((p) => {
          const hasVoted = p.id in votes;
          const voteValue = votes[p.id];
          const isYou = p.id === currentParticipantId;
          const isSpectator = p.role === "spectator";

          return (
            <li
              key={p.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-medium ${isYou ? "text-sky-300" : "text-slate-200"}`}
                >
                  {p.name}
                </span>
                {isYou && (
                  <span className="text-xs text-slate-500">(you)</span>
                )}
                {p.id === facilitatorId && (
                  <span className="text-xs text-slate-500" title="Facilitator">
                    ★
                  </span>
                )}
              </div>
              <span className="text-sm ml-2">
                {isSpectator ? (
                  <span className="text-xs text-slate-500">spectator</span>
                ) : revealed && hasVoted ? (
                  <span className="font-bold text-sky-400">{voteValue}</span>
                ) : hasVoted ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-slate-600">–</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
