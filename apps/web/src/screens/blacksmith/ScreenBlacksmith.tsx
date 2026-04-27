import { useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { GameIcon } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';
import type { IconName, InventoryItem, Rarity } from '@grodno/shared';

const RARITY_COLOR: Record<Rarity, string> = {
  common: '#8a8a8a',
  rare: '#3a8ac8',
  epic: '#a04ef0',
  legendary: '#d4a24c',
};

const SCRAP_BY_RARITY: Record<Rarity, number> = {
  common: 1,
  rare: 3,
  epic: 8,
  legendary: 20,
};

type Tab = 'upgrade' | 'dismantle';

export interface ScreenBlacksmithProps {
  onBack: () => void;
}

export function ScreenBlacksmith({ onBack }: ScreenBlacksmithProps) {
  const [tab, setTab] = useState<Tab>('upgrade');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const inventoryQuery = trpc.inventory.list.useQuery();
  const meQuery = trpc.me.get.useQuery();

  const items = inventoryQuery.data ?? [];
  const scrap = 0; // będzie z me.get — niżej pokazuję
  void scrap;

  // Filtruj tylko enhanceable/dismantlable (nie-potion):
  const eligibleItems = items.filter((i) => i.slot !== 'potion');

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      {/* Header */}
      <div
        className="panel"
        style={{
          padding: 12,
          marginBottom: 10,
          background: 'linear-gradient(180deg, #4a2a1a 0%, #2a1810 100%)',
          color: '#fff3e0',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#ffc830' }}>
          KOWAL ZYGMUNT
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          Wali, rozpruwa, ulepsza. Za przyzwoitą cenę.
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 14,
            marginTop: 8,
            fontSize: 13,
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <GameIcon name="rock" size={14} />
            <span className="mono">{meQuery.data?.scrap ?? 0}</span> złomu
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IcoCoin s={14} />
            <span className="mono">{meQuery.data?.gold ?? 0}</span>
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IcoGem s={14} />
            <span className="mono">{meQuery.data?.gems ?? 0}</span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 6,
          marginBottom: 10,
        }}
      >
        {(['upgrade', 'dismantle'] as Tab[]).map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setSelectedItemId(null);
              }}
              className="h-title"
              style={{
                padding: '6px 4px',
                borderRadius: 8,
                border: '2.5px solid #2a1810',
                background: active ? '#ffc830' : '#e8dcb9',
                color: '#2a1810',
                fontFamily: 'inherit',
                fontSize: 14,
                boxShadow: active ? '2px 2px 0 #2a1810' : 'none',
                cursor: 'pointer',
              }}
            >
              {t === 'upgrade' ? 'ULEPSZ' : 'ROZPRUJ'}
            </button>
          );
        })}
      </div>

      {tab === 'upgrade' && (
        <UpgradeView
          items={eligibleItems}
          selectedItemId={selectedItemId}
          onSelect={setSelectedItemId}
        />
      )}
      {tab === 'dismantle' && (
        <DismantleView
          items={eligibleItems}
          selectedItemId={selectedItemId}
          onSelect={setSelectedItemId}
        />
      )}

      <button
        type="button"
        className="cbtn ghost"
        style={{ width: '100%', marginTop: 12 }}
        onClick={onBack}
      >
        ← Wróć
      </button>
    </div>
  );
}

