import { Form } from "@remix-run/react";
import type { CardValue } from "~/lib/types";

const CARD_VALUES: CardValue[] = [
  "0.5", "1", "2", "3", "5", "8", "13", "21", "?", "☕",
];

interface CardDeckProps {
  selectedValue?: CardValue;
}

export default function CardDeck({ selectedValue }: CardDeckProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-400">Pick your estimate</p>
      <div className="flex flex-wrap gap-3">
        {CARD_VALUES.map((value) => (
          <Form key={value} method="post">
            <input type="hidden" name="intent" value="vote" />
            <input type="hidden" name="value" value={value} />
            <button
              type="submit"
              className={`w-16 h-24 rounded-xl font-bold text-xl border-2 transition-all ${
                selectedValue === value
                  ? "bg-sky-400 border-sky-400 text-slate-900 scale-105 shadow-lg shadow-sky-500/20"
                  : "bg-slate-800 border-slate-600 text-slate-200 hover:border-sky-500 hover:bg-slate-700"
              }`}
            >
              {value}
            </button>
          </Form>
        ))}
      </div>
    </div>
  );
}
