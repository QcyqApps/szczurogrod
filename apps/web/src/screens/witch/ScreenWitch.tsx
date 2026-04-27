// Baba Jaga — zdejmowanie klątw.
//
// Flow: lista aktywnych klątw + per-klątwa gold-remove + premium remove-all
// za gemy. Klątwy spawnują się po przegranej z bossem (tier ≥ 3).

import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { IcoCoin, IcoHeart, IcoMagic, IcoShield, IcoSword, IcoClock } from '@/components/icons';
import { GemSinkButton, HelpIcon } from '@/components/ui-common';
import type { ActiveCurse, BuffKind } from '@grodno/shared';

export interface ScreenWitchProps {
  onBack: () => void;
}

const KIND_ICON: Record<BuffKind, (s: number) => React.ReactNode> = {
  hp_max_pct: (s) => <IcoHeart s={s} />,
  mp_max_pct: (s) => <IcoMagic s={s} />,
  atk_flat: (s) => <IcoSword s={s} />,
  def_flat: (s) => <IcoShield s={s} />,
  mag_flat: (s) => <IcoMagic s={s} />,
  spd_flat: (s) => <IcoClock s={s} />,
};

export function ScreenWitch({ onBack }: ScreenWitchProps) {
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const statusQuery = trpc.witch.status.useQuery();
  const meQuery = trpc.me.get.useQuery();

  const gold = meQuery.data?.gold ?? 0;
  const gems = meQuery.data?.gems ?? 0;
  const status = statusQuery.data;

  const removeMut = trpc.witch.remove.useMutation({
    onSuccess: () => {
      pushToast({ text: 'Klątwa zdjęta.', accent: '#4a7c3a' });
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Baba Jaga odmówiła.',
        accent: '#c83232',
      });
    },
    onSettled: () => {
      void utils.witch.status.invalidate();
      void utils.me.get.invalidate();
    },
  });

  const removeAllMut = trpc.witch.removeAll.useMutation({
    onSuccess: (data) => {
      pushToast({
        text: `Zdjęto ${data.removedCount} klątw. Baba Jaga liczy gemy.`,
        accent: '#4a7c3a',
      });
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : 'Baba Jaga odmówiła.',
        accent: '#c83232',
      });
    },
    onSettled: () => {
      void utils.witch.status.invalidate();
      void utils.me.get.invalidate();
    },
  });

  async function handleRemove(curse: ActiveCurse) {
    if (removeMut.isPending || removeAllMut.isPending) return;
    if (gold < curse.removeCostGold) {
      pushToast({ text: `Brak gold'a (${curse.removeCostGold}).`, accent: '#c83232' });
      return;
    }
    await removeMut.mutateAsync({ slug: curse.slug });
  }

  return (
    <div className="screen-in" style={{ padding: 12 }}>
      <div
        className="panel"
        style={{
          padding: 14,
          marginBottom: 10,
          background: 'linear-gradient(180deg, #2a1a2a 0%, #140814 100%)',
          color: '#f3ead9',
          textAlign: 'center',
        }}
      >
        <div className="h-display" style={{ fontSize: 22, color: '#c8a0a0' }}>
          BABA JAGA
        </div>
        <div className="flavor light" style={{ fontSize: 14, marginTop: 4 }}>
          „Nie pytaj kto Cię przeklął. Pytaj czy Cię stać żebym to zdjęła."
        </div>
      </div>

      {!status ? (
        <div className="panel" style={{ padding: 14, textAlign: 'center', fontSize: 13 }}>
          Baba Jaga szuka okularów…
        </div>
      ) : status.curses.length === 0 ? (
        <div
          className="panel"
          style={{
            padding: 14,
            textAlign: 'center',
            color: '#2a4a2a',
            background: '#e8f0d8',
            border: '2.5px solid #4a7c3a',
          }}
        >
          <div className="h-title" style={{ fontSize: 15, marginBottom: 4 }}>
            CZYSTA DUSZA
          </div>
          <div style={{ fontSize: 14, color: '#3a5a3a' }}>
            Nie masz żadnej klątwy. Baba Jaga niezadowolona — zarobku brak.
          </div>
        </div>
      ) : (
        <>
          {/* Lista aktywnych klątw */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
            {status.curses.map((c) => {
              const canAfford = gold >= c.removeCostGold;
              const pending = removeMut.isPending && removeMut.variables?.slug === c.slug;
              return (
                <div
                  key={c.slug}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 10,
                    border: '3px solid #8a2a2a',
                    borderRadius: 10,
                    background: '#f5d4d4',
                    boxShadow: '2px 2px 0 #2a1810',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 8,
                      background: '#5a1818',
                      border: '2px solid #2a1810',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {KIND_ICON[c.kind](22)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="h-title" style={{ fontSize: 13, color: '#5a1818' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#3a1818', lineHeight: 1.3 }}>
                      {c.desc}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove(c)}
                    disabled={!canAfford || pending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 10px',
                      background: canAfford ? '#f0d080' : '#d4c491',
                      border: '2.5px solid #2a1810',
                      borderRadius: 8,
                      cursor: canAfford ? 'pointer' : 'not-allowed',
                      fontFamily: 'Luckiest Guy, sans-serif',
                      fontSize: 13,
                      boxShadow: canAfford ? '2px 2px 0 #2a1810' : 'none',
                      opacity: pending ? 0.5 : 1,
                    }}
                  >
                    <IcoCoin s={12} /> {c.removeCostGold}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Remove all za gemy */}
          {status.removeAllCostGems !== null && (
            <div
              className="panel"
              style={{ padding: 12, marginBottom: 10, textAlign: 'center' }}
            >
              <div
                style={{ fontSize: 13, color: '#5a3a2a', marginBottom: 8, lineHeight: 1.3 }}
              >
                Spieszysz się? Baba Jaga zdejmuje wszystko naraz. Jest droższa, ale szybsza.
              </div>
              <GemSinkButton
                label={`ZDEJMIJ WSZYSTKIE (${status.curses.length})`}
                cost={status.removeAllCostGems}
                playerGems={gems}
                pending={removeAllMut.isPending}
                onClick={() => removeAllMut.mutate()}
                disabledReason="Zdjęcie wszystkich klątw naraz."
                variant="primary"
                size="md"
              />
            </div>
          )}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <HelpIcon title="Skąd się biorą klątwy?" label="Jak to działa?">
          <p style={{ margin: 0 }}>
            Po przegranej walce z <b>bossem</b> (tier 3+) jest <b>25% szans</b> że
            wróg zostawi Ci klątwę na 24h. Klątwa obniża jedną ze statystyk i
            siedzi razem z pozytywnymi buffami w pasku u góry ekranu (czerwony).
            Możesz ją przeczekać albo zapłacić Babie Jadze.
          </p>
        </HelpIcon>
      </div>

      <button type="button" className="cbtn ghost" style={{ width: '100%' }} onClick={onBack}>
        ← WRÓĆ
      </button>
    </div>
  );
}
