// What a first visit opens on, out in space above the planet. It fades as the
// camera starts down, through --descent, which the engine sets every frame.
import {site} from '../content/site';
import {skip} from '../actions';
import {useStore} from '../store';

export function Intro() {
  const landing = useStore((state) => state.landing);
  if (!landing) {
    return null;
  }
  return (
    <section className="intro" aria-label="Introduction">
      <div className="intro__content">
        <h1 className="intro__name">{site.shortName}</h1>
        <p className="intro__sub">{site.subtitle}</p>
      </div>
      <div className="intro__hint">
        <span className="intro__mouse" aria-hidden="true" />
        <span className="hint--pointer">Scroll to descend</span>
        <span className="hint--touch">Swipe up to descend</span>
      </div>
      <button type="button" className="intro__skip" onClick={skip}>Skip intro</button>
    </section>
  );
}
