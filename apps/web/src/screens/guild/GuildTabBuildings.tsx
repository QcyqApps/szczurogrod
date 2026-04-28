import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { GameIcon } from '@/components/game-icons';
import { IcoCoin, IcoGem } from '@/components/icons';
import { useT, tStatic, useContentT } from '@/i18n';
import type {
  GuildBuildingBuffSpec,
  GuildBuildingEntry,
  GuildRank,
  IconName,
} from '@grodno/shared';

export interface GuildTabBuildingsProps {
  myRank: GuildRank;
}

export function GuildTabBuildings({ myRank }: GuildTabBuildingsProps) {
  const t = useT();
  const listQuery = trpc.guildBuildings.list.useQuery();
  const canUpgrade = myRank === 'leader' || myRank === 'officer';

  if (listQuery.isLoading) {
    return (
      <div style={{ padding: 12, textAlign: 'center', fontSize: 13, color: '#5a3a2a' }}>
        {t('guildBuildings.loading')}
      </div>
    );
  }
  if (!listQuery.data) return null;

  return (
    <div style={{ padding: 12 }}>
      <div
        className="flavor"
        style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', marginBottom: 10 }}
      >
        {t('guildBuildings.flavor')}
      </div>
      {listQuery.data.buildings.map((b) => (
        <BuildingCard
          key={b.slug}
          building={b}
          canUpgrade={canUpgrade}
          treasuryGold={listQuery.data.treasuryGold}
          treasuryGems={listQuery.data.treasuryGems}
          guildLevel={listQuery.data.guildLevel}
        />
      ))}
    </div>
  );
}

interface BuildingCardProps {
  building: GuildBuildingEntry;
  canUpgrade: boolean;
  treasuryGold: number;
  treasuryGems: number;
  guildLevel: number;
}

