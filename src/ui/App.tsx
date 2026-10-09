import {entries} from '../content/entries';
import {useStore} from '../store';
import {BottomBar} from './BottomBar';
import {CaseStudy} from './CaseStudy';
import {IndexList} from './IndexList';
import {Intro} from './Intro';
import {Sheet} from './Sheet';
import {Stage} from './Stage';
import {TopBar} from './TopBar';

// Tells screen readers where a step went.
function Status() {
  const index = useStore((state) => state.index);
  return (
    <p className="visually-hidden" aria-live="polite">
      {entries[index].title}, {index + 1} of {entries.length}
    </p>
  );
}

export function App() {
  const landing = useStore((state) => state.landing);
  const webgl = useStore((state) => state.webgl);
  const isOpen = useStore((state) => state.open);
  return (
    <>
      <div className="app" data-landing={landing} data-open={isOpen} inert={landing}>
        <TopBar />
        <nav className="index" aria-label="Index">
          <p className="index__head">
            <span>Addr</span>
            {/* Without WebGL there is no intro to count. */}
            <span>{entries.length - (webgl ? 0 : 1)} locations</span>
          </p>
          <div className="index__scroll" data-scroll>
            <IndexList />
          </div>
        </nav>
        <Stage />
        <BottomBar />
      </div>
      <CaseStudy />
      <Sheet />
      <Intro />
      <Status />
    </>
  );
}
