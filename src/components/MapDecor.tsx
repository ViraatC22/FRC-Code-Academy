// Decorative FRC/robotics landmarks that flank the lesson path, Duolingo-style.
// Flat, stylized SVGs drawn from the app palette. Purely cosmetic.

export type DecorKind =
  | "battery"
  | "gear"
  | "wrench"
  | "toolbox"
  | "coffee"
  | "antenna"
  | "wheel"
  | "robot"
  | "apriltag"
  | "cone"
  | "bolt"
  | "cube";

const C = {
  panel: "#1a2235",
  panel2: "#222c44",
  edge: "#34406090",
  line: "#3a466a",
  brand: "#3b82f6",
  brand2: "#60a5fa",
  accent: "#f59e0b",
  accent2: "#fbbf24",
  good: "#22c55e",
  purple: "#a855f7",
  steel: "#7c89a8",
  steelDark: "#4b5572",
  white: "#e7ecf5",
};

function Battery() {
  return (
    <>
      <rect x="9" y="16" width="30" height="22" rx="4" fill={C.panel2} stroke={C.line} strokeWidth="2" />
      <rect x="39" y="22" width="4" height="10" rx="1.5" fill={C.line} />
      <rect x="12" y="19" width="10" height="16" rx="2" fill={C.good} />
      <path d="M27 19l-5 9h4l-2 7 7-10h-4z" fill={C.accent2} />
    </>
  );
}

function Gear() {
  // 8-tooth gear via rotated rectangles + ring + hub
  const teeth = Array.from({ length: 8 }, (_, i) => (
    <rect
      key={i}
      x="22"
      y="3"
      width="8"
      height="9"
      rx="1.5"
      fill={C.steel}
      transform={`rotate(${i * 45} 26 26)`}
    />
  ));
  return (
    <>
      {teeth}
      <circle cx="26" cy="26" r="15" fill={C.steelDark} />
      <circle cx="26" cy="26" r="11" fill={C.panel2} stroke={C.steel} strokeWidth="2" />
      <circle cx="26" cy="26" r="4.5" fill={C.steel} />
    </>
  );
}

function Wrench() {
  return (
    <>
      <path
        d="M33 9a8 8 0 0 0-9.5 10.2L9 33.7l4.3 4.3 14.5-14.5A8 8 0 0 0 38 14l-4.6 4.6-3.9-3.9L34 10z"
        fill={C.steel}
        stroke={C.steelDark}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="36" r="2" fill={C.panel} />
    </>
  );
}

function Toolbox() {
  return (
    <>
      <path d="M16 16h16a2 2 0 0 1 2 2v2H14v-2a2 2 0 0 1 2-2z" fill={C.steelDark} />
      <rect x="8" y="20" width="32" height="18" rx="3" fill={C.accent} />
      <rect x="8" y="26" width="32" height="4" fill={C.accent2} />
      <rect x="20" y="14" width="8" height="4" rx="1.5" fill={C.steel} />
    </>
  );
}

function Coffee() {
  // A nod to Java
  return (
    <>
      <path d="M6 10c2-3 4 0 6-2M14 10c2-3 4 0 6-2" stroke={C.steel} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M10 18h22v8a11 11 0 0 1-11 11h0A11 11 0 0 1 10 26z" fill={C.panel2} stroke={C.line} strokeWidth="2" />
      <path d="M32 21h4a4 4 0 0 1 0 8h-2" fill="none" stroke={C.line} strokeWidth="2" />
      <ellipse cx="21" cy="18" rx="11" ry="3" fill={C.steelDark} />
      <path d="M16 24h10v3H16z" fill={C.accent} opacity="0.5" />
    </>
  );
}

