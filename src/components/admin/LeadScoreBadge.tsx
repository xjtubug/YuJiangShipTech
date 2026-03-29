'use client';

interface LeadScoreBadgeProps {
  score: number;
}

function getScoreInfo(score: number) {
  if (score >= 81)
    return {
      label: 'Very Hot',
      bg: 'bg-red-100',
      text: 'text-red-800',
      ring: 'ring-red-600/20',
    };
  if (score >= 51)
    return {
      label: 'Hot',
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      ring: 'ring-orange-600/20',
    };
  if (score >= 21)
    return {
      label: 'Warm',
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      ring: 'ring-amber-600/20',
    };
  return {
    label: 'Cold',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    ring: 'ring-gray-500/20',
  };
}

export default function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  const { label, bg, text, ring } = getScoreInfo(score);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${bg} ${text} ring-1 ring-inset ${ring}`}
    >
      {score} · {label}
    </span>
  );
}
