'use client';

interface RingScoreProps {
  score: number; // 1–10
  size?: number; // px, default 80
  strokeWidth?: number;
}

const URGENCY_COLORS: Record<string, string> = {
  low: '#006E2F',
  medium: '#855300',
  high: '#b91a24',
};

function urgencyFromScore(score: number): string {
  if (score >= 7) return 'low';
  if (score >= 4) return 'medium';
  return 'high';
}

export default function RingScore({ score, size = 80, strokeWidth = 7 }: RingScoreProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(10, score)) / 10;
  const dash = circumference * pct;
  const urgency = urgencyFromScore(score);
  const color = URGENCY_COLORS[urgency];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Cleanliness score ${score} out of 10`}
      role="img"
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#bccbb9"
        strokeWidth={strokeWidth}
      />
      {/* Progress */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Label */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: size * 0.28,
          fill: color,
        }}
      >
        {score.toFixed(1)}
      </text>
    </svg>
  );
}