function Antenna() {
  return (
    <>
      <path d="M22 20l8 18h-16z" fill={C.steelDark} />
      <path d="M22 20l8 18h-16z" fill="none" stroke={C.steel} strokeWidth="1.5" />
      <line x1="18" y1="30" x2="26" y2="30" stroke={C.steel} strokeWidth="1.5" />
      <circle cx="22" cy="18" r="3" fill={C.brand2} />
      <path d="M29 11a10 10 0 0 1 0 14M33 7a15 15 0 0 1 0 22" fill="none" stroke={C.brand} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
    </>
  );
}

function Wheel() {
  return (
    <>
      <circle cx="24" cy="24" r="16" fill={C.steelDark} stroke={C.line} strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x="23" y="8" width="2" height="5" rx="1" fill={C.steel} transform={`rotate(${i * 30} 24 24)`} />
      ))}
      <circle cx="24" cy="24" r="8" fill={C.panel2} stroke={C.steel} strokeWidth="2" />
      <circle cx="24" cy="24" r="2.5" fill={C.steel} />
    </>
  );
}

function Robot() {
  return (
    <>
      <line x1="24" y1="6" x2="24" y2="12" stroke={C.steel} strokeWidth="2" />
      <circle cx="24" cy="6" r="2.5" fill={C.accent} />
      <rect x="10" y="12" width="28" height="22" rx="6" fill={C.panel2} stroke={C.brand} strokeWidth="2" />
      <circle cx="19" cy="22" r="3.5" fill={C.brand2} />
      <circle cx="29" cy="22" r="3.5" fill={C.brand2} />
      <rect x="17" y="28" width="14" height="3" rx="1.5" fill={C.steel} />
      <rect x="14" y="34" width="20" height="6" rx="2" fill={C.steelDark} />
    </>
  );
}

function AprilTag() {
  // Stylized fiducial marker
  const cells = [
    [1, 0, 1, 0],
    [0, 1, 1, 0],
    [0, 1, 0, 1],
    [1, 0, 1, 1],
  ];
  return (
    <>
      <rect x="8" y="8" width="32" height="32" rx="3" fill={C.white} />
      <rect x="11" y="11" width="26" height="26" fill="#0a0e17" />
      {cells.flatMap((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect key={`${r}-${c}`} x={14 + c * 6} y={14 + r * 6} width="6" height="6" fill={C.white} />
          ) : null,
        ),
      )}
    </>
  );
}

function Cone() {
  return (
    <>
      <ellipse cx="24" cy="39" rx="14" ry="3" fill={C.steelDark} />
      <path d="M24 8l10 30H14z" fill={C.accent} stroke={C.steelDark} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 22h8M18.5 30h11" stroke={C.white} strokeWidth="3" strokeLinecap="round" opacity="0.85" />
    </>
  );
}

function Bolt() {
  return (
    <>
      <path d="M24 8l13.9 8v16L24 40l-13.9-8V16z" fill={C.steel} stroke={C.steelDark} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="6" fill={C.panel2} />
    </>
  );
}

function Cube() {
  // game-piece crate
  return (
    <>
      <path d="M24 8l14 8v16l-14 8-14-8V16z" fill={C.purple} opacity="0.85" />
      <path d="M24 8l14 8-14 8-14-8z" fill={C.brand2} opacity="0.7" />
      <path d="M24 24v16M24 24l14-8M24 24L10 16" stroke="#0a0e17" strokeWidth="1.5" opacity="0.4" />
    </>
  );
}

const RENDERERS: Record<DecorKind, () => React.ReactElement> = {
  battery: Battery,
  gear: Gear,
  wrench: Wrench,
  toolbox: Toolbox,
  coffee: Coffee,
  antenna: Antenna,
  wheel: Wheel,
  robot: Robot,
  apriltag: AprilTag,
  cone: Cone,
  bolt: Bolt,
  cube: Cube,
};

export function Decoration({
  kind,
  size = 52,
  className = "",
  style,
}: {
  kind: DecorKind;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Body = RENDERERS[kind];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 52"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <Body />
    </svg>
  );
}
