// Shared painted Grodno-at-night backdrop — used across splash + login.

const STARS: readonly (readonly [number, number, number])[] = [
  [30, 60, 1.5],
  [80, 90, 1],
  [130, 40, 1.2],
  [180, 110, 1],
  [220, 50, 0.8],
  [280, 95, 1.4],
  [330, 70, 1],
  [370, 120, 0.9],
  [50, 150, 0.8],
  [100, 180, 1],
  [150, 160, 0.7],
  [200, 200, 1.2],
  [260, 170, 0.8],
  [310, 190, 1],
  [360, 220, 0.7],
];

export function GrodnoNightBackdrop() {
  return (
    <svg
      viewBox="0 0 402 874"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a1a4a" />
          <stop offset="40%" stopColor="#3a2a6a" />
          <stop offset="75%" stopColor="#6a4a7a" />
          <stop offset="100%" stopColor="#8a5a6a" />
        </linearGradient>
        <radialGradient id="moonGlow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff3a8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fff3a8" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="402" height="874" fill="url(#sky)" />

      {STARS.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#fff3e0" opacity="0.9" />
      ))}

      <circle cx="310" cy="130" r="60" fill="url(#moonGlow)" />
      <circle cx="310" cy="130" r="28" fill="#fff3c0" stroke="#2a1810" strokeWidth="2" />
      <circle cx="302" cy="122" r="3" fill="#e8c870" opacity="0.6" />
      <circle cx="318" cy="135" r="4" fill="#e8c870" opacity="0.4" />
      <circle cx="300" cy="140" r="2.5" fill="#e8c870" opacity="0.5" />

      <path
        d="M0 420 L50 380 L110 410 L170 360 L240 400 L310 370 L402 400 L402 500 L0 500 Z"
        fill="#3a2a5a"
        stroke="#2a1810"
        strokeWidth="2"
      />

      <g>
        <rect x="0" y="480" width="60" height="80" fill="#2a1a3a" stroke="#2a1810" strokeWidth="2" />
        <polygon points="0,480 30,450 60,480" fill="#1a0a2a" stroke="#2a1810" strokeWidth="2" />
        <rect x="12" y="510" width="10" height="14" fill="#ffc830" />
        <rect x="36" y="500" width="10" height="14" fill="#ffc830" />

        <rect x="340" y="470" width="62" height="90" fill="#2a1a3a" stroke="#2a1810" strokeWidth="2" />
        <polygon points="340,470 371,435 402,470" fill="#1a0a2a" stroke="#2a1810" strokeWidth="2" />
        <rect x="352" y="500" width="10" height="14" fill="#ffc830" />
        <rect x="378" y="490" width="10" height="14" fill="#ffc830" />

        <rect x="150" y="410" width="100" height="150" fill="#4a3a5a" stroke="#2a1810" strokeWidth="2.5" />
        <path
          d="M150 410 L150 400 L158 400 L158 408 L166 408 L166 400 L174 400 L174 408 L182 408 L182 400 L190 400 L190 408 L198 408 L198 400 L206 400 L206 408 L214 408 L214 400 L222 400 L222 408 L230 408 L230 400 L238 400 L238 408 L250 408 L250 410 Z"
          fill="#4a3a5a"
          stroke="#2a1810"
          strokeWidth="2"
        />
        <rect x="128" y="360" width="30" height="200" fill="#3a2a4a" stroke="#2a1810" strokeWidth="2.5" />
        <polygon points="124,360 143,330 162,360" fill="#c83232" stroke="#2a1810" strokeWidth="2.5" />
        <rect x="140" y="345" width="6" height="3" fill="#ffc830" />

        <rect x="242" y="350" width="32" height="210" fill="#3a2a4a" stroke="#2a1810" strokeWidth="2.5" />
        <polygon points="238,350 258,318 278,350" fill="#c83232" stroke="#2a1810" strokeWidth="2.5" />
        <rect x="255" y="333" width="6" height="3" fill="#ffc830" />

        <rect x="138" y="420" width="8" height="12" fill="#ffc830" opacity="0.9" />
        <rect x="138" y="460" width="8" height="12" fill="#ffc830" opacity="0.7" />
        <rect x="138" y="500" width="8" height="12" fill="#ffc830" opacity="0.9" />

        <rect x="252" y="410" width="8" height="12" fill="#ffc830" opacity="0.9" />
        <rect x="252" y="450" width="8" height="12" fill="#ffc830" opacity="0.8" />
        <rect x="252" y="490" width="8" height="12" fill="#ffc830" opacity="0.9" />

        <rect x="170" y="440" width="12" height="18" fill="#ffc830" opacity="0.9" />
        <rect x="218" y="440" width="12" height="18" fill="#ffc830" opacity="0.9" />
        <rect x="190" y="500" width="20" height="30" fill="#ffc830" opacity="0.85" />
        <path d="M190 500 L200 490 L210 500" fill="#ffc830" stroke="#2a1810" strokeWidth="1.5" />

        <rect x="50" y="510" width="80" height="70" fill="#4a2a2a" stroke="#2a1810" strokeWidth="2" />
        <polygon points="50,510 90,480 130,510" fill="#3a1a1a" stroke="#2a1810" strokeWidth="2" />
        <rect x="64" y="534" width="14" height="18" fill="#ffc830" />
        <rect x="102" y="534" width="14" height="18" fill="#ffc830" />
        <rect x="82" y="560" width="16" height="20" fill="#2a1810" />

        <rect x="270" y="505" width="75" height="75" fill="#4a2a2a" stroke="#2a1810" strokeWidth="2" />
        <polygon points="270,505 307,472 345,505" fill="#3a1a1a" stroke="#2a1810" strokeWidth="2" />
        <rect x="282" y="528" width="14" height="18" fill="#ffc830" />
        <rect x="320" y="528" width="14" height="18" fill="#ffc830" />
        <rect x="300" y="555" width="16" height="25" fill="#2a1810" />
      </g>

      <rect x="0" y="560" width="402" height="80" fill="#2e1a1a" />
      <path
        d="M0 600 Q 201 580 402 600 L402 640 L0 640 Z"
        fill="#3a2a1a"
        stroke="#2a1810"
        strokeWidth="2"
      />

      <ellipse cx="100" cy="580" rx="130" ry="18" fill="#fff3e0" opacity="0.08" />
      <ellipse cx="320" cy="590" rx="150" ry="20" fill="#fff3e0" opacity="0.06" />

      <rect x="0" y="600" width="402" height="274" fill="#000" opacity="0.35" />
    </svg>
  );
}
