import { ICON_NAMES, type IconName } from '@grodno/shared';

const iconNameSet = new Set<string>(ICON_NAMES);

export function isKnownIcon(name: string): name is IconName {
  return iconNameSet.has(name);
}
