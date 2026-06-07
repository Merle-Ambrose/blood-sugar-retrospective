import { isValid, parse } from 'date-fns';
import { RawGlucoseReading } from '../models/glucose.models';

/** Parses a FreeStyle Libre timestamp string (`MM-DD-YYYY HH:MM AM/PM`) into a `Date`. Returns `null` if unparseable. */
export function parseTimestamp(raw: string | undefined): Date | null {
  if (!raw) return null;
  const d = parse(raw, 'MM-dd-yyyy hh:mm a', new Date());
  return isValid(d) ? d : null;
}

/** Returns a stable string key representing the calendar date of `d`. */
export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Returns the hour of day (0 to 23) for a reading's timestamp. */
export function hourOf(r: RawGlucoseReading): number {
  return r.timestamp.getHours();
}

/** Groups readings by calendar date into a map keyed by {@link dateKey}. */
export function groupByDate(readings: RawGlucoseReading[]): Map<string, RawGlucoseReading[]> {
  const map = new Map<string, RawGlucoseReading[]>();
  for (const r of readings) {
    const key = dateKey(r.timestamp);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return map;
}
