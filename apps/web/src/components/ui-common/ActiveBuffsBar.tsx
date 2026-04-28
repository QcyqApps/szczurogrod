// Pasek aktywnych elixir buff'ów — pod TopBar'em. Ukrywa się gdy pusta lista.
//
// Źródło prawdy: `char.activeBuffs` z `me.get`. Serwer lazy-purge'uje wygasłe,
// my tylko renderujemy i robimy lokalny countdown. Gdy TTL schodzi do zera,
// invalidujemy `me.get` żeby odświeżyć stan (na wypadek gdyby serwer akurat
// nie usunął tego wiersza przy poprzednim me.get).

import { useEffect, useState } from 'react';
import { trpc } from '@/api/trpc';
import { useT } from '@/i18n';
import {
  IcoClock,
  IcoHeart,
  IcoMagic,
  IcoShield,
  IcoSword,
} from '@/components/icons';
import type { ActiveBuffInfo, BuffKind } from '@grodno/shared';

interface BuffMeta {
  label: string;
  color: string;
  bg: string;
  icon: (s: number) => React.ReactNode;
  format: (mag: number) => string;
}

const META: Record<BuffKind, BuffMeta> = {
  hp_max_pct: {
    label: 'HP MAX',
    color: '#fff',
    bg: '#c83232',
    icon: (s) => <IcoHeart s={s} />,
    format: (m) => `+${m}%`,
  },
  mp_max_pct: {
    label: 'MP MAX',
    color: '#fff',
    bg: '#3a6dc8',
    icon: (s) => <IcoMagic s={s} />,
    format: (m) => `+${m}%`,
  },
  atk_flat: {
    label: 'ATK',
    color: '#2a1810',
    bg: '#e8a860',
    icon: (s) => <IcoSword s={s} />,
    format: (m) => `+${m}`,
  },
  def_flat: {
    label: 'DEF',
    color: '#fff',
    bg: '#6a7a5a',
    icon: (s) => <IcoShield s={s} />,
    format: (m) => `+${m}`,
  },
  mag_flat: {
    label: 'MAG',
    color: '#fff',
    bg: '#8a3a8a',
    icon: (s) => <IcoMagic s={s} />,
    format: (m) => `+${m}`,
  },
  spd_flat: {
    label: 'SPD',
    color: '#2a1810',
    bg: '#b0d8a0',
    icon: (s) => <IcoClock s={s} />,
    format: (m) => `+${m}`,
  },
};

function formatTtl(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  const s = Math.floor(ms / 1000);
  return `${s}s`;
}

export interface ActiveBuffsBarProps {
  buffs: readonly ActiveBuffInfo[];
}

export function ActiveBuffsBar({ buffs }: ActiveBuffsBarProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (buffs.length === 0) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [buffs.length]);

  // Invalidate gdy cokolwiek właśnie wygasło (serwer wyczyści row przy
  // następnym me.get + usunie z aktywnych deltek).
  useEffect(() => {
    const nextExpiry = buffs.reduce<number | null>(
      (min, b) => (min === null || b.expiresAt < min ? b.expiresAt : min),
      null,
    );
    if (nextExpiry === null) return;
    const msLeft = Math.max(0, nextExpiry - Date.now());
    const t = setTimeout(() => {
      void utils.me.get.invalidate();
    }, msLeft + 500);
    return () => clearTimeout(t);
  }, [buffs, utils]);

  if (buffs.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: '6px 12px',
        background: '#1a1014',
        borderBottom: '2px solid #2a1810',
        overflowX: 'auto',
        flexWrap: 'nowrap',
      }}
    >
      {buffs.map((b) => {
        const meta = META[b.kind];
        const msLeft = Math.max(0, b.expiresAt - now);
        // Klątwy mają osobny styl — czerwone tło, prefix „−" przed magnitude,
        // border jeszcze grubszy + drobny shake ikonki (bad mood signal).
        const sign = b.isCurse ? '−' : '+';
        const valueText = `${sign}${b.magnitude}${b.kind.endsWith('_pct') ? '%' : ''}`;
        const bg = b.isCurse ? '#5a1818' : meta.bg;
        const color = b.isCurse ? '#fff' : meta.color;
        return (
          <div
            key={`${b.kind}-${b.isCurse ? 'c' : 'b'}`}
            title={t('buff.title')
              .replace('{label}', meta.label)
              .replace('{value}', valueText)
              .replace('{curse}', b.isCurse ? t('buff.curse.suffix') : '')
              .replace('{ttl}', formatTtl(msLeft))}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 8px',
              borderRadius: 999,
              background: bg,
              color,
              border: `2px solid ${b.isCurse ? '#8a2a2a' : '#2a1810'}`,
              fontFamily: 'Luckiest Guy, sans-serif',
              fontSize: 13,
              letterSpacing: 0.4,
              whiteSpace: 'nowrap',
              boxShadow: '1.5px 1.5px 0 #2a1810',
              flexShrink: 0,
            }}
          >
            {meta.icon(12)}
            <span>
              {meta.label} {valueText}
            </span>
            <span
              style={{
                opacity: 0.85,
                fontSize: 10,
                paddingLeft: 4,
                borderLeft: `1px solid ${meta.color}33`,
              }}
            >
              {formatTtl(msLeft)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
