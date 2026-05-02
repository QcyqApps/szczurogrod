// One-shot warId handover dla ScreenWarSpectator. Banner na ScreenTown
// klika z konkretnym warId — bez query stringa nawigacji wpychamy go tu,
// ScreenWarSpectator czyta przy mount.

let pendingWarId: string | null = null;

export function setPendingWarId(id: string): void {
  pendingWarId = id;
}

export function consumePendingWarId(): string | null {
  const id = pendingWarId;
  pendingWarId = null;
  return id;
}
