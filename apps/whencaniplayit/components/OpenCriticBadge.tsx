import { Star } from 'lucide-react';

interface OpenCriticBadgeProps {
  tier?: string;
  score?: number;
}

const getTierColor = (tier?: string) => {
  switch (tier) {
    case 'Mighty':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-200';
    case 'Strong':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200';
    case 'Fair':
      return 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-200';
    case 'Weak':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-200';
  }
};

export function OpenCriticBadge({ tier, score }: OpenCriticBadgeProps) {
  const roundedScore = typeof score === 'number' ? Math.round(score) : null;

  return (
    <div className="flex items-center gap-3">
      {tier && (
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${getTierColor(tier)}`}
        >
          {tier}
        </span>
      )}

      {roundedScore !== null && (
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {roundedScore}
          </span>
        </div>
      )}
    </div>
  );
}
