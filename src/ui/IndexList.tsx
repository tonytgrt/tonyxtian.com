// The event list: every stop, grouped into passes, each with its number and
// its headline result. Used by the side panel and the phone's sheet. Intro,
// at the top, goes back up to the descent; without WebGL there is none.
import {entries, hasCaseStudy} from '../content/entries';
import type {Entry, Pass} from '../content/types';
import {open, select} from '../actions';
import {useStore} from '../store';
import {address, shownPasses} from './bits';

interface Group {
  pass: Pass | null;
  rows: {entry: Entry; index: number}[];
}

const groups: Group[] = [
  {pass: null, rows: []},
  ...shownPasses.map((pass) => ({pass, rows: []})),
  {pass: null, rows: []},
];
entries.forEach((entry, index) => {
  if (entry.kind === 'work') {
    groups.find((group) => group.pass?.id === entry.pass)?.rows.push({entry, index});
  } else {
    groups[entry.id === 'contact' ? groups.length - 1 : 0].rows.push({entry, index});
  }
});

export function IndexList() {
  const current = useStore((state) => state.index);
  const webgl = useStore((state) => state.webgl);
  return (
    <ol className="events">
      {groups.map((group, g) => (
        <li key={g} className="events__group" data-pass={group.pass?.id}>
          {group.pass && (
            <p className="events__marker">
              <span className="events__caret" aria-hidden="true">▾</span>
              <span className="events__pass">{group.pass.name}</span>
              <span className="events__count">{group.rows.length}</span>
            </p>
          )}
          <ol>
            {group.rows.filter(({entry}) => webgl || entry.id !== 'intro').map(({entry, index}) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="events__row"
                  aria-current={index === current ? 'true' : undefined}
                  onClick={() => (index === current && hasCaseStudy(entry) ? open(index) : select(index))}
                >
                  <span className="events__num">{address(index)}</span>
                  <span className="events__name">{entry.kind === 'work' ? entry.label ?? entry.title : entry.label}</span>
                  {entry.kind === 'work' && <span className="events__metric">{entry.metric}</span>}
                </button>
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}
