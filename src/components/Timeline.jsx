import { CLOSE_HOUR, OPEN_HOUR, fmtTime, toMinutes } from '../lib/format.js';

const SPAN = (CLOSE_HOUR - OPEN_HOUR) * 60;
const pct = (minutes) => ((minutes - OPEN_HOUR * 60) / SPAN) * 100;

export function overlaps(slots, start, end) {
  const s = toMinutes(start);
  const e = toMinutes(end);
  return slots.some((slot) => slot.status !== 'PENDING' && toMinutes(slot.startTime) < e && toMinutes(slot.endTime) > s);
}

/**
 * One day of a resource, 08:00 to 20:00. Dark blocks are taken, green is free.
 * `pick` previews the time range the person is about to book.
 */
export default function Timeline({ slots = [], pick, name }) {
  const hours = [];
  for (let h = OPEN_HOUR; h <= CLOSE_HOUR; h += 2) hours.push(h);

  const validPick = pick && pick.start && pick.end && toMinutes(pick.end) > toMinutes(pick.start);
  const clash = validPick && overlaps(slots, pick.start, pick.end);

  const summary = slots.length
    ? `${name}: booked ${slots.map((s) => `${fmtTime(s.startTime)} to ${fmtTime(s.endTime)}${s.status === 'PENDING' ? ' (waiting for approval)' : ''}`).join(', ')}`
    : `${name}: free all day`;

  return (
    <div className="timeline-wrap" role="img" aria-label={summary}>
      <div className="timeline">
        {slots.map((s, i) => (
          <div
            key={i}
            className={`block ${s.status === 'PENDING' ? 'pending' : ''}`}
            style={{ left: `${pct(toMinutes(s.startTime))}%`, width: `${pct(toMinutes(s.endTime)) - pct(toMinutes(s.startTime))}%` }}
            title={`${fmtTime(s.startTime)} to ${fmtTime(s.endTime)}, ${s.bookedBy}${s.status === 'PENDING' ? ' (waiting for approval)' : ''}`}
          />
        ))}
        {validPick && (
          <div
            className={`pick ${clash ? 'clash' : ''}`}
            style={{ left: `${pct(toMinutes(pick.start))}%`, width: `${pct(toMinutes(pick.end)) - pct(toMinutes(pick.start))}%` }}
          />
        )}
      </div>
      <div className="ticks" aria-hidden="true">
        {hours.map((h) => (
          <span key={h} style={{ left: `${pct(h * 60)}%` }}>{String(h).padStart(2, '0')}</span>
        ))}
      </div>
    </div>
  );
}