function BuildingCard({
  building,
  canUpgrade,
  treasuryGold,
  treasuryGems,
  guildLevel,
}: BuildingCardProps) {
  const t = useT();
  const tc = useContentT();
  const buildingName = tc.guildBuildingName(building.slug, building.name);
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);

  const upgradeMut = trpc.guildBuildings.upgrade.useMutation({
    onSuccess: () => {
      pushToast({
        text: tStatic('guildBuildings.toast.upgraded')
          .replace('{name}', buildingName)
          .replace('{lvl}', String(building.level + 1)),
        accent: '#2a4a3a',
      });
      void utils.guildBuildings.list.invalidate();
      void utils.guild.get.invalidate();
      void utils.guildTreasury.log.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? err.message : tStatic('guildBuildings.toast.refused'),
        accent: '#c83232',
      });
    },
  });

  const atMax = building.level >= building.maxLevel || building.nextCost === null;
  const cost = building.nextCost;
  const guildLvlOk = cost ? guildLevel >= cost.guildLvl : true;
  const goldOk = cost ? treasuryGold >= cost.gold : true;
  const gemsOk = cost ? treasuryGems >= cost.gems : true;
  const canClick = canUpgrade && !atMax && guildLvlOk && goldOk && gemsOk && !upgradeMut.isPending;

  return (
    <div className="panel" style={{ padding: 12, marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 10,
            border: '2.5px solid #2a1810',
            background: '#e8dcb9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <GameIcon name={building.icon as IconName} size={40} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="h-title" style={{ fontSize: 15, lineHeight: 1 }}>
            {buildingName}{' '}
            <span className="mono" style={{ fontSize: 12, opacity: 0.7 }}>
              L{building.level}/{building.maxLevel}
            </span>
          </div>
          <div className="flavor" style={{ fontSize: 14, color: '#5a3a2a', marginTop: 2 }}>
            {building.desc}
          </div>
        </div>
      </div>

      <BuffPreview building={building} />

      {atMax ? (
        <div
          className="flavor"
          style={{ fontSize: 14, color: '#2a4a3a', textAlign: 'center', marginTop: 8 }}
        >
          {t('guildBuildings.atMax')}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: '#5a3a2a', marginTop: 8 }}>
            {t('guildBuildings.nextLevel').replace('{n}', String(building.level + 1))}{' '}
            <span style={{ display: 'inline-flex', gap: 6, verticalAlign: 'middle' }}>
              {cost && cost.gold > 0 && (
                <span
                  style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}
                  className="mono"
                >
                  <IcoCoin s={12} /> {cost.gold.toLocaleString('pl-PL')}
                </span>
              )}
              {cost && cost.gems > 0 && (
                <span
                  style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}
                  className="mono"
                >
                  <IcoGem s={12} /> {cost.gems}
                </span>
              )}
            </span>
            {cost && cost.guildLvl > 1 && (
              <span style={{ marginLeft: 6, opacity: 0.7 }}>
                {t('guildBuildings.requiresGuildLvl').replace('{n}', String(cost.guildLvl))}
              </span>
            )}
          </div>
          {!guildLvlOk && (
            <div style={{ fontSize: 13, color: '#8a3030', marginTop: 2 }}>
              {t('guildBuildings.tooYoung')}
            </div>
          )}
          {guildLvlOk && !goldOk && (
            <div style={{ fontSize: 13, color: '#8a3030', marginTop: 2 }}>
              {t('guildBuildings.notEnoughGold')}
            </div>
          )}
          {guildLvlOk && goldOk && !gemsOk && (
            <div style={{ fontSize: 13, color: '#8a3030', marginTop: 2 }}>
              {t('guildBuildings.notEnoughGems')}
            </div>
          )}
          {canUpgrade ? (
            <button
              type="button"
              className="cbtn green sm"
              disabled={!canClick}
              onClick={() => upgradeMut.mutate({ slug: building.slug })}
              style={{ width: '100%', marginTop: 6 }}
            >
              {upgradeMut.isPending ? '...' : t('guildBuildings.upgrade')}
            </button>
          ) : (
            <div
              style={{
                fontSize: 13,
                color: '#5a3a2a',
                textAlign: 'center',
                marginTop: 6,
                fontStyle: 'italic',
              }}
            >
              {t('guildBuildings.officersOnly')}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BuffPreview({ building }: { building: GuildBuildingEntry }) {
  const t = useT();
  const lvl = building.level;
  const spec: GuildBuildingBuffSpec = building.buffSpec;

  if (spec.kind === 'fortress') {
    const current = lvl > 0 ? spec.memberCapByLevel[lvl - 1] : 0;
    const next =
      lvl < building.maxLevel ? spec.memberCapByLevel[lvl] : null;
    return (
      <BuffLine
        currentText={t('guildBuildings.fortress.current').replace('{n}', String(current ?? 0))}
        nextText={
          next !== null && next !== undefined
            ? t('guildBuildings.fortress.next').replace('{n}', String(next))
            : null
        }
      />
    );
  }
  if (spec.kind === 'altar') {
    const curAtk = lvl > 0 ? (spec.atkPctByLevel[lvl - 1] ?? 0) : 0;
    const curMag = lvl > 0 ? (spec.magPctByLevel[lvl - 1] ?? 0) : 0;
    const curDef = lvl > 0 ? (spec.defPctByLevel[lvl - 1] ?? 0) : 0;
    const nxt =
      lvl < building.maxLevel
        ? {
            atk: spec.atkPctByLevel[lvl] ?? 0,
            mag: spec.magPctByLevel[lvl] ?? 0,
            def: spec.defPctByLevel[lvl] ?? 0,
          }
        : null;
    return (
      <BuffLine
        currentText={t('guildBuildings.altar.current')
          .replace('{atk}', pct(curAtk))
          .replace('{mag}', pct(curMag))
          .replace('{def}', pct(curDef))}
        nextText={
          nxt !== null
            ? t('guildBuildings.altar.next')
                .replace('{atk}', pct(nxt.atk))
                .replace('{mag}', pct(nxt.mag))
                .replace('{def}', pct(nxt.def))
            : null
        }
      />
    );
  }
  if (spec.kind === 'vault') {
    const cur = lvl > 0 ? (spec.extraWithdrawPctByLevel[lvl - 1] ?? 0) : 0;
    const nxt =
      lvl < building.maxLevel ? (spec.extraWithdrawPctByLevel[lvl] ?? 0) : null;
    return (
      <BuffLine
        currentText={t('guildBuildings.vault.current').replace('{pct}', pct(0.2 + cur))}
        nextText={
          nxt !== null
            ? t('guildBuildings.vault.next').replace('{pct}', pct(0.2 + nxt))
            : null
        }
      />
    );
  }
  return null;
}

function BuffLine({
  currentText,
  nextText,
}: {
  currentText: string;
  nextText: string | null;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        marginTop: 8,
        padding: '4px 8px',
        background: '#fff7e0',
        border: '2px solid #2a1810',
        borderRadius: 6,
        fontSize: 12,
      }}
    >
      <b>{currentText}</b>
      {nextText && <span style={{ opacity: 0.65 }}>{nextText}</span>}
    </div>
  );
}

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}
