import type { Round, Participant, CardValue } from "~/lib/types";

interface RoundResultsProps {
  round: Round;
  participants: Participant[];
}

function getConsensus(votes: Record<string, CardValue>): CardValue | null {
  const values = Object.values(votes);
  if (values.length === 0) return null;
  return new Set(values).size === 1 ? values[0] : null;
}

function getAverage(votes: Record<string, CardValue>): string | null {
  const numeric = Object.values(votes)
    .map((v) => parseInt(v, 10))
    .filter((n) => !isNaN(n));
  if (numeric.length === 0) return null;
  return (numeric.reduce((a, b) => a + b, 0) / numeric.length).toFixed(1);
}

export default function RoundResults({ round, participants }: RoundResultsProps) {
  const consensus = getConsensus(round.votes);
  const average = getAverage(round.votes);

  const nameById = Object.fromEntries(participants.map((p) => [p.id, p.name]));

  const voteGroups: Record<string, string[]> = {};
  for (const [pid, value] of Object.entries(round.votes)) {
    if (!voteGroups[value]) voteGroups[value] = [];
    voteGroups[value].push(nameById[pid] ?? "Unknown");
  }

  const sortedGroups = Object.entries(voteGroups).sort(([a], [b]) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb)) return na - nb;
    return a.localeCompare(b);
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          Story
        </p>
        <h2 className="text-xl font-semibold text-slate-100">{round.story}</h2>
      </div>

      {/* Summary stat */}
      {consensus ? (
        <div className="inline-flex flex-col items-center bg-emerald-900/40 border border-emerald-700 rounded-xl px-8 py-4 self-start">
          <p className="text-xs text-emerald-400 uppercase tracking-wider mb-1">
            Consensus 🎉
          </p>
          <p className="text-4xl font-bold text-emerald-300">{consensus}</p>
        </div>
      ) : average ? (
        <div className="inline-flex flex-col items-center bg-slate-800 rounded-xl px-8 py-4 self-start">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Average
          </p>
          <p className="text-4xl font-bold text-slate-100">{average}</p>
        </div>
      ) : null}

      {/* Vote breakdown */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-slate-400">Vote breakdown</p>
        <div className="flex flex-col gap-2">
          {sortedGroups.map(([value, names]) => (
            <div key={value} className="flex items-center gap-4">
              <span className="w-14 h-20 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-600 font-bold text-xl text-sky-400 shrink-0">
                {value}
              </span>
              <div>
                <p className="text-sm text-slate-200">{names.join(", ")}</p>
                <p className="text-xs text-slate-500">
                  {names.length} vote{names.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
