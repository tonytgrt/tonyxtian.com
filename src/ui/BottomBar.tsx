import {entries} from '../content/entries';
import {site} from '../content/site';
import {replay, setSheet, step} from '../actions';
import {useStore} from '../store';
import {MailIcon, pad, passOf, placeInPass, shownPasses} from './bits';
import {Timeline} from './Timeline';

export function BottomBar({webgl}: {webgl: boolean}) {
  const index = useStore((state) => state.index);
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
            <span className="bottombar__count">{pad(index)} / {pad(entries.length - 1)}</span>
          </>
        )}
      </p>
      <Timeline />
      <div className="bottombar__end">
        {webgl && (
          <button type="button" className="bottombar__replay" onClick={replay}>Replay descent</button>
        )}
        <a className="bottombar__mail" href={`mailto:${site.email}`}>
          <MailIcon />
          <span>{site.email}</span>
        </a>
      </div>
      <div className="bottombar__phone">
        <button type="button" className="bottombar__index" onClick={() => setSheet(true)}>Index</button>
        <span className="bottombar__count">{pad(index)} / {pad(entries.length - 1)}</span>
        <span className="bottombar__arrows">
          <button type="button" aria-label="Previous" disabled={index === 0} onClick={() => step(-1)}>↑</button>
          <button type="button" aria-label="Next" disabled={index === entries.length - 1} onClick={() => step(1)}>↓</button>
        </span>
      </div>
    </footer>
  );
}
