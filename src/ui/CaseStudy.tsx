// A case study, docked beside the stage (full screen on a phone). It has its
// own address; Esc, the close button or the browser's back button close it.
import {useEffect, useRef} from 'react';
import {entries, hasCaseStudy} from '../content/entries';
import {about, site} from '../content/site';
import type {WorkEntry} from '../content/types';
import {caseNeighbour, close, stepCase} from '../actions';
import {useStore} from '../store';
import {Blocks, ExternalLink, Media, Rich} from './bits';

function Neighbour({direction}: {direction: 1 | -1}) {
  const index = useStore(() => caseNeighbour(direction));
  if (index < 0) {
    return <span />;
  }
  const entry = entries[index];
  const name = entry.kind === 'work' ? entry.label ?? entry.title : entry.title;
  return (
    <button
      type="button"
      className={`case__step case__step--${direction > 0 ? 'next' : 'prev'}`}
      onClick={() => stepCase(direction)}
      title={direction > 0 ? 'Next (→)' : 'Previous (←)'}
    >
      {direction < 0 && <span aria-hidden="true">←</span>}
      <span>{name}</span>
      {direction > 0 && <span aria-hidden="true">→</span>}
    </button>
  );
}

function WorkCase({entry}: {entry: WorkEntry}) {
  const meta: [string, string][] = [['Stack', entry.stack.join(' · ')], ['Dates', entry.dates]];
  if (entry.place) {
    meta.push(['Place', entry.place]);
  }
  if (entry.team) {
    meta.push(['Team', entry.team]);
  }
  return (
    <>
      <p className="case__tagline">{entry.tagline}</p>
      <dl className="meta meta--case">
        {meta.map(([term, value]) => (
          <div key={term}>
            <dt>{term}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {entry.counters.length > 0 && (
        <dl className="case__counters">
          {entry.counters.map((counter) => (
            <div key={counter.label}>
              <dt>{counter.label}</dt>
              <dd>{counter.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {entry.hero && (
        <figure className="case__hero">
          <Media media={entry.hero} />
        </figure>
      )}
      <div className="case__body">
        <Blocks blocks={entry.blocks} />
      </div>
      {entry.links.length > 0 && (
        <div className="actions">
          {entry.links.map((link, i) => (
            <ExternalLink key={link.href} className={i === 0 ? 'btn btn--primary' : 'btn'} href={link.href}>
              {link.label} <span aria-hidden="true">↗</span>
            </ExternalLink>
          ))}
        </div>
      )}
    </>
  );
}

function AboutCase() {
  return (
    <>
      <p className="case__tagline">{about.tagline}</p>
      <div className="case__body">
        {about.bio.map((paragraph) => <p key={paragraph}><Rich text={paragraph} /></p>)}
      </div>
      <h2 className="case__section">Skills</h2>
      {about.skills.map((group) => (
        <div key={group.group} className="skills">
          <h3 className="skills__group">{group.group}</h3>
          <ul className="skills__list">
            {group.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
      <div className="actions">
        <a className="btn btn--primary" href={`mailto:${site.email}`}>Contact</a>
        <ExternalLink className="btn" href={site.resume}>Resume <span aria-hidden="true">↗</span></ExternalLink>
      </div>
    </>
  );
}

export function CaseStudy() {
  const isOpen = useStore((state) => state.open);
  const index = useStore((state) => state.index);
  const entry = entries[index];
  const scroll = useRef<HTMLDivElement>(null);
  const shown = isOpen && hasCaseStudy(entry);

  // Focus moves into the case study, so the keys scroll it, and back to
  // wherever it was once it closes.
  useEffect(() => {
    if (!shown) {
      return;
    }
    const before = document.activeElement as HTMLElement | null;
    return () => {
      if (before && document.contains(before)) {
        before.focus({preventScroll: true});
      }
    };
  }, [shown]);

  useEffect(() => {
    if (shown && scroll.current) {
      scroll.current.scrollTop = 0;
      scroll.current.focus({preventScroll: true});
    }
  }, [shown, index]);

  if (!shown) {
    return null;
  }
  return (
    <aside className="case" role="dialog" aria-modal="false" aria-labelledby="case-title">
      <div className="case__bar">
        <Neighbour direction={-1} />
        <Neighbour direction={1} />
        <button type="button" className="case__close" onClick={close} aria-label="Close" title="Close (Esc)">
          <kbd>Esc</kbd>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <div className="case__scroll" ref={scroll} tabIndex={-1} data-scroll data-pane-scroll>
        <article key={entry.id} className="case__article">
          <p className="case__kicker">{entry.kind === 'work' ? 'Case study' : 'About'}</p>
          <h1 id="case-title" className="case__title">{entry.kind === 'work' ? entry.title : site.name}</h1>
          {entry.kind === 'work' ? <WorkCase entry={entry} /> : <AboutCase />}
        </article>
      </div>
    </aside>
  );
}
