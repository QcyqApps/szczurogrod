// Hand-drawn glyph icons — compact inline SVG used in pip / resource displays.

export interface IcoProps {
  s?: number;
}

export function IcoCoin({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" fill="#d4a24c" stroke="#2a1810" strokeWidth="2" />
      <text
        x="10"
        y="14"
        textAnchor="middle"
        fontFamily="Luckiest Guy"
        fontSize="10"
        fill="#2a1810"
      >
        $
      </text>
    </svg>
  );
}

export function IcoGem({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      <path d="M4 8 L10 3 L16 8 L10 18 Z" fill="#6ab8e0" stroke="#2a1810" strokeWidth="2" />
      <path d="M4 8 L16 8" stroke="#2a1810" strokeWidth="1.5" />
      <path d="M10 3 L10 8 L7 8 Z" fill="#a0d8f0" />
    </svg>
  );
}

export function IcoHeart({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      <path
        d="M10 17 Q2 11 2 7 Q2 3 6 3 Q8 3 10 6 Q12 3 14 3 Q18 3 18 7 Q18 11 10 17 Z"
        fill="#c83232"
        stroke="#2a1810"
        strokeWidth="2"
      />
    </svg>
  );
}

export function IcoSword({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      <path
        d="M14 2 L18 2 L18 6 L8 16 L6 18 L3 15 L4 13 Z"
        fill="#c8c8c8"
        stroke="#2a1810"
        strokeWidth="2"
      />
      <path d="M4 13 L7 16" stroke="#2a1810" strokeWidth="2" />
    </svg>
  );
}

export function IcoShield({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      <path
        d="M10 2 L3 4 L3 10 Q3 15 10 18 Q17 15 17 10 L17 4 Z"
        fill="#3a5a8a"
        stroke="#2a1810"
        strokeWidth="2"
      />
      <path d="M10 6 L10 14 M6 10 L14 10" stroke="#d4a24c" strokeWidth="2" />
    </svg>
  );
}

export function IcoMagic({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      <path
        d="M10 1 L11 8 L18 9 L11 10 L10 17 L9 10 L2 9 L9 8 Z"
        fill="#a04ef0"
        stroke="#2a1810"
        strokeWidth="2"
      />
    </svg>
  );
}

export function IcoKey({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      {/* bow (round grip) */}
      <circle cx="6" cy="10" r="4" fill="#f0c840" stroke="#2a1810" strokeWidth="2" />
      <circle cx="6" cy="10" r="1.5" fill="#2a1810" />
      {/* shaft + teeth */}
      <path
        d="M10 9 L17 9 L17 11 L15 11 L15 13 L13 13 L13 11 L10 11 Z"
        fill="#f0c840"
        stroke="#2a1810"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IcoPaw({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      {/* main pad */}
      <path
        d="M10 19 Q4 19 4 14 Q4 10 10 10 Q16 10 16 14 Q16 19 10 19 Z"
        fill="#8a5a3a"
        stroke="#2a1810"
        strokeWidth="1.5"
      />
      {/* toe pads */}
      <ellipse cx="4.5" cy="8" rx="1.7" ry="2.2" fill="#8a5a3a" stroke="#2a1810" strokeWidth="1.5" />
      <ellipse cx="8" cy="5" rx="1.7" ry="2.2" fill="#8a5a3a" stroke="#2a1810" strokeWidth="1.5" />
      <ellipse cx="12" cy="5" rx="1.7" ry="2.2" fill="#8a5a3a" stroke="#2a1810" strokeWidth="1.5" />
      <ellipse cx="15.5" cy="8" rx="1.7" ry="2.2" fill="#8a5a3a" stroke="#2a1810" strokeWidth="1.5" />
    </svg>
  );
}

export function IcoClock({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="7.5" fill="#f3ead9" stroke="#2a1810" strokeWidth="2" />
      {/* hour + minute hands */}
      <path
        d="M10 10 L10 5.5 M10 10 L13.5 11.5"
        stroke="#2a1810"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="10" r="1" fill="#2a1810" />
    </svg>
  );
}

export function IcoHourglass({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      <path
        d="M5 3 L15 3 L15 5 L11 10 L15 15 L15 17 L5 17 L5 15 L9 10 L5 5 Z"
        fill="#e8c870"
        stroke="#2a1810"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* bottom pile of 'sand' */}
      <path d="M7 16 L13 16 L11 13 L9 13 Z" fill="#8a5a3a" />
    </svg>
  );
}

export function IcoRefresh({ s = 18 }: IcoProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20">
      {/* circular arrow */}
      <path
        d="M15.5 10 A5.5 5.5 0 1 1 10 4.5"
        fill="none"
        stroke="#2a1810"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* arrowhead */}
      <path d="M10 2 L10 7.5 L14.5 6 Z" fill="#2a1810" stroke="#2a1810" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export interface IcoChestProps {
  s?: number;
  open?: boolean;
}

export function IcoChest({ s = 40, open = false }: IcoChestProps) {
  return (
    <svg width={s} height={s} viewBox="0 0 50 50">
      <rect
        x="6"
        y="22"
        width="38"
        height="22"
        fill="#8a5a2a"
        stroke="#2a1810"
        strokeWidth="2.5"
        rx="2"
      />
      <rect x="6" y="22" width="38" height="6" fill="#6a3a1a" stroke="#2a1810" strokeWidth="2" />
      {!open ? (
        <>
          <path
            d="M6 22 Q6 10 25 10 Q44 10 44 22 Z"
            fill="#a86a2a"
            stroke="#2a1810"
            strokeWidth="2.5"
          />
          <rect
            x="22"
            y="22"
            width="6"
            height="10"
            fill="#d4a24c"
            stroke="#2a1810"
            strokeWidth="2"
          />
          <circle cx="25" cy="27" r="1.5" fill="#2a1810" />
        </>
      ) : (
        <>
          <path
            d="M6 22 Q6 2 25 2 Q44 2 44 22 L40 22 Q40 8 25 8 Q10 8 10 22 Z"
            fill="#a86a2a"
            stroke="#2a1810"
            strokeWidth="2.5"
          />
          <circle cx="18" cy="16" r="3" fill="#d4a24c" stroke="#2a1810" strokeWidth="1.5" />
          <circle cx="28" cy="14" r="3" fill="#d4a24c" stroke="#2a1810" strokeWidth="1.5" />
          <path d="M14 20 L36 20" stroke="#fff3c0" strokeWidth="2" />
        </>
      )}
      <rect x="14" y="22" width="3" height="22" fill="#3a2a1a" />
      <rect x="33" y="22" width="3" height="22" fill="#3a2a1a" />
    </svg>
  );
}
