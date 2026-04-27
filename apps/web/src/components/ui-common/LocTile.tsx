import type { ReactNode } from 'react';
import { GameIcon } from '@/components/game-icons';

export interface LocTileProps {
  icon: ReactNode;
  label: ReactNode;
  sub?: ReactNode;
  bg: string;
  onClick?: () => void;
  lock?: boolean;
  badge?: ReactNode;
}

export function LocTile({ icon, label, sub, bg, onClick, lock, badge }: LocTileProps) {
  return (
    <div
      className="clickable no-select"
      onClick={lock ? undefined : onClick}
      style={{
        position: 'relative',
        background: bg,
        border: '3px solid #2a1810',
        borderRadius: 14,
        padding: 10,
        boxShadow: '3px 3px 0 #2a1810',
        minHeight: 110,
        opacity: lock ? 0.6 : 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#2a1810 1px, transparent 1.5px)',
          backgroundSize: '8px 8px',
          opacity: 0.1,
          borderRadius: 11,
          overflow: 'hidden',
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          marginTop: 4,
        }}
      >
        {icon}
      </div>
      <div
        className="h-title"
        style={{ fontSize: 16, textAlign: 'center', marginTop: 4, position: 'relative' }}
      >
        {label}
      </div>
      {sub && (
        <div
          className="h-title"
          style={{
            fontSize: 13,
            textAlign: 'center',
            color: '#5a3a2a',
            position: 'relative',
            marginTop: 2,
            letterSpacing: 0.4,
            fontWeight: 'normal',
            opacity: 0.85,
          }}
        >
          {sub}
        </div>
      )}
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: '#c83232',
            color: '#fff',
            borderRadius: 999,
            minWidth: 24,
            height: 24,
            padding: '0 6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Luckiest Guy',
            fontSize: 14,
            border: '2.5px solid #2a1810',
            boxShadow: '2px 2px 0 #2a1810',
          }}
        >
          {badge}
        </div>
      )}
      {lock && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(42,24,16,0.25)',
          }}
        >
          <GameIcon name="lock" size={32} />
        </div>
      )}
    </div>
  );
}
