function colorForScore(score: number): { ring: string; text: string } {
  if (score >= 90) return { ring: '#059669', text: 'text-emerald-600' }
  if (score >= 75) return { ring: '#16a34a', text: 'text-green-600' }
  if (score >= 50) return { ring: '#d97706', text: 'text-amber-600' }
  if (score >= 25) return { ring: '#ea580c', text: 'text-orange-600' }
  return { ring: '#dc2626', text: 'text-red-600' }
}

export function ScoreGauge({
  score,
  label,
  size = 140,
  strokeWidth = 12,
}: {
  score: number
  label?: string
  size?: number
  strokeWidth?: number
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - score / 100)
  const { ring, text } = colorForScore(score)

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={ring}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${text}`}>{score}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
      {label && <span className="text-sm font-medium text-slate-600">{label}</span>}
    </div>
  )
}

export function MiniScoreBar({ score, label }: { score: number; label: string }) {
  const { ring } = colorForScore(score)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-semibold text-slate-900">{score}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, backgroundColor: ring }} />
      </div>
    </div>
  )
}
