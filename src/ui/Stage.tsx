// The stage: the selected entry over the live ocean. A piece of work shows in
// a viewport frame with its counters beside it; About and Contact are type
// alone.
import {useState, type CSSProperties, type ReactNode} from 'react';
import {entries, entryIndex} from '../content/entries';
import {about, contact, site} from '../content/site';
import type {WorkEntry} from '../content/types';
import {open} from '../actions';
import {useStore} from '../store';
import {mediaUrl} from '../media';
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

// The first stop once landed: the name, with the portrait framed beside it
// like the work's pictures, and how to get around.
function AboutStage() {
  const index = entryIndex('about');
  const portrait = about.portrait;
  const phone = about.portraitPhone;
  return (
    <div className="plate plate--about">
      <div className="about">
        <div className="about__head">
          <Kicker index={index} />
          <h2 className="plate__title">{site.name}</h2>
        </div>
        <figure
          className="portrait"
          style={{'--ar': portrait.width / portrait.height, '--ar-phone': phone.width / phone.height} as CSSProperties}
        >
          <figcaption className="frame__bar">
            <span>Viewport · Portrait</span>
            <span>{portrait.width} × {portrait.height}</span>
          </figcaption>
          {/* Only the crop the screen shows is downloaded. */}
          <picture>
            <source media="(min-width: 760px)" srcSet={mediaUrl(portrait.src)} width={portrait.width} height={portrait.height} />
            <img
              className="portrait__media"
              src={mediaUrl(phone.src)}
              alt={portrait.alt}
              width={phone.width}
              height={phone.height}
              decoding="async"
            />
          </picture>
        </figure>
        <div className="about__body">
          <p className="plate__tagline">{about.tagline}</p>
          <p className="plate__text"><Rich text={about.bio[0]} /></p>
          <div className="actions">
            <button type="button" className="btn btn--primary" onClick={() => open(index)}>
              Read more <span aria-hidden="true">→</span>
            </button>
            <a className="btn" href={`mailto:${site.email}`}>Contact</a>
          </div>
          <p className="hint">
            <span className="hint--pointer">Scroll, or press <kbd>↓</kbd>, to step through the work. <kbd>Enter</kbd> opens a case study.</span>
            <span className="hint--touch">Swipe to step through the work.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ContactStage() {
  return (
    <>
      <div className="plate plate--contact">
        <div className="contact">
          <Kicker index={entries.length - 1} />
          <h2 className="plate__title">{contact.title}</h2>
          <p className="plate__text">{contact.text}</p>
          <a className="contact__mail" href={`mailto:${site.email}`}>{site.email}</a>
          <div className="actions">
            <ExternalLink className="btn" href={site.linkedin}><LinkedInIcon /> LinkedIn</ExternalLink>
            <ExternalLink className="btn" href={site.github}><GitHubIcon /> GitHub</ExternalLink>
            <ExternalLink className="btn" href={site.resume}>Resume <span aria-hidden="true">↗</span></ExternalLink>
          </div>
        </div>
      </div>
      <p className="copyright">
        <span>
          {site.copyright}{' '}
          <a href={site.url} target="_blank" rel="noreferrer">{site.copyrightName}</a>
        </span>
      </p>
    </>
  );
}

// One entry's turn on the stage. It comes in from below on a step down and
// from above on a step up: whichever way it was when it arrived, so that a
// later change of direction can't restart the entrance and flash it.
function Entrance({direction, pass, children}: {direction: 1 | -1; pass?: string; children: ReactNode}) {
  const [from] = useState(direction);
  return (
    <div className="stage__inner" data-direction={from} data-pass={pass}>
      {children}
    </div>
  );
}

export function Stage() {
  // Not always the selected entry: the intro has nothing on the stage, which
  // is hidden while it plays (see .app[data-landing] in the CSS). Going up to
  // it, the stage keeps the last entry as it fades out; coming down, the next
  // stop enters only once the camera has landed.
  const index = useStore((state) => state.onStage);
  const arrivals = useStore((state) => state.arrivals);
  const direction = useStore((state) => state.direction);
  const entry = entries[index];

  let body;
  if (entry.kind === 'work') {
    body = <WorkStage entry={entry} index={index} />;
  } else if (entry.id === 'about') {
    body = <AboutStage />;
  } else {
    body = <ContactStage />;
  }

  return (
    <main className="stage" data-entry={entry.id}>
      <Entrance key={`${entry.id}:${arrivals}`} direction={direction} pass={passOf(entry)?.id}>
        {body}
      </Entrance>
    </main>
  );
}