function UpgradeView({
  items,
  selectedItemId,
  onSelect,
}: {
  items: readonly InventoryItem[];
  selectedItemId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);

  const previewQuery = trpc.blacksmith.preview.useQuery(
    { itemId: selectedItemId ?? '' },
    { enabled: selectedItemId !== null },
  );

  const upgradeMut = trpc.blacksmith.upgrade.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        pushToast({
          text: `Ulepszone do +${data.newLevel}!`,
          accent: '#2a4a3a',
        });
      } else {
        pushToast({
          text: `Nieudane. Koszt pobrany, poziom został.`,
          accent: '#c83232',
          ttlMs: 4500,
        });
      }
      void utils.inventory.list.invalidate();
      void utils.me.get.invalidate();
      void utils.blacksmith.preview.invalidate({ itemId: selectedItemId ?? '' });
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Nie udało się.',
        accent: '#c83232',
      });
    },
  });

  const selected = items.find((i) => i.id === selectedItemId) ?? null;

  return (
    <>
      <ItemGrid items={items} selectedItemId={selectedItemId} onSelect={onSelect} />

      {selected && previewQuery.data && (
        <div className="panel" style={{ padding: 12, marginTop: 10 }}>
          <div
            className="h-title"
            style={{ fontSize: 14, marginBottom: 6, color: RARITY_COLOR[selected.rarity] }}
          >
            {selected.name} {selected.enhancementLevel > 0 && `+${selected.enhancementLevel}`}
          </div>

          {/* Stat porównanie */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              marginBottom: 10,
            }}
          >
            <StatPreview
              label="ATK"
              current={previewQuery.data.currentStats.atk}
              next={previewQuery.data.nextStats?.atk ?? null}
            />
            <StatPreview
              label="DEF"
              current={previewQuery.data.currentStats.def}
              next={previewQuery.data.nextStats?.def ?? null}
            />
            <StatPreview
              label="MAG"
              current={previewQuery.data.currentStats.mag}
              next={previewQuery.data.nextStats?.mag ?? null}
            />
          </div>

          {previewQuery.data.cost ? (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: '#5a3a2a',
                  marginBottom: 6,
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  Koszt: <IcoCoin s={12} />{' '}
                  <b className="mono">{previewQuery.data.cost.gold.toLocaleString('pl-PL')}</b>
                </span>
                <span>
                  <GameIcon name="rock" size={12} />{' '}
                  <b className="mono">{previewQuery.data.cost.scrap}</b> złomu
                </span>
              </div>
              {previewQuery.data.successRate < 1 && (
                <div
                  className="flavor"
                  style={{
                    fontSize: 12,
                    color: '#8a3030',
                    textAlign: 'center',
                    marginBottom: 8,
                  }}
                >
                  Szansa sukcesu: {Math.round(previewQuery.data.successRate * 100)}%. Przy
                  porażce koszt przepada, poziom zostaje.
                </div>
              )}
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  className="cbtn green sm"
                  style={{ flex: 1 }}
                  disabled={upgradeMut.isPending}
                  onClick={() =>
                    upgradeMut.mutate({ itemId: selected.id, useGemGuarantee: false })
                  }
                >
                  {upgradeMut.isPending ? '...' : 'ULEPSZ'}
                </button>
                {previewQuery.data.successRate < 1 && (
                  <button
                    type="button"
                    className="cbtn sm"
                    style={{ flex: 1 }}
                    disabled={upgradeMut.isPending}
                    onClick={() =>
                      upgradeMut.mutate({ itemId: selected.id, useGemGuarantee: true })
                    }
                    title="Gwarantowane powodzenie za gemy"
                  >
                    ULEPSZ · <IcoGem s={11} /> {previewQuery.data.gemGuaranteeCost}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div
              className="flavor"
              style={{ fontSize: 13, color: '#5a3a2a', textAlign: 'center', padding: 8 }}
            >
              Maksymalny poziom. Dalej się nie da.
            </div>
          )}
        </div>
      )}
    </>
  );
}

