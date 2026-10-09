import {mat4, vec3, vec4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';
import ShaderProgram from './ShaderProgram';

// In this file, `gl` is accessible because it is imported above
class OpenGLRenderer {
  constructor(public canvas: HTMLCanvasElement) {
  }

  setClearColor(r: number, g: number, b: number, a: number) {
    gl.clearColor(r, g, b, a);
  }

  setSize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  clear() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  // `viewProj` places and sizes the drawables on screen, `model` turns them,
  // and `eye` is the world-space eye position the rim glow looks back toward.
  // `brightness` dims them, for fading out.
  render(viewProj: mat4, model: mat4, eye: vec3, prog: ShaderProgram,
         drawables: Array<Drawable>, brightness: number = 1) {
    // The fireball's fragment shader supplies its own gradient and treats this
    // as a tint, so a neutral white leaves that palette as authored.
    let color = vec4.fromValues(brightness, brightness, brightness, 1);

    prog.setModelMatrix(model);
    prog.setViewProjMatrix(viewProj);
    prog.setGeometryColor(color);
    prog.setCameraPos(eye);

    for (let drawable of drawables) {
      prog.draw(drawable);
    }
  }
};

export default OpenGLRenderer;
