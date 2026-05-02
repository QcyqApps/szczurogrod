// One-shot tab handover dla ScreenGuild — gdy gracz klika w banner z miasta
// (myWar / myRaid), chcemy go wpuścić bezpośrednio na właściwy tab. Bez
// Zustand'a — to jest „set, read once, clear" sygnał, nie state.

export type GuildPendingTab =
  | 'members'
  | 'chat'
  | 'treasury'
  | 'buildings'
  | 'wars'
  | 'raids'
  | 'browse';

let pending: GuildPendingTab | null = null;

export function setPendingGuildTab(tab: GuildPendingTab): void {
  pending = tab;
}

export function consumePendingGuildTab(): GuildPendingTab | null {
  const t = pending;
  pending = null;
  return t;
}
