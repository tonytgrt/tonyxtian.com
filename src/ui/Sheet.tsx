// The index on a phone: a sheet that slides up over the stage.
import {setSheet} from '../actions';
import {useStore} from '../store';
import {IndexList} from './IndexList';

export function Sheet() {
  const sheet = useStore((state) => state.sheet);
  return (
    <div className="sheet" data-open={sheet} inert={!sheet}>
      <div className="sheet__scrim" onClick={() => setSheet(false)} />
      <div className="sheet__panel" role="dialog" aria-label="Index">
        <div className="sheet__head">
          <span>Index</span>
          <button type="button" className="sheet__close" onClick={() => setSheet(false)}>Close</button>
        </div>
        <div className="sheet__scroll" data-scroll>
          <IndexList />
        </div>
      </div>
    </div>
  );
}
