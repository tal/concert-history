/** @jsxImportSource preact */
import { STATUS_LABELS, type Show, type ShowType } from '../../model';
import { TYPE_LABELS } from '../lib/format';

export function TypePill({ type }: { type: ShowType }) {
  return <span class={`pill pill--${type}`}>{TYPE_LABELS[type]}</span>;
}

export function EvidencePill({ show }: { show: Show }) {
  return <span class="pill pill--evidence">{STATUS_LABELS[show.concert.status]}</span>;
}
