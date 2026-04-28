// Side-effect import — populates CONTENT_EN with EN content translations.
// Must run before any useContentT() call; Vite hoists module init at module
// load so importing from '@/i18n' anywhere is sufficient.
import './content-en';

export { useLangStore, type Lang } from './store';
export { useT, tStatic } from './use-t';
export type { DictKey } from './dict';
export { useContentT, CONTENT_EN } from './content';
