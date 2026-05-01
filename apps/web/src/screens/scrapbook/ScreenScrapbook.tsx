import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { GameIcon } from '@/components/game-icons';
import type { IconName } from '@grodno/shared';
import { SCRAPBOOK_THRESHOLDS, type Rarity, type ScrapbookEntry } from '@grodno/shared';
import { useT, useContentT, type DictKey } from '@/i18n';

type RarityFilter = 'all' | Rarity;

const RARITY_LABEL_KEY: Record<RarityFilter, DictKey> = {
  all: 'scrapbook.filter.all',
  common: 'scrapbook.filter.common',
  rare: 'scrapbook.filter.rare',
  epic: 'scrapbook.filter.epic',
  legendary: 'scrapbook.filter.legendary',
};

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8a8a8a',
  rare: '#3a8ac8',
  epic: '#a04ef0',
  legendary: '#d4a24c',
};

export interface ScreenScrapbookProps {
  onBack: () => void;
}

export function ScreenScrapbook({ onBack }: ScreenScrapbookProps) {
  const t = useT();
  const listQuery = trpc.scrapbook.list.useQuery();
  const [filter, setFilter] = useState<RarityFilter>('all');
  const [selected, setSelected] = useState<ScrapbookEntry | null>(null);

  if (listQuery.isLoading) {
    return (
      <div className="screen-in" style={{ padding: 12 }}>
        <div style={{ textAlign: 'center', fontSize: 14, color: '#5a3a2a' }}>
          {t('scrapbook.loading')}
        </div>
      </div>
    );
  }
  if (!listQuery.data) return null;

  const { entries, buffs } = listQuery.data;
  const filtered =
    filter === 'all' ? entries : entries.filter((e) => e.rarity === filter);

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      {/* Header with progress + active buffs */}
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 12,
          background: 'linear-gradient(180deg, #4a3a8a 0%, #2a1a6a 100%)',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#ffc830' }}>
          {t('scrapbook.title')}
        </div>
        <div
          className="flavor light"
          style={{ fontSize: 14, marginTop: 4, marginBottom: 10 }}
        >
          {t('scrapbook.flavor')}
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: 'relative',
            height: 24,
            background: 'rgba(0,0,0,0.3)',
            border: '2.5px solid #2a1810',
            borderRadius: 6,
            overflow: 'hidden',
            marginBottom: 6,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              width: `${buffs.fillPct}%`,
              background: 'linear-gradient(90deg, #d4a24c 0%, #ffc830 100%)',
              transition: 'width 0.4s ease-out',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 700,
              textShadow: '1px 1px 0 #2a1810',
              fontFamily: 'Luckiest Guy, sans-serif',
            }}
          >
            {buffs.foundCount} / {buffs.totalCount} · {buffs.fillPct}%
          </div>
        </div>

        {/* Active buffs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 4,
            marginTop: 8,
          }}
        >
          <BuffPip
            label={t('scrapbook.buff.xp')}
            value={buffs.xpPct}
            unlocked={buffs.xpPct > 0}
            threshold={SCRAPBOOK_THRESHOLDS.xp.pct}
          />
          <BuffPip
            label={t('scrapbook.buff.gold')}
            value={buffs.goldPct}
            unlocked={buffs.goldPct > 0}
            threshold={SCRAPBOOK_THRESHOLDS.gold.pct}
          />
          <BuffPip
            label={t('scrapbook.buff.dmg')}
            value={buffs.damagePct}
            unlocked={buffs.damagePct > 0}
            threshold={SCRAPBOOK_THRESHOLDS.damage.pct}
          />
          <BuffPip
            label={t('scrapbook.buff.drop')}
            value={buffs.dropPct}
            unlocked={buffs.dropPct > 0}
            threshold={SCRAPBOOK_THRESHOLDS.drop.pct}
          />
        </div>
        <div
          style={{ fontSize: 10, marginTop: 6, opacity: 0.75, lineHeight: 1.4 }}
        >
          {t('scrapbook.buffsNote')}
        </div>
      </div>

      {/* Filter pills */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 4,
          marginBottom: 8,
        }}
      >
        {(Object.keys(RARITY_LABEL_KEY) as RarityFilter[]).map((r) => {
          const active = r === filter;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setFilter(r)}
              className="h-title"
              style={{
                padding: '5px 2px',
                borderRadius: 6,
                border: '2px solid #2a1810',
                background: active ? '#ffc830' : '#e8dcb9',
                color: '#2a1810',
                fontFamily: 'inherit',
                fontSize: 10,
                letterSpacing: 0.3,
                boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
                cursor: 'pointer',
              }}
            >
              {t(RARITY_LABEL_KEY[r])}
            </button>
          );
        })}
      </div>

      {/* Grid of items */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
          gap: 6,
        }}
      >
        {filtered.map((e) => (
          <ItemCell
            key={e.itemTemplateId}
            entry={e}
            onClick={() => setSelected(e)}
          />
        ))}
      </div>

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
      >
        {t('btn.back')}
      </button>

      {selected && (
        <ItemInfoModal entry={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ItemInfoModal({
  entry,
  onClose,
}: {
  entry: ScrapbookEntry;
  onClose: () => void;
}) {
  const t = useT();
  const tc = useContentT();
  const found = entry.foundAt !== null;
  const rarityLabel = t(RARITY_LABEL_KEY[entry.rarity]);
  const slotLabel = t(`scrapbook.slot.${entry.slot}` as DictKey);
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 10, 10, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 300,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel pop-in"
        style={{
          width: '100%',
          maxWidth: 320,
          background: '#fff7e0',
          padding: 16,
          position: 'relative',
          textAlign: 'center',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('btn.close')}
          style={{
            position: 'absolute',
            top: 6,
            right: 8,
            background: 'transparent',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#5a3a2a',
            padding: '2px 8px',
            lineHeight: 1,
          }}
        >
          ✕
        </button>
        <div
          style={{
            width: 78,
            height: 78,
            margin: '4px auto 10px',
            borderRadius: 10,
            border: `3px solid ${RARITY_COLOR[entry.rarity]}`,
            background: found ? '#fff7e0' : '#6a5a48',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '2px 2px 0 #2a1810',
          }}
        >
          <div
            style={{
              filter: found ? 'none' : 'grayscale(100%) brightness(0.35)',
              opacity: found ? 1 : 0.6,
            }}
          >
            <GameIcon name={entry.icon as IconName} size={56} />
          </div>
        </div>
        <div className="h-title" style={{ fontSize: 18, color: '#2a1810' }}>
          {found ? tc.itemName(entry.name, entry.name) : t('scrapbook.cell.unknown')}
        </div>
        <div
          style={{
            fontSize: 13,
            marginTop: 6,
            color: RARITY_COLOR[entry.rarity],
            fontFamily: 'Luckiest Guy, sans-serif',
            letterSpacing: 0.5,
          }}
        >
          {rarityLabel.toUpperCase()}
        </div>
        <div style={{ fontSize: 13, marginTop: 4, color: '#5a3a2a' }}>
          {t('scrapbook.modal.slot')}: <b>{slotLabel}</b>
        </div>
        {found && entry.foundAt !== null && (
          <div style={{ fontSize: 13, marginTop: 4, color: '#5a3a2a' }}>
            {t('scrapbook.modal.foundAt')}:{' '}
            <b className="mono">{new Date(entry.foundAt).toLocaleDateString()}</b>
          </div>
        )}
        {!found && (
          <div
            className="flavor"
            style={{ fontSize: 14, marginTop: 10, color: '#5a3a2a' }}
          >
            {t('scrapbook.modal.notFound')}
          </div>
        )}
      </div>
    </div>
  );
}

function ItemCell({
  entry,
  onClick,
}: {
  entry: ScrapbookEntry;
  onClick: () => void;
}) {
  const t = useT();
  const tc = useContentT();
  const found = entry.foundAt !== null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="clickable no-select"
      title={
        found
          ? `${tc.itemName(entry.name, entry.name)} (${entry.rarity})`
          : `${t('scrapbook.cell.unknown')} (${entry.rarity})`
      }
      style={{
        aspectRatio: '1',
        border: `2.5px solid ${found ? RARITY_COLOR[entry.rarity] : '#7a6a4a'}`,
        borderRadius: 8,
        background: found ? '#fff7e0' : '#6a5a48',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'inherit',
        boxShadow: found ? '1px 1px 0 #2a1810' : 'none',
      }}
    >
      <div
        style={{
          filter: found ? 'none' : 'grayscale(100%) brightness(0.35)',
          opacity: found ? 1 : 0.6,
        }}
      >
        <GameIcon name={entry.icon as IconName} size={42} />
      </div>
      {!found && (
        <div
          style={{
            position: 'absolute',
            fontSize: 26,
            color: '#d4c491',
            textShadow: '1px 1px 0 #2a1810',
            fontFamily: 'Luckiest Guy, sans-serif',
            pointerEvents: 'none',
          }}
        >
          ?
        </div>
      )}
    </button>
  );
}

function BuffPip({
  label,
  value,
  unlocked,
  threshold,
}: {
  label: string;
  value: number;
  unlocked: boolean;
  threshold: number;
}) {
  const t = useT();
  const title = unlocked
    ? t('scrapbook.buff.unlocked')
        .replace('{label}', label)
        .replace('{val}', String(value))
        .replace('{th}', String(threshold))
    : t('scrapbook.buff.locked')
        .replace('{label}', label)
        .replace('{th}', String(threshold));
  return (
    <div
      style={{
        padding: '4px 2px',
        borderRadius: 4,
        border: '2px solid #2a1810',
        background: unlocked ? '#ffc830' : 'rgba(0,0,0,0.4)',
        color: unlocked ? '#2a1810' : '#d4c491',
        textAlign: 'center',
        fontSize: 13,
        fontWeight: 700,
        fontFamily: 'Luckiest Guy, sans-serif',
      }}
      title={title}
    >
      {unlocked ? `+${value}%` : `${threshold}%`}
      <div style={{ fontSize: 8, opacity: 0.85, marginTop: 1 }}>{label}</div>
    </div>
  );
}
