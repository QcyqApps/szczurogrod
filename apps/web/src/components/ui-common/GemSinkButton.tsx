// Reużywalny button dla gem sinków. Konsystentny look: icon gem + koszt
// + label. Handluje disabled gdy brak gemów albo mutation pending.

import { IcoGem } from '@/components/icons';
import { useT } from '@/i18n';

export interface GemSinkButtonProps {
  label: string;
  cost: number;
  playerGems: number;
  pending: boolean;
  onClick: () => void;
  /** Dodatkowy gate — np. "masz pełne HP" blocker. */
  disabled?: boolean;
  disabledReason?: string;
  /** Style variant. */
  variant?: 'primary' | 'ghost';
  /** Rozmiar: 'sm' default. */
  size?: 'sm' | 'md';
  /** Własna szerokość. Default auto. */
  style?: React.CSSProperties;
}

export function GemSinkButton({
  label,
  cost,
  playerGems,
  pending,
  onClick,
  disabled = false,
  disabledReason,
  variant = 'ghost',
  size = 'sm',
  style,
}: GemSinkButtonProps) {
  const t = useT();
  const affordable = playerGems >= cost;
  const isDisabled = pending || disabled || !affordable;
  const title = pending
    ? t('gemSink.pending')
    : disabledReason
      ? disabledReason
      : !affordable
        ? t('gemSink.lack')
            .replace('{cost}', String(cost))
            .replace('{have}', String(playerGems))
        : t('gemSink.cost').replace('{cost}', String(cost));

  const classNames = ['cbtn'];
  if (variant === 'ghost') classNames.push('ghost');
  if (size === 'sm') classNames.push('sm');

  return (
    <button
      type="button"
      className={classNames.join(' ')}
      disabled={isDisabled}
      onClick={onClick}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        opacity: isDisabled ? 0.55 : 1,
        ...style,
      }}
    >
      <span>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
        <IcoGem s={size === 'sm' ? 12 : 14} />
        <span className="mono">{cost}</span>
      </span>
    </button>
  );
}
