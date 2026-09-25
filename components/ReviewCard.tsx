import { BarsIcon, BulbIcon, CheckIcon, FlameIcon } from "./icons";
import { Ring } from "./home/Ring";
import { Card } from "./ui";

export interface ReviewCardData {
  score: number;
  summary: string;
  wins: string[];
  improvements: string[];
  tomorrow_tip: string;
}

const scoreColor = (s: number) =>
  s >= 75 ? "var(--color-protein)" : s >= 50 ? "var(--color-carbs)" : "var(--color-danger)";

/** Presentational daily review (score, summary, wins, improvements, tip). No fetching or dismissal. */
export function ReviewCard({ review }: { review: ReviewCardData }) {
  return (
    <div className="space-y-3">
      <Card className="flex items-center gap-4">
        <Ring value={review.score} color={scoreColor(review.score)} size={112} stroke={11}>
          <span className="text-3xl font-extrabold leading-none">{review.score}</span>
          <span className="mt-1 text-xs text-muted">out of 100</span>
        </Ring>
        <div className="min-w-0 border-l border-line pl-4">
          <h3 className="text-lg font-bold">Score</h3>
          <p className="mt-1 text-sm text-muted">{review.summary}</p>
        </div>
      </Card>

      {review.wins.length > 0 && (
        <Card className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <BarsIcon />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold">What went well</h3>
            <ul className="mt-2 space-y-2">
              {review.wins.map((w, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-protein text-white">
                    <CheckIcon className="h-3.5 w-3.5" />
                  </span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {review.improvements.length > 0 && (
        <Card className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-flame-soft text-flame">
            <FlameIcon />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold">What could be better</h3>
            <ul className="mt-2 space-y-2">
              {review.improvements.map((m, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-danger/35" aria-hidden />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      <Card className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-limit-soft text-limit">
          <BulbIcon />
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-bold">Tip for tomorrow</h3>
          <p className="mt-1 text-sm text-muted">{review.tomorrow_tip}</p>
        </div>
      </Card>
    </div>
  );
}
