import { AvatarPortrait } from '@/components/avatar';
import { IcoCoin, IcoGem } from '@/components/icons';
import type { CharacterHeader } from '@grodno/shared';
import { StatBar } from './StatBar';

export interface TopBarProps {
  char: CharacterHeader;
  onProfile?: () => void;
  onGemShop?: () => void;
  onSettings?: () => void;
}

export function TopBar({ char, onProfile, onGemShop, onSettings }: TopBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: 'linear-gradient(180deg, #f3ead9 0%, #e8dcb9 100%)',
        borderBottom: '3px solid #2a1810',
      }}
    >
      <div className="clickable no-select" onClick={onProfile} style={{ position: 'relative' }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            overflow: 'hidden',
            border: '2.5px solid #2a1810',
            boxShadow: '2px 2px 0 #2a1810',
            background: '#e8b870',
          }}
        >
          <AvatarPortrait appearance={char.appearance} cls={char.cls} size={46} />
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            background: '#d4a24c',
            border: '2px solid #2a1810',
            borderRadius: 999,
            padding: '0 5px',
            fontFamily: 'Luckiest Guy',
            fontSize: 13,
            lineHeight: 1.4,
            boxShadow: '1px 1px 0 #2a1810',
          }}
        >
          L{char.lvl}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="h-title"
          style={{
            fontSize: 14,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {char.name}
        </div>
        <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <StatBar cur={char.xp} max={char.xpMax} kind="xp" />
          <div style={{ display: 'flex', gap: 4 }}>
            <div style={{ flex: 1, minWidth: 0 }} title={`HP ${char.hp}/${char.hpMax}`}>
              <StatBar cur={char.hp} max={char.hpMax} kind="hp" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }} title={`MP ${char.mp}/${char.mpMax}`}>
              <StatBar cur={char.mp} max={char.mpMax} kind="mp" />
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          className="pip gold clickable no-select"
          style={{ fontSize: 12, cursor: 'pointer' }}
          onClick={onGemShop}
        >
          <IcoCoin s={13} /> {char.gold.toLocaleString('pl')}
        </div>
        <div
          className="pip clickable no-select"
          style={{ fontSize: 12, background: '#a0d8f0', cursor: 'pointer', position: 'relative' }}
          onClick={onGemShop}
        >
          <IcoGem s={13} /> {char.gems}
          <span
            style={{
              position: 'absolute',
              right: -6,
              top: -6,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: '#c83232',
              color: '#fff',
              border: '2px solid #2a1810',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Luckiest Guy',
              fontSize: 14,
              lineHeight: 1,
              boxShadow: '1px 1px 0 #2a1810',
            }}
          >
            +
          </span>
        </div>
      </div>
      {onSettings && (
        <button
          type="button"
          aria-label="Ustawienia"
          onClick={onSettings}
          className="clickable no-select"
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: '#e8dcb9',
            border: '2.5px solid #2a1810',
            boxShadow: '2px 2px 0 #2a1810',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2a1810" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      )}
    </div>
  );
}
