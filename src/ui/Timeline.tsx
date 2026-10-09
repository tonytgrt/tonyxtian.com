// Every piece of work on one strip from 2024 to 2026, in thin lanes so the
// ones that overlap in time don't cover each other. The selected one lights up.
// It repeats the index for the eye and the mouse, so it stays out of the tab
// order and away from screen readers.
import {entries} from '../content/entries';
import type {WorkEntry} from '../content/types';
import {select} from '../actions';
import {useStore} from '../store';

const FIRST = month('2024-09');
const LAST = month('2026-09');
const MONTHS = LAST - FIRST + 1;

function month(date: string): number {
  const [year, m] = date.split('-').map(Number);
  return year * 12 + (m - 1);
}

function at(m: number): number {
  return (100 * (m - FIRST)) / MONTHS;
}

interface Bar {
  entry: WorkEntry;
  index: number;
  start: number;
  end: number;   // the month after the last
  lane: number;
}

const bars: Bar[] = [];
const laneEnds: number[] = [];
entries
  .map((entry, index) => ({entry, index}))
  .filter((row): row is {entry: WorkEntry; index: number} => row.entry.kind === 'work')
  .map(({entry, index}) => ({entry, index, start: month(entry.span[0]), end: month(entry.span[1]) + 1, lane: 0}))
  .sort((a, b) => a.start - b.start || b.end - a.end)
  .forEach((bar) => {
    let lane = laneEnds.findIndex((end) => end <= bar.start);
    if (lane < 0) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = bar.end;
    bars.push({...bar, lane});
  });

const years = [2025, 2026];

export function Timeline() {
  const current = useStore((state) => state.index);
  return (
    <div className="timeline" style={{['--lanes' as string]: laneEnds.length}} aria-hidden="true">
      <div className="timeline__track">
        {years.map((year) => (
          <span key={year} className="timeline__year" style={{left: `${at(year * 12)}%`}}>{year}</span>
        ))}
        {bars.map((bar) => (
          <button
            key={bar.entry.id}
            type="button"
            tabIndex={-1}
            className="timeline__bar"
            data-pass={bar.entry.pass}
            aria-current={bar.index === current ? 'true' : undefined}
            title={`${bar.entry.title} · ${bar.entry.dates}`}
            style={{
              left: `${at(bar.start)}%`,
              width: `${at(bar.end) - at(bar.start)}%`,
              ['--lane' as string]: bar.lane,
            }}
            onClick={() => select(bar.index)}
          />
        ))}
      </div>
    </div>
  );
}
