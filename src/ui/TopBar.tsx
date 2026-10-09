import {entries, INTRO} from '../content/entries';
import {site} from '../content/site';
import {select} from '../actions';
import {mediaUrl} from '../media';
import {useStore} from '../store';
import {ExternalLink, GitHubIcon, LinkedInIcon, passOf} from './bits';

// The renderer's own numbers, live: how long frames take on this machine, how
// many pixels it draws per CSS pixel, and the waves summed per ocean pixel.
function Hud() {
  const stats = useStore((state) => state.stats);
  if (!stats) {
    return null;
  }
  return (
    <p className="hud" title="Measured live: time between frames · pixels drawn per CSS pixel · waves summed per ocean pixel">
      <span className="hud__dot" aria-hidden="true" />
      <span>{stats.frameMs.toFixed(1)} ms</span>
      <span className="hud__sep">·</span>
      <span>{stats.ratio.toFixed(2)}×</span>
      <span className="hud__sep">·</span>
      <span>{stats.waves} waves</span>
    </p>
  );
}

export function TopBar() {
  const index = useStore((state) => state.index);
  const entry = entries[index];
  const where = entry.kind === 'page' ? entry.label : passOf(entry)?.name;
  return (
    <header className="topbar">
      {/* Home is the intro: back up to space (or About, without WebGL). */}
      <button type="button" className="topbar__home" onClick={() => select(INTRO)}>
        <img className="topbar__avatar" src={mediaUrl('head.jpg')} alt="" width="28" height="28" />
        <span className="topbar__name">{site.name}</span>
      </button>
      <span className="topbar__where" aria-hidden="true">{where}</span>
      <Hud />
      <nav className="topbar__links" aria-label="Links">
        <ExternalLink className="topbar__link" href={site.resume}>Resume</ExternalLink>
        <ExternalLink className="topbar__icon" href={site.github} label="GitHub"><GitHubIcon /></ExternalLink>
        <ExternalLink className="topbar__icon" href={site.linkedin} label="LinkedIn"><LinkedInIcon /></ExternalLink>
      </nav>
    </header>
  );
}
