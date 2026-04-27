import { GameIcon } from '@/components/game-icons';
import type { GuildEmblemKind, IconName } from '@grodno/shared';

export interface GuildEmblemProps {
  kind: GuildEmblemKind;
  color: string;
  size?: number;
}

const KIND_TO_ICON: Record<GuildEmblemKind, IconName> = {
  shield: 'emblem-shield',
  tower: 'emblem-tower',
  book: 'emblem-book',
  skull: 'emblem-skull',
};

export function GuildEmblem({ kind, color, size = 48 }: GuildEmblemProps) {
  const iconSize = Math.round(size * 0.72);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.18),
        background: color,
        border: '2.5px solid #2a1810',
        boxShadow: '2px 2px 0 #2a1810',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <GameIcon name={KIND_TO_ICON[kind]} size={iconSize} />
    </div>
  );
}
