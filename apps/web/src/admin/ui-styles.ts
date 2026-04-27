// Shared inline styles for the admin editors. Kept in a .ts (not .tsx) so that
// react-refresh can hot-reload components in ui.tsx without complaining about
// non-component exports.

import type { CSSProperties } from 'react';

export const inputStyle: CSSProperties = {
  padding: '6px 10px',
  fontSize: 13,
  border: '1px solid #bbb',
  borderRadius: 4,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

export const thStyle: CSSProperties = {
  padding: '8px 10px',
  fontSize: 12,
  fontWeight: 600,
  color: '#555',
  textAlign: 'left',
};

export const tdStyle: CSSProperties = {
  padding: '8px 10px',
  verticalAlign: 'top',
};

export const btnPrimaryStyle: CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: '#2a1810',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};

export const btnGhostStyle: CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: '#eee',
  color: '#222',
  border: '1px solid #ccc',
  borderRadius: 4,
  cursor: 'pointer',
};

export const btnDangerStyle: CSSProperties = {
  padding: '6px 14px',
  fontSize: 13,
  background: '#a42a2a',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};
