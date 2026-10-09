import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {boot, landed} from './actions';
import {createEngine} from './engine/engine';
import {bindInput} from './input/bind';
import {setState} from './store';
import {App} from './ui/App';
import './styles/app.css';

const canvas = document.getElementById('backdrop') as HTMLCanvasElement;
const engine = createEngine(canvas);
const input = bindInput();

boot(engine);
if (engine) {
  engine.onLanded = () => {
    landed();
    input.hold();
  };
  engine.onStats = (stats) => setState({stats});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App webgl={engine !== null} />
  </StrictMode>,
);
