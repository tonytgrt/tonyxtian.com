import {entries, FIRST_STOP, INTRO} from '../content/entries';
import {site} from '../content/site';
import {setSheet, step} from '../actions';
import {useStore} from '../store';
import {address, MailIcon, pad, passOf, placeInPass, shownPasses} from './bits';
import {DayNight} from './DayNight';
import {Timeline} from './Timeline';

export function BottomBar() {
  const index = useStore((state) => state.index);
  const webgl = useStore((state) => state.webgl);
  const entry = entries[index];
  const pass = passOf(entry);
  const [position, count] = placeInPass(index);
  return (
    <footer className="bottombar">
      <p className="bottombar__where">
        {pass ? (
          <>
            <span className="bottombar__pass">Pass {shownPasses.indexOf(pass) + 1} / {shownPasses.length}</span>
            <span className="bottombar__name" data-pass={pass.id}>{pass.name}</span>
            <span className="bottombar__count">{pad(position)} / {pad(count)}</span>
          </>
        ) : (
          <>
            <span className="bottombar__pass">{entry.kind === 'page' ? entry.label : ''}</span>
            <span className="bottombar__count addr">{address(index)}</span>
          </>
        )}
      </p>
      <Timeline />
      <div className="bottombar__end">
        <DayNight />
        <a className="bottombar__mail" href={`mailto:${site.email}`}>
          <MailIcon />
          <span>{site.email}</span>
        </a>
      </div>
      <div className="bottombar__phone">
        <button type="button" className="bottombar__index" aria-label="Index" onClick={() => setSheet(true)}>Addr</button>
        <span className="bottombar__count addr">{address(index)}</span>
        <DayNight label={false} />
        <span className="bottombar__arrows">
          <button type="button" aria-label="Previous" disabled={index <= (webgl ? INTRO : FIRST_STOP)} onClick={() => step(-1)}>↑</button>
          <button type="button" aria-label="Next" disabled={index === entries.length - 1} onClick={() => step(1)}>↓</button>
        </span>
      </div>
    </footer>
  );
}
