// Skill tree panel — flat list (no prereqs), each node row shows current
// level, next-level cost, and a BUY button. Server validates atomically on
// `unlockSkill`; client invalidates the hub query on success so okruchy +
// level update visibly.
//
// Layout: kompaktowe wiersze (jeden na node) — name + level pip + przycisk
// kosztu w jednej linii, opis pod spodem mniejszym fontem. Cały panel
// scrolluje się wewnętrznie gdy lista nodów rośnie ponad wysokość kolumny
// w hubie.

import { useState } from 'react';
import { SKILL_NODES, type SkillNode } from '@grodno/shared/survivor';
import { trpc } from '@/api/trpc';
import { useT, type DictKey } from '@/i18n';

export interface SkillTreeProps {
  okruchy: number;
  progression: ReadonlyArray<{ nodeId: string; level: number }>;
}

export function SkillTree({ okruchy, progression }: SkillTreeProps) {
  const t = useT();
  const [busyNode, setBusyNode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const unlock = trpc.survivor.unlockSkill.useMutation({
    onSuccess: () => {
      void utils.survivor.getHub.invalidate();
      setBusyNode(null);
    },
    onError: (err) => {
      setError(err.message);
      setBusyNode(null);
    },
  });

  const levelByNode = new Map<string, number>();
  for (const row of progression) {
    levelByNode.set(row.nodeId, row.level);
  }

  return (
    <div
      className="panel"
      style={{
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        height: '100%',
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div className="h-display" style={{ fontSize: 16 }}>
          {t('skill.title')}
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-warm)' }}>
          <span className="h-display" style={{ color: 'var(--okruchy)', fontSize: 14 }}>
            {okruchy}
          </span>{' '}
          {t('skill.cost.suffix')}
        </div>
      </div>

      {error && (
        <div
          className="flavor"
          style={{
            color: 'var(--danger)',
            fontSize: 12,
            background: '#f8d8d0',
            padding: '4px 6px',
            borderRadius: 4,
            border: '1.5px dashed var(--danger)',
            flexShrink: 0,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          paddingRight: 4,
        }}
      >
        {SKILL_NODES.map((node) => {
          const level = levelByNode.get(node.id) ?? 0;
          const maxed = level >= node.maxLevel;
          const cost = maxed ? null : node.costCurve[level] ?? null;
          const canAfford = cost !== null && okruchy >= cost;
          return (
            <SkillRow
              key={node.id}
              node={node}
              level={level}
              cost={cost}
              canAfford={canAfford}
              maxed={maxed}
              busy={busyNode === node.id}
              onBuy={() => {
                setError(null);
                setBusyNode(node.id);
                unlock.mutate({ nodeId: node.id });
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function SkillRow({
  node,
  level,
  cost,
  canAfford,
  maxed,
  busy,
  onBuy,
}: {
  node: SkillNode;
  level: number;
  cost: number | null;
  canAfford: boolean;
  maxed: boolean;
  busy: boolean;
  onBuy: () => void;
}) {
  const t = useT();
  const nameKey = `skill.${node.id}.name` as DictKey;
  const descKey = `skill.${node.id}.desc` as DictKey;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        columnGap: 6,
        rowGap: 1,
        padding: '4px 6px',
        background: maxed ? 'rgba(212, 162, 76, 0.18)' : 'transparent',
        borderRadius: 5,
        borderTop: '1px dashed #c8b890',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          minWidth: 0,
        }}
      >
        <span
          className="h-display"
          style={{ fontSize: 13, lineHeight: 1.1 }}
        >
          {t(nameKey)}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--ink-warm)',
            fontFamily: 'Luckiest Guy, sans-serif',
            letterSpacing: 0.5,
          }}
        >
          {level}/{node.maxLevel}
        </span>
      </div>
      {maxed ? (
        <span
          className="h-display"
          style={{
            fontSize: 11,
            color: 'var(--gold)',
            alignSelf: 'center',
            padding: '0 6px',
            border: '1.5px solid var(--gold)',
            borderRadius: 999,
            letterSpacing: 0.5,
          }}
        >
          {t('skill.max')}
        </span>
      ) : (
        <button
          type="button"
          className="cbtn"
          style={{
            fontSize: 11,
            padding: '3px 8px',
            minWidth: 56,
            borderWidth: 2,
            borderRadius: 6,
            boxShadow: '1.5px 1.5px 0 var(--ink-dark)',
          }}
          disabled={!canAfford || busy}
          onClick={onBuy}
        >
          {busy ? t('skill.busy') : `${cost} ${t('skill.cost.suffix')}`}
        </button>
      )}
      <div
        style={{
          gridColumn: '1 / -1',
          fontSize: 11,
          color: 'var(--ink-mid)',
          lineHeight: 1.2,
        }}
      >
        {t(descKey)}
      </div>
    </div>
  );
}
