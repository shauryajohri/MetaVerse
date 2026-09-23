import type { AttendanceRecord, Summary } from '../../api';

export type Tone = 'good' | 'warn' | 'bad';

export const tone = (percent: number, threshold: number): Tone =>
  percent >= threshold ? 'good' : percent >= threshold - 10 ? 'warn' : 'bad';

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', opts);

export function daysUntil(iso: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${iso}T00:00:00`).getTime() - today.getTime()) / 86_400_000);
}

export function Bar({ percent, threshold }: { percent: number; threshold: number }) {
  return (
    <div className={`bar ${tone(percent, threshold)}`} role="img" aria-label={`${percent}% of ${threshold}% required`}>
      <div className="bar-fill" style={{ width: `${Math.min(100, percent)}%` }} />
      <div className="bar-mark" style={{ left: `${threshold}%` }} />
    </div>
  );
}

/** One-line guidance: how many to attend, or how many can be skipped. */
export function advice(s: Summary, threshold: number, unit = 'classes') {
  if (s.mustAttend > 0) return `Attend the next ${s.mustAttend} ${unit} to reach ${threshold}%`;
  if (s.canMiss > 0) return `You can miss ${s.canMiss} and stay above ${threshold}%`;
  return `Right at the line — don't miss the next one`;
}

export function Dots({ records, count = 12 }: { records: AttendanceRecord[]; count?: number }) {
  return (
    <div className="dots">
      {records.slice(-count).map((r) => (
        <span key={r.date} className={`dot-rec ${r.status}`} title={`${fmtDate(r.date, { weekday: 'short', day: 'numeric', month: 'short' })} · ${r.status}`} />
      ))}
    </div>
  );
}

export function Percent({ value, threshold }: { value: number; threshold: number }) {
  return <span className={`pct ${tone(value, threshold)}`}>{value}%</span>;
}
