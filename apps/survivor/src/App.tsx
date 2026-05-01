// Survivor app shell — state machine: login → hub → run → end → hub.

import { useEffect, useState } from 'react';
import { TRPCClientError } from '@trpc/client';
import { useAuthStore } from '@/api/auth-store';
import { trpc } from '@/api/trpc';
import { PhoneFrame } from '@/components/PhoneFrame';
import { ScreenLogin } from '@/screens/ScreenLogin';
import { Hub } from '@/screens/Hub';
import { Run, type RunReport } from '@/screens/Run';
import { End } from '@/screens/End';

type View =
  | { kind: 'hub' }
  | { kind: 'run'; stageId: number }
  | { kind: 'end'; report: RunReport };

export default function App() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clear);
  const [view, setView] = useState<View>({ kind: 'hub' });
  const utils = trpc.useUtils();
  const hubQuery = trpc.survivor.getHub.useQuery(undefined, {
    enabled: !!accessToken,
  });

  // JWT lasts 15 min and the survivor app has no refresh-token rotation yet,
  // so a stale localStorage token will silently fail every protected call.
  // Detect 401 on the hub query and bounce the user back to ScreenLogin.
  useEffect(() => {
    const err = hubQuery.error;
    if (err instanceof TRPCClientError && err.data?.code === 'UNAUTHORIZED') {
      clearAuth();
    }
  }, [hubQuery.error, clearAuth]);

  let body;
  if (!accessToken) {
    body = <ScreenLogin />;
  } else if (view.kind === 'hub') {
    body = <Hub onStartRun={(stageId) => setView({ kind: 'run', stageId })} />;
  } else if (view.kind === 'run') {
    body = (
      <Run
        stageId={view.stageId}
        characterClass={hubQuery.data?.character?.cls ?? null}
        skillProgression={hubQuery.data?.skillProgression ?? []}
        onEnd={(report) => {
          void utils.survivor.getHub.invalidate();
          void utils.survivor.leaderboard.invalidate();
          setView({ kind: 'end', report });
        }}
      />
    );
  } else {
    body = <End report={view.report} onBackToHub={() => setView({ kind: 'hub' })} />;
  }

  return <PhoneFrame>{body}</PhoneFrame>;
}
