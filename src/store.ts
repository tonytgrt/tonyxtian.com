// The little state the page has, shared by the components and the input
// handlers. React reads it through useSyncExternalStore; the WebGL engine
// never touches it, so nothing here changes per frame.
import {useSyncExternalStore} from 'react';
import type {EngineStats} from './engine/engine';

export interface State {
  index: number;            // the entry on the stage
  open: boolean;            // its case study is open
  landing: boolean;         // the descent is playing, so the site isn't shown yet
  sheet: boolean;           // the phone's index sheet is up
  direction: 1 | -1;        // which way the last step went, for the stage's entrance
  stats: EngineStats | null;
}

let state: State = {
  index: 0,
  open: false,
  landing: false,
  sheet: false,
  direction: 1,
  stats: null,
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
