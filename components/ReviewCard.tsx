// Temporary stub so the History day page compiles; replaced by the real ReviewCard at merge.
export function ReviewCard({
  review,
}: {
  review: { score: number; summary: string; wins: string[]; improvements: string[]; tomorrow_tip: string };
}) {
  return (
    <section className="card space-y-1">
      <p className="font-bold">Review · {review.score}/100</p>
      <p className="text-sm text-muted">{review.summary}</p>
    </section>
  );
}
