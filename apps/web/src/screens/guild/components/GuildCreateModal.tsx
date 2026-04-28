import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { useUnlockQueue } from '@/api/unlock-queue-store';
import { useT, tStatic } from '@/i18n';
import type { GuildEmblemKind } from '@grodno/shared';
import { GuildEmblem } from './GuildEmblem';

export interface GuildCreateModalProps {
  onClose: () => void;
}

const KINDS: readonly GuildEmblemKind[] = ['shield', 'tower', 'book', 'skull'];
const COLORS: readonly string[] = [
  '#c83232', // czerwień
  '#d4a24c', // złoto
  '#2a4a3a', // zieleń
  '#3a5a8a', // błękit
  '#6a2a6a', // purpura
  '#2a1810', // czerń
];

const COST_GOLD = 5000;
const MIN_LVL = 5;

export function GuildCreateModal({ onClose }: GuildCreateModalProps) {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const pushUnlocks = useUnlockQueue((s) => s.push);
  const meQuery = trpc.me.get.useQuery();
  const char = meQuery.data;

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [kind, setKind] = useState<GuildEmblemKind>('shield');
  const [color, setColor] = useState(COLORS[0] as string);
  const [motto, setMotto] = useState('');

  const createMut = trpc.guild.create.useMutation({
    onSuccess: (data) => {
      if (data.unlockedAchievements?.length) pushUnlocks(data.unlockedAchievements);
      void utils.me.get.invalidate();
      onClose();
    },
    onError: (err) => {
      const msg =
        err instanceof TRPCClientError
          ? err.message
          : tStatic('guildCreate.toast.fail');
      pushToast({ text: msg, accent: '#c83232', ttlMs: 4200 });
    },
  });

  const nameValid = name.trim().length >= 3 && name.trim().length <= 24;
  const tagValid = tag.length >= 2 && tag.length <= 5;
  const lvlOk = (char?.lvl ?? 0) >= MIN_LVL;
  const goldOk = (char?.gold ?? 0) >= COST_GOLD;
  const canSubmit = nameValid && tagValid && lvlOk && goldOk && !createMut.isPending;

  const onSubmit = () => {
    if (!canSubmit) return;
    createMut.mutate({
      name: name.trim(),
      tag,
      emblemKind: kind,
      emblemColor: color,
      motto: motto.trim(),
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 220,
        background: 'rgba(42,24,16,0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'modal-fade-in 0.25s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#f3ead9',
          padding: 16,
        }}
      >
        <div
          className="h-display"
          style={{ fontSize: 20, textAlign: 'center', marginBottom: 10 }}
        >
          {t('guildCreate.title')}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <GuildEmblem kind={kind} color={color} size={72} />
        </div>

        <label className="h-title" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          {t('guildCreate.name.label')}
        </label>
        <input
          value={name}
          maxLength={24}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('guildCreate.name.placeholder')}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            background: '#fff7e0',
            fontFamily: 'inherit',
            fontSize: 14,
            marginBottom: 10,
          }}
        />

        <label className="h-title" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          {t('guildCreate.tag.label')}
        </label>
        <input
          value={tag}
          maxLength={5}
          onChange={(e) => setTag(e.target.value.toUpperCase().replace(/\s/g, ''))}
          placeholder={t('guildCreate.tag.placeholder')}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            background: '#fff7e0',
            fontFamily: 'inherit',
            fontSize: 14,
            letterSpacing: 1.5,
            marginBottom: 10,
          }}
        />

        <label className="h-title" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          {t('guildCreate.emblem.label')}
        </label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              style={{
                padding: 4,
                border: '2.5px solid #2a1810',
                borderRadius: 8,
                background: kind === k ? '#ffc830' : '#e8dcb9',
                cursor: 'pointer',
                boxShadow: kind === k ? '2px 2px 0 #2a1810' : 'none',
              }}
            >
              <GuildEmblem kind={k} color={color} size={36} />
            </button>
          ))}
        </div>

        <label className="h-title" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          {t('guildCreate.color.label')}
        </label>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: c,
                border: color === c ? '3px solid #2a1810' : '2px solid #2a1810',
                boxShadow: color === c ? '2px 2px 0 #2a1810' : 'none',
                cursor: 'pointer',
              }}
              aria-label={c}
            />
          ))}
        </div>

        <label className="h-title" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          {t('guildCreate.motto.label')}
        </label>
        <input
          value={motto}
          maxLength={80}
          onChange={(e) => setMotto(e.target.value)}
          placeholder={t('guildCreate.motto.placeholder')}
          style={{
            width: '100%',
            padding: '8px 10px',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            background: '#fff7e0',
            fontFamily: 'inherit',
            fontSize: 14,
            marginBottom: 12,
          }}
        />

        <div
          style={{
            fontSize: 12,
            color: '#5a3a2a',
            marginBottom: 10,
            textAlign: 'center',
          }}
        >
          {t('guildCreate.cost')
            .replace('{gold}', String(COST_GOLD))
            .replace('{lvl}', String(MIN_LVL))}
        </div>

        {!lvlOk && (
          <div className="flavor" style={{ fontSize: 14, color: '#8a3030', textAlign: 'center', marginBottom: 8 }}>
            {t('guildCreate.tooEarly').replace('{lvl}', String(MIN_LVL))}
          </div>
        )}
        {lvlOk && !goldOk && (
          <div className="flavor" style={{ fontSize: 14, color: '#8a3030', textAlign: 'center', marginBottom: 8 }}>
            {t('guildCreate.notEnoughGold')}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="cbtn ghost sm"
            style={{ flex: 1 }}
            onClick={onClose}
            disabled={createMut.isPending}
          >
            {t('guildCreate.cancel')}
          </button>
          <button
            type="button"
            className="cbtn green"
            style={{ flex: 1 }}
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {createMut.isPending ? '...' : t('guildCreate.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