function DismantleView({
  items,
  selectedItemId,
  onSelect,
}: {
  items: readonly InventoryItem[];
  selectedItemId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);

  const dismantleMut = trpc.blacksmith.dismantle.useMutation({
    onSuccess: (data) => {
      pushToast({
        text: `+${data.scrapGained} złomu (razem: ${data.totalScrap}).`,
        accent: '#2a4a3a',
      });
      void utils.inventory.list.invalidate();
      void utils.me.get.invalidate();
      onSelect(null);
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Nie udało się.',
        accent: '#c83232',
      });
    },
  });

  const selected = items.find((i) => i.id === selectedItemId) ?? null;

  return (
    <>
      <ItemGrid items={items} selectedItemId={selectedItemId} onSelect={onSelect} />

      {selected && (
        <div className="panel" style={{ padding: 12, marginTop: 10 }}>
          <div
            className="h-title"
            style={{ fontSize: 14, marginBottom: 4, color: RARITY_COLOR[selected.rarity] }}
          >
            {selected.name} {selected.enhancementLevel > 0 && `+${selected.enhancementLevel}`}
          </div>
          <div style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 10 }}>
            Dostaniesz <b>{SCRAP_BY_RARITY[selected.rarity]} złomu</b>. Przedmiot zniknie.
          </div>
          {selected.equippedSlot !== null && (
            <div
              className="flavor"
              style={{
                color: '#8a3030',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Zdejmij z postaci zanim rozpruwasz.
            </div>
          )}
          <button
            type="button"
            className="cbtn red sm"
            style={{ width: '100%' }}
            disabled={dismantleMut.isPending || selected.equippedSlot !== null}
            onClick={() => dismantleMut.mutate({ itemId: selected.id })}
          >
            {dismantleMut.isPending ? '...' : 'ROZPRUJ'}
          </button>
        </div>
      )}
    </>
  );
}

function ItemGrid({
  items,
  selectedItemId,
  onSelect,
}: {
  items: readonly InventoryItem[];
  selectedItemId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (items.length === 0) {
    return (
      <div
        className="flavor"
        style={{ fontSize: 13, color: '#5a3a2a', textAlign: 'center', padding: 20 }}
      >
        Nie masz czego ulepszyć ani rozpruć.
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
        gap: 6,
      }}
    >
      {items.map((i) => {
        const active = i.id === selectedItemId;
        return (
          <button
            key={i.id}
            type="button"
            onClick={() => onSelect(active ? null : i.id)}
            style={{
              aspectRatio: '1',
              border: `2.5px solid ${active ? '#ffc830' : RARITY_COLOR[i.rarity]}`,
              borderRadius: 8,
              background: active ? '#fff3cc' : '#fff7e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
              padding: 0,
              boxShadow: active ? '2px 2px 0 #2a1810' : '1px 1px 0 #2a1810',
            }}
            title={`${i.name}${i.enhancementLevel > 0 ? ` +${i.enhancementLevel}` : ''}`}
          >
            <GameIcon name={i.icon as IconName} size={38} />
            {i.enhancementLevel > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  background: '#ffc830',
                  color: '#2a1810',
                  fontFamily: 'Luckiest Guy, sans-serif',
                  fontSize: 13,
                  padding: '1px 4px',
                  borderRadius: 6,
                  border: '1.5px solid #2a1810',
                  lineHeight: 1.2,
                }}
              >
                +{i.enhancementLevel}
              </span>
            )}
            {i.equippedSlot !== null && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 2,
                  left: 2,
                  fontSize: 10,
                  color: '#2a4a3a',
                  fontWeight: 700,
                }}
              >
                W EQ
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function StatPreview({
  label,
  current,
  next,
}: {
  label: string;
  current: number;
  next: number | null;
}) {
  const delta = next !== null ? next - current : null;
  return (
    <div
      style={{
        padding: 6,
        border: '2px solid #2a1810',
        borderRadius: 6,
        background: '#fff7e0',
        textAlign: 'center',
      }}
    >
      <div className="h-title" style={{ fontSize: 10, opacity: 0.7 }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 700 }}>
        {current}
      </div>
      {delta !== null && delta > 0 && (
        <div
          className="mono"
          style={{ fontSize: 13, color: '#2a4a3a' }}
        >
          → {next} <span style={{ fontSize: 10 }}>(+{delta})</span>
        </div>
      )}
    </div>
  );
}
