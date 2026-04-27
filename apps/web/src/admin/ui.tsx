// Shared UI components for the admin editors. Plain styles — dev tool, not
// part of the player-facing game UI.

import { useState, type ReactNode } from 'react';
import { GameIcon } from '@/components/game-icons';
import { ICON_NAMES } from '@grodno/shared';
import { isKnownIcon } from './icon-utils';
import {
  btnDangerStyle,
  btnGhostStyle,
  btnPrimaryStyle,
  inputStyle,
  thStyle,
} from './ui-styles';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4 }}>
      <span style={{ fontSize: 12, color: '#555' }}>{label}</span>
      {children}
    </label>
  );
}

export function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === '' ? null : Number(raw));
        }}
        style={{
          padding: '6px 10px',
          fontSize: 13,
          border: '1px solid #bbb',
          borderRadius: 4,
          fontFamily: 'inherit',
          width: '100%',
          boxSizing: 'border-box',
        }}
      />
    </Field>
  );
}

export function RarityBadge({ rarity }: { rarity: string }) {
  const color =
    rarity === 'legendary'
      ? '#c89b2c'
      : rarity === 'epic'
        ? '#a04ef0'
        : rarity === 'rare'
          ? '#3a8ac8'
          : '#888';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        fontSize: 13,
        background: color,
        color: '#fff',
        borderRadius: 3,
      }}
    >
      {rarity}
    </span>
  );
}

/**
 * Renders the icon SVG if the name is known, or a small placeholder + the raw
 * string if not (lets admins see that an icon name is stale/typo without the
 * SVG renderer silently drawing nothing).
 */
export function IconPreview({
  name,
  size = 24,
  withLabel,
}: {
  name: string;
  size?: number;
  withLabel?: boolean;
}) {
  const known = isKnownIcon(name);
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', lineHeight: 1 }}>
      <span
        style={{
          width: size,
          height: size,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: known ? 'transparent' : '#fee',
          border: known ? 'none' : '1px dashed #c99',
          borderRadius: 3,
          color: '#a00',
          fontSize: Math.round(size * 0.35),
        }}
        title={name}
      >
        {known ? <GameIcon name={name} size={size} /> : '?'}
      </span>
      {withLabel && (
        <code style={{ fontSize: 13, color: known ? '#555' : '#a00' }}>{name}</code>
      )}
    </span>
  );
}

export function IconPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const known = isKnownIcon(value);
  return (
    <Field label={label}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 10px',
            background: '#fff',
            border: '1px solid #bbb',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        >
          <IconPreview name={value} size={28} />
          <span>
            <code style={{ fontSize: 13 }}>{value || '—'}</code>
            {!known && value && (
              <span style={{ fontSize: 10, color: '#a00', marginLeft: 4 }}>(unknown)</span>
            )}
          </span>
          <span style={{ fontSize: 13, color: '#888', marginLeft: 4 }}>
            {open ? '▲' : '▼'}
          </span>
        </button>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ ...inputStyle, width: 200 }}
          placeholder="icon id"
        />
      </div>
      {open && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            border: '1px solid #ccc',
            borderRadius: 6,
            background: '#fafafa',
            maxHeight: 260,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
              gap: 6,
            }}
          >
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(name);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: 4,
                  background: name === value ? '#ffe9b3' : '#fff',
                  border: name === value ? '2px solid #d4a24c' : '1px solid #ddd',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                title={name}
              >
                <GameIcon name={name} size={32} />
                <span style={{ fontSize: 10, color: '#555' }}>{name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Field>
  );
}

export function ModalShell({
  title,
  busy,
  error,
  onCancel,
  onSave,
  onDelete,
  canSave,
  children,
  maxWidth = 560,
}: {
  title: string;
  busy: boolean;
  error: string | null;
  canSave: boolean;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
  children: ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 20,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: 18 }}>{title}</h2>
        <div style={{ display: 'grid', gap: 10 }}>{children}</div>
        {error && (
          <div
            style={{
              marginTop: 12,
              padding: 8,
              background: '#fee',
              color: '#a00',
              fontSize: 13,
              borderRadius: 4,
            }}
          >
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          {onDelete && (
            <button type="button" onClick={onDelete} disabled={busy} style={btnDangerStyle}>
              Usuń
            </button>
          )}
          <span style={{ flex: 1 }} />
          <button type="button" onClick={onCancel} style={btnGhostStyle}>
            Anuluj
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy || !canSave}
            style={btnPrimaryStyle}
          >
            {busy ? 'Zapisuję…' : 'Zapisz'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TableShell({
  headers,
  children,
}: {
  headers: readonly string[];
  children: ReactNode;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            {headers.map((h) => (
              <th key={h} style={thStyle}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/** Jedna grupa pill-filtrów — value może być stringem lub `null` dla "wszystko". */
export interface FilterPillGroup<V extends string = string> {
  /** Krótki label przed pill'ami, np. "Slot:". */
  label: string;
  /** Dostępne opcje (null value = „wszystkie", np. `{value: null, label: 'wszystkie'}`). */
  options: ReadonlyArray<{ value: V | null; label: string; count?: number }>;
  /** Aktualnie wybrana wartość. `null` = bez filtra. */
  value: V | null;
  onChange: (v: V | null) => void;
}

export function Toolbar({
  filter,
  setFilter,
  visible,
  total,
  onCreate,
  createLabel = '+ Dodaj',
  pillGroups,
}: {
  filter: string;
  setFilter: (v: string) => void;
  visible: number;
  total: number;
  onCreate?: () => void;
  createLabel?: string;
  /** Opcjonalne enum-filter groups (slot, rarity, tier, chapter itp.). Renderowane pod search row'em. */
  pillGroups?: ReadonlyArray<FilterPillGroup>;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filtruj…"
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #bbb', borderRadius: 4 }}
        />
        <span style={{ fontSize: 12, color: '#666' }}>
          {visible} / {total}
        </span>
        {onCreate && (
          <button type="button" onClick={onCreate} style={btnPrimaryStyle}>
            {createLabel}
          </button>
        )}
      </div>
      {pillGroups && pillGroups.length > 0 && (
        <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
          {pillGroups.map((group) => (
            <PillRow key={group.label} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}

function PillRow({ group }: { group: FilterPillGroup }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 12, color: '#666', minWidth: 60 }}>{group.label}</span>
      {group.options.map((opt) => {
        const active = group.value === opt.value;
        const key = opt.value === null ? '__all__' : opt.value;
        return (
          <button
            key={key}
            type="button"
            onClick={() => group.onChange(opt.value)}
            style={{
              padding: '3px 10px',
              fontSize: 12,
              background: active ? '#2a1810' : '#fff',
              color: active ? '#fff' : '#444',
              border: active ? 'none' : '1px solid #ccc',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {opt.label}
            {typeof opt.count === 'number' && (
              <span
                style={{
                  marginLeft: 4,
                  fontSize: 10,
                  color: active ? '#ccc' : '#888',
                }}
              >
                ({opt.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
