// A Duolingo-style segmented progress ring. One arc per activity, with small
// gaps between them; the first `done` segments render in the filled color.

interface SegmentRingProps {
  total: number;
  done: number;
  size?: number;
  stroke?: number;
  filled?: string;
  track?: string;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const [sx, sy] = polar(cx, cy, r, startDeg);
  const [ex, ey] = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`;
}

export function SegmentRing({
  total,
  done,
  size = 76,
  stroke = 5,
  filled = "#a855f7",
  track = "#26304a",
}: SegmentRingProps) {
  if (total <= 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - stroke / 2;
  // Gap shrinks as segment count grows so rings stay readable.
  const gap = total === 1 ? 0 : Math.min(14, 90 / total);
  const step = 360 / total;

  const segments = Array.from({ length: total }, (_, i) => {
    const start = -90 + i * step + gap / 2;
    const end = -90 + (i + 1) * step - gap / 2;
    return { d: arc(cx, cy, r, start, end), on: i < done };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none absolute inset-1/2 -translate-x-1/2 -translate-y-1/2"
      aria-hidden="true"
    >
      {segments.map((s, i) => (
        <path
          key={i}
          d={s.d}
          fill="none"
          stroke={s.on ? filled : track}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
