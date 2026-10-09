// The stage: the selected entry over the live ocean. A piece of work shows in
// a viewport frame with its counters beside it; the title card, About and
// Contact are type alone.
import type {CSSProperties} from 'react';
import {entries, shownWork} from '../content/entries';
import {about, contact, home, site} from '../content/site';
import type {WorkEntry} from '../content/types';
import {close, open, select} from '../actions';
import {useStore} from '../store';
import {ExternalLink, GitHubIcon, LinkedInIcon, Media, pad, passOf, placeInPass, Rich} from './bits';

// Shown as a column beside the frame on wide screens and as a row in the card
// on narrower ones; CSS shows one or the other.
function Counters({entry, inline = false}: {entry: WorkEntry; inline?: boolean}) {
  if (entry.counters.length === 0) {
    return null;
  }
  return (
    <dl className={inline ? 'counters counters--inline' : 'counters counters--column'}>
      {entry.counters.map((counter) => (
        <div key={counter.label} className="counter">
          <dt className="counter__label">{counter.label}</dt>
          <dd className="counter__value">{counter.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Kicker({index}: {index: number}) {
  const entry = entries[index];
  const pass = passOf(entry);
  const [position, count] = placeInPass(index);
  return (
    <p className="kicker" data-pass={pass?.id}>
      <span className="kicker__dot" aria-hidden="true" />
      {pass ? `${pass.name} · ${pad(position)} / ${pad(count)}` : entry.kind === 'page' ? entry.label : ''}
    </p>
  );
}

function WorkStage({entry, index}: {entry: WorkEntry; index: number}) {
  const hero = entry.hero;
  const meta: [string, string][] = [
    ['Stack', entry.stack.join(' · ')],
    ['Dates', entry.dates],
  ];
  if (entry.place) {
    meta.push(['Place', entry.place]);
  }
  if (entry.team) {
    meta.push(['Team', entry.team]);
  }
  const link = entry.links[0];
  // Work without a picture leads with its first paragraph instead.
  const first = entry.blocks[0];
  const lead = first?.kind === 'p' ? first.text : null;
  return (
    <div className={hero ? 'shot' : 'shot shot--type'}>
      <div className="shot__view">
        {hero && (
          <figure className="frame" style={{'--ar': hero.width / hero.height} as CSSProperties}>
            <figcaption className="frame__bar">
              <span>Viewport · {entry.label ?? entry.title}</span>
              <span>{hero.width} × {hero.height}</span>
            </figcaption>
            <Media media={hero} className="frame__media" />
          </figure>
        )}
        <Counters entry={entry} />
      </div>
      <div className="card">
        <Kicker index={index} />
        <h2 className="card__title">{entry.title}</h2>
        <p className="card__tagline">{entry.tagline}</p>
        {!hero && lead && <p className="card__lead"><Rich text={lead} /></p>}
        <Counters entry={entry} inline />
        <dl className="meta">
          {meta.map(([term, value]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="actions">
          <button type="button" className="btn btn--primary" onClick={() => open(index)}>
            Open case study <span aria-hidden="true">→</span>
          </button>
          {link && (
            <ExternalLink className="btn" href={link.href}>
              {link.label} <span aria-hidden="true">↗</span>
            </ExternalLink>
          )}
        </div>
      </div>
    </div>
  );
}

function HomeStage() {
  const first = entries.indexOf(shownWork[0]);
  return (
    <div className="plate plate--home">
      <Kicker index={0} />
      <h1 className="plate__name">{site.shortName}</h1>
      <p className="plate__tagline">{home.tagline}</p>
      <ul className="plate__lines">
        {home.lines.map((line) => <li key={line}>{line}</li>)}
      </ul>
      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={() => select(first)}>
          See the work <span aria-hidden="true">↓</span>
        </button>
        <button type="button" className="btn" onClick={() => select(1)}>About me</button>
      </div>
      <p className="hint">
        <span className="hint--pointer">Scroll, or press <kbd>↓</kbd>, to step through the work. <kbd>Enter</kbd> opens a case study.</span>
        <span className="hint--touch">Swipe to step through the work.</span>
      </p>
    </div>
  );
}

function AboutStage() {
  return (
    <div className="plate plate--about">
      <Kicker index={1} />
      <h2 className="plate__title">About</h2>
      <p className="plate__tagline">{about.tagline}</p>
      <p className="plate__text"><Rich text={about.bio[0]} /></p>
      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={() => open(1)}>
          Read more <span aria-hidden="true">→</span>
        </button>
        <a className="btn" href={`mailto:${site.email}`}>Contact</a>
      </div>
    </div>
  );
}

function ContactStage() {
  return (
    <>
      <div className="plate plate--contact">
        <Kicker index={entries.length - 1} />
        <h2 className="plate__title">{contact.title}</h2>
        <p className="plate__text">{contact.text}</p>
        <a className="contact__mail" href={`mailto:${site.email}`}>{site.email}</a>
        <div className="actions actions--center">
          <ExternalLink className="btn" href={site.linkedin}><LinkedInIcon /> LinkedIn</ExternalLink>
          <ExternalLink className="btn" href={site.github}><GitHubIcon /> GitHub</ExternalLink>
          <ExternalLink className="btn" href={site.resume}>Resume <span aria-hidden="true">↗</span></ExternalLink>
        </div>
      </div>
      <p className="copyright">
        {site.copyright}{' '}
        <a href={site.url} target="_blank" rel="noreferrer">{site.copyrightName}</a>
      </p>
    </>
  );
}

export function Stage() {
  const index = useStore((state) => state.index);
  const direction = useStore((state) => state.direction);
  const isOpen = useStore((state) => state.open);
  const entry = entries[index];

  let body;
  if (entry.kind === 'work') {
    body = <WorkStage entry={entry} index={index} />;
  } else if (entry.id === 'home') {
    body = <HomeStage />;
  } else if (entry.id === 'about') {
    body = <AboutStage />;
  } else {
    body = <ContactStage />;
  }

  return (
    <main
      className="stage"
      data-entry={entry.id}
      // With a case study open the stage is only a backdrop to it, and a
      // click on it closes the case study.
      onClick={isOpen ? close : undefined}
    >
      <div key={entry.id} className="stage__inner" data-direction={direction} data-pass={passOf(entry)?.id}>
        {body}
      </div>
    </main>
  );
}
