import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@/components/game-icons';
import { useT } from '@/i18n';
import type { DictKey } from '@/i18n';

export type Tab = 'town' | 'char' | 'quest' | 'arena' | 'guild';

interface TabDef {
  id: Tab;
  labelKey: DictKey;
  icon: IconName;
}

const TABS: readonly TabDef[] = [
  { id: 'town', labelKey: 'tabs.town', icon: 'castle' },
  { id: 'char', labelKey: 'tabs.char', icon: 'helmet' },
  { id: 'quest', labelKey: 'tabs.quest', icon: 'scroll' },
  { id: 'arena', labelKey: 'tabs.arena', icon: 'crossed' },
  { id: 'guild', labelKey: 'tabs.guild', icon: 'banner' },
];

export interface TabBarProps {
  tab: Tab | null;
  setTab: (t: Tab) => void;
}

export function TabBar({ tab, setTab }: TabBarProps) {
  const t = useT();
  return (
    <div
      style={{
        // Flex child w kolumnie App.tsx — NIE position:absolute. Nawigacja
        // zajmuje miejsce w flow, scroll container automatycznie dopasowuje
        // wysokość (flex:1). Eliminuje overlap + elastic scroll na iOS.
        flexShrink: 0,
        background: 'var(--parchment)',
        borderTop: '3px solid #2a1810',
        // Bottom padding = rezerwa na home indicator iOS mockupu (desktop).
        padding: '6px 4px calc(6px + var(--frame-bottom))',
        display: 'flex',
        justifyContent: 'space-around',
        zIndex: 40,
        touchAction: 'manipulation',
      }}
    >
      {TABS.map((tab_def) => {
        const active = tab === tab_def.id;
        return (
          <div
            key={tab_def.id}
            className="clickable no-select"
            onClick={() => setTab(tab_def.id)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '4px 2px',
              borderRadius: 10,
              background: active ? '#2a1810' : 'transparent',
              color: active ? '#d4a24c' : '#2a1810',
              border: active ? '2px solid #2a1810' : '2px solid transparent',
              boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
              transform: active ? 'translate(-1px,-1px)' : 'none',
              transition: 'all 120ms ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                filter: active
                  ? 'brightness(0) saturate(100%) invert(75%) sepia(41%) saturate(612%) hue-rotate(359deg) brightness(92%) contrast(88%)'
                  : 'none',
              }}
            >
              <GameIcon name={tab_def.icon} size={26} />
            </div>
            <div
              className="h-title"
              style={{
                fontSize: 13,
                letterSpacing: 0.3,
                marginTop: 1,
                color: active ? '#d4a24c' : '#2a1810',
              }}
            >
              {t(tab_def.labelKey)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
