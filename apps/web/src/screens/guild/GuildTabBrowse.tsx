// Browse innych gildii — w przeciwieństwie do GuildNoneView (gdzie jest CTA
// „Aplikuj"), członek już ma swoją gildię. Pokazujemy tylko listę z meta'danymi
// — bez przycisków akcji. Cel: gracz znajduje przeciwnika do wojny / sprawdza
// rywali w glory rankingu.

import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { useT } from '@/i18n';
import { GuildEmblem } from './components/GuildEmblem';

export function GuildTabBrowse() {
  const t = useT();
  const [page, setPage] = useState(0);
  const browseQuery = trpc.guild.browse.useQuery({ page });

  return (
    <div style={{ padding: 12 }}>
      <div className="panel" style={{ padding: 4 }}>
        {browseQuery.isLoading && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#5a3a2a', padding: 12 }}>
            {t('guild.none.browse.loading')}
          </div>
        )}
        {browseQuery.data && browseQuery.data.guilds.length === 0 && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', padding: 12 }}
          >
            {t('guild.browse.empty')}
          </div>
        )}
        {browseQuery.data?.guilds.map((g, i, arr) => (
          <div
            key={g.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 8,
              borderBottom: i < arr.length - 1 ? '1.5px dashed #c8b890' : 'none',
            }}
          >
            <GuildEmblem kind={g.emblemKind} color={g.emblemColor} size={42} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="h-title" style={{ fontSize: 13, lineHeight: 1 }}>
                {g.name}{' '}
                <span className="mono" style={{ fontSize: 13, opacity: 0.7 }}>
                  [{g.tag}]
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#5a3a2a' }}>
                {t('guild.browse.row.meta')
                  .replace('{lvl}', String(g.level))
                  .replace('{count}', String(g.memberCount))
                  .replace('{cap}', String(g.memberCap))
                  .replace('{glory}', g.glory.toLocaleString('pl-PL'))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {browseQuery.data && (browseQuery.data.hasMore || page > 0) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            type="button"
            className="cbtn ghost sm"
            style={{ flex: 1 }}
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            {t('guild.none.page.prev')}
          </button>
          <button
            type="button"
            className="cbtn ghost sm"
            style={{ flex: 1 }}
            disabled={!browseQuery.data.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            {t('guild.none.page.next')}
          </button>
        </div>
      )}
    </div>
  );
}
