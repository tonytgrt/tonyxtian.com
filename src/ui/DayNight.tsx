// The theme switch: night (the dark theme) or day (the light). Its icon is a
// little wheel of sky with the moon and the sun on opposite ends, clipped at
// its horizon. Switching turns it half round, clockwise to day, as the engine
// turns the real one over the sea: the moon sets on the right as the sun comes
// up on the left.
import {useId} from 'react';
import {toggleTheme} from '../actions';
import {useStore} from '../store';

const RAYS = Array.from({length: 8}, (_, i) => (i * Math.PI) / 4);

export function DayNight({label = true}: {label?: boolean}) {
  const day = useStore((state) => state.theme) === 'light';
  const id = useId();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={day}
      aria-label="Day theme"
      className="daynight"
      title={day ? 'Switch to night' : 'Switch to day'}
      onClick={toggleTheme}
    >
      <svg className="daynight__dial" viewBox="0 0 32 20" width="32" height="20" aria-hidden="true">
        <defs>
          <clipPath id={`${id}-sky`}>
            <rect x="0" y="0" width="32" height="15" />
          </clipPath>
          <mask id={`${id}-crescent`}>
            <rect x="0" y="0" width="32" height="20" fill="#fff" />
            <circle cx="18.6" cy="4.6" r="3.6" fill="#000" />
          </mask>
        </defs>
        <g clipPath={`url(#${id}-sky)`}>
          <g className="daynight__wheel">
            <circle className="daynight__moon" cx="16" cy="6" r="4" mask={`url(#${id}-crescent)`} />
            <g className="daynight__sun">
              <circle cx="16" cy="24" r="3" />
              {RAYS.map((a) => (
                <line
                  key={a}
                  x1={16 + Math.cos(a) * 4.4}
                  y1={24 + Math.sin(a) * 4.4}
                  x2={16 + Math.cos(a) * 5.8}
                  y2={24 + Math.sin(a) * 5.8}
                />
              ))}
            </g>
          </g>
        </g>
        <line className="daynight__horizon" x1="3" y1="15.5" x2="29" y2="15.5" />
      </svg>
      {label && <span className="daynight__label">{day ? 'Day' : 'Night'}</span>}
    </button>
  );
}
