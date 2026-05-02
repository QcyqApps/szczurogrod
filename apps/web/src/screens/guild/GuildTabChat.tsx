import { useEffect, useRef, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { trpc } from '@/api/trpc';
import { useToastQueue } from '@/api/toast-queue-store';
import { PortraitByClass } from '@/components/portraits';
import { useT, tStatic , translateServerError} from '@/i18n';
import type { GuildChatMessage, GuildRank } from '@grodno/shared';

const POLL_INTERVAL_MS = 8000;
const RATE_LIMIT_MS = 3000;

export function GuildTabChat() {
  const t = useT();
  const utils = trpc.useUtils();
  const pushToast = useToastQueue((s) => s.push);
  const meQuery = trpc.me.get.useQuery();
  const myCharId = meQuery.data?.id ?? null;
  const myRank = meQuery.data?.guild?.rank ?? null;
  const chatQuery = trpc.guild.chatList.useQuery(
    { before: undefined },
    { refetchInterval: POLL_INTERVAL_MS },
  );

  const deleteMut = trpc.guild.chatDelete.useMutation({
    onSuccess: () => {
      void utils.guild.chatList.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildChat.toast.deleteFailed'),
        accent: '#c83232',
      });
    },
  });

  const listRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);
  const [body, setBody] = useState('');
  const [lastSendAt, setLastSendAt] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());

  // Aktualizacja countdownu co 500ms dla UX cooldownu.
  useEffect(() => {
    const handle = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(handle);
  }, []);

  // Auto-scroll do dołu gdy przyjdą nowe wiadomości — ale tylko jeśli user
  // już był na dole (nie przerywamy czytania historii).
  useEffect(() => {
    const messages = chatQuery.data?.messages ?? [];
    if (messages.length === 0) return;
    if (messages.length === lastCountRef.current) return;

    const list = listRef.current;
    if (!list) {
      lastCountRef.current = messages.length;
      return;
    }
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 50;
    if (nearBottom || lastCountRef.current === 0) {
      list.scrollTop = list.scrollHeight;
    }
    lastCountRef.current = messages.length;
  }, [chatQuery.data?.messages]);

  const sendMut = trpc.guild.chatSend.useMutation({
    onSuccess: () => {
      setBody('');
      setLastSendAt(Date.now());
      void utils.guild.chatList.invalidate();
    },
    onError: (err) => {
      pushToast({
        text: err instanceof TRPCClientError ? translateServerError(err.message) : tStatic('guildChat.toast.sendFailed'),
        accent: '#c83232',
      });
    },
  });

  const cooldownMs = Math.max(0, RATE_LIMIT_MS - (nowTick - lastSendAt));
  const trimmed = body.trim();
  const canSend = trimmed.length > 0 && cooldownMs === 0 && !sendMut.isPending;

  const onSubmit = () => {
    if (!canSend) return;
    sendMut.mutate({ body: trimmed });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const messages = chatQuery.data?.messages ?? [];
  const reversed = [...messages].reverse(); // server zwraca DESC → reverse dla chronological

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12 }}>
      <div
        ref={listRef}
        className="panel"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          marginBottom: 8,
          minHeight: 280,
          maxHeight: 'calc(100vh - 320px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          background: '#f3ead9',
        }}
      >
        {messages.length === 0 && !chatQuery.isLoading && (
          <div
            className="flavor"
            style={{ fontSize: 14, color: '#5a3a2a', textAlign: 'center', margin: 'auto' }}
          >
            {t('guildChat.empty')}
          </div>
        )}
        {reversed.map((m) => (
          <MessageRow
            key={m.id}
            msg={m}
            myCharId={myCharId}
            myRank={myRank}
            onDelete={() => deleteMut.mutate({ messageId: m.id })}
          />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        <textarea
          value={body}
          maxLength={500}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={t('guildChat.placeholder')}
          rows={2}
          style={{
            flex: 1,
            padding: '6px 8px',
            border: '2.5px solid #2a1810',
            borderRadius: 8,
            background: '#fff7e0',
            fontFamily: 'inherit',
            fontSize: 13,
            resize: 'none',
          }}
        />
        <button
          type="button"
          className="cbtn green sm"
          disabled={!canSend}
          onClick={onSubmit}
          style={{ minWidth: 70 }}
        >
          {cooldownMs > 0
            ? t('guildChat.cooldown').replace('{n}', String(Math.ceil(cooldownMs / 1000)))
            : sendMut.isPending
              ? '...'
              : t('guildChat.send')}
        </button>
      </div>
    </div>
  );
}

function MessageRow({
  msg,
  myCharId,
  myRank,
  onDelete,
}: {
  msg: GuildChatMessage;
  myCharId: string | null;
  myRank: GuildRank | null;
  onDelete: () => void;
}) {
  const t = useT();
  if (msg.kind === 'system') {
    return (
      <div
        className="flavor"
        style={{
          fontSize: 14,
          color: '#5a3a2a',
          textAlign: 'center',
          padding: '4px 8px',
          background: '#e8dcb9',
          borderRadius: 6,
          fontStyle: 'italic',
        }}
      >
        {msg.body}
      </div>
    );
  }
  const isAuthor = msg.authorCharId === myCharId;
  const isModerator = myRank === 'leader' || myRank === 'officer';
  const canDelete = isAuthor || isModerator;
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        padding: 6,
        background: '#fff7e0',
        border: '2px solid #2a1810',
        borderRadius: 8,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 999,
          overflow: 'hidden',
          border: '2px solid #2a1810',
          flexShrink: 0,
        }}
      >
        <PortraitByClass cls={msg.authorCls} size={32} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span className="h-title" style={{ fontSize: 12 }}>
            {msg.authorName}
          </span>
          <span className="mono" style={{ fontSize: 10, opacity: 0.6 }}>
            {formatTime(msg.createdAt)}
          </span>
        </div>
        <div style={{ fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {msg.body}
        </div>
      </div>
      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={t('guildChat.deleteAria')}
          style={{
            width: 22,
            height: 22,
            border: '2px solid #2a1810',
            borderRadius: 4,
            background: '#f0c8a0',
            cursor: 'pointer',
            padding: 0,
            fontSize: 12,
            color: '#8a3030',
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

function formatTime(ms: number): string {
  const delta = Date.now() - ms;
  if (delta < 60_000) return tStatic('guildChat.time.now');
  if (delta < 3600_000)
    return tStatic('guildChat.time.m').replace('{n}', String(Math.floor(delta / 60_000)));
  if (delta < 86400_000)
    return tStatic('guildChat.time.h').replace('{n}', String(Math.floor(delta / 3600_000)));
  return tStatic('guildChat.time.d').replace('{n}', String(Math.floor(delta / 86400_000)));
}
