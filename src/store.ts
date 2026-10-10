// The little state the page has, shared by the components and the input
// handlers. React reads it through useSyncExternalStore; the WebGL engine
// never touches it, so nothing here changes per frame.
import {useSyncExternalStore} from 'react';
import type {EngineStats} from './engine/engine';

// The dark theme is the site's own: the night sea. The light theme is its day.
export type Theme = 'dark' | 'light';

export interface State {
  index: number;            // the selected entry
  onStage: number;          // the entry the stage shows: the selected one, except
                            // that the intro has nothing there of its own
  arrivals: number;         // how many times the descent has landed, so the
                            // stage's entrance plays again each time
  open: boolean;            // its case study is open
  landing: boolean;         // the descent is playing, so the site isn't shown yet
  sheet: boolean;           // the phone's index sheet is up
  direction: 1 | -1;        // which way the last step went, for the stage's entrance
  stats: EngineStats | null;
  webgl: boolean;           // the engine is drawing, so there is a descent and an intro
  theme: Theme;
  skyTurns: number;         // half turns of the switch's wheel: one per switch, always
                            // clockwise, as the engine's wheel of sky turns
}

let state: State = {
  index: 0,
  onStage: 0,
  arrivals: 0,
  open: false,
  landing: false,
  sheet: false,
  direction: 1,
  stats: null,
  webgl: false,
  theme: 'dark',
  skyTurns: 0,
};

const listeners = new Set<() => void>();

export function getState(): State {
  return state;
}

export function setState(patch: Partial<State>) {
  state = {...state, ...patch};
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Re-renders only when the selected value changes, so pick primitives or
// objects the store keeps as they are.
export function useStore<T>(select: (state: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}
