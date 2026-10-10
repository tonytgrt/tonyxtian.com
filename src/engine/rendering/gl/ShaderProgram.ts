import {vec3, vec4, mat4} from 'gl-matrix';
import Drawable from './Drawable';
import {gl} from '../../globals';

let activeProgram: WebGLProgram | null = null;

// The procedural background's shape parameters, read by background-frag.glsl.
export interface BackgroundParams {
  horizon: number;      // u_Horizon
  atmosphere: number;   // u_Atmosphere
}

// Where the camera is: the landing, the voyage between entries and the night
// finale, read by background-frag.glsl.
export interface BackgroundView {
  pan: number;          // u_Pan
  zoom: number;         // u_Zoom
  cloudZoom: number;    // u_CloudZoom
  spin: number;         // u_Spin
  cloudDrift: number;   // u_CloudDrift
  inside: number;       // u_Inside
  scroll: number;       // u_Scroll
  night: number;        // u_Night
  finale: number;       // u_Finale
  day: number;          // u_Day
  skyTurn: number;      // u_SkyTurn
}

// The shape parameters the fireball's vertex shader reads. `params` in engine.ts
// satisfies this.
export interface FireballParams {
  displacement: number;   // u_LowFreqAmp
  lobeScale: number;      // u_LowFreqScale
  detail: number;         // u_FbmAmp
  detailScale: number;    // u_FbmScale
  octaves: number;        // u_Octaves
  roilSpeed: number;      // u_RoilSpeed
  pulsePeriod: number;    // u_PulsePeriod
  pulseStrength: number;  // u_PulseStrength
  heat: number;           // u_Heat
  flow: number;           // u_Flow
  bandBlend: number;      // u_BandBlend
  flameHeight: number;    // u_FlameHeight
  taper: number;          // u_Taper
  bands: number;          // u_Bands
}

export class Shader {
  shader: WebGLShader;

  constructor(type: number, source: string) {
    this.shader = gl.createShader(type)!;
    gl.shaderSource(this.shader, source);
    gl.compileShader(this.shader);

    if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
      throw gl.getShaderInfoLog(this.shader);
    }
  }
};

class ShaderProgram {
  prog: WebGLProgram;

  attrPos: number;
  attrNor: number;
  attrCol: number;

  unifModel: WebGLUniformLocation | null;
  unifModelInvTr: WebGLUniformLocation | null;
  unifViewProj: WebGLUniformLocation | null;
  unifColor: WebGLUniformLocation | null;
  unifTime: WebGLUniformLocation | null;
  unifLowFreqAmp: WebGLUniformLocation | null;
  unifLowFreqScale: WebGLUniformLocation | null;
  unifFbmAmp: WebGLUniformLocation | null;
  unifFbmScale: WebGLUniformLocation | null;
  unifOctaves: WebGLUniformLocation | null;
  unifRoilSpeed: WebGLUniformLocation | null;
  unifPulsePeriod: WebGLUniformLocation | null;
  unifPulseStrength: WebGLUniformLocation | null;
  unifHeat: WebGLUniformLocation | null;
  unifFlow: WebGLUniformLocation | null;
  unifBandBlend: WebGLUniformLocation | null;
  unifFlameHeight: WebGLUniformLocation | null;
  unifTaper: WebGLUniformLocation | null;
  unifBands: WebGLUniformLocation | null;
  unifCameraPos: WebGLUniformLocation | null;
  unifCurvature: WebGLUniformLocation | null;
  unifDimensions: WebGLUniformLocation | null;
  unifHorizon: WebGLUniformLocation | null;
  unifAtmosphere: WebGLUniformLocation | null;
  unifPan: WebGLUniformLocation | null;
  unifZoom: WebGLUniformLocation | null;
  unifCloudZoom: WebGLUniformLocation | null;
  unifSpin: WebGLUniformLocation | null;
  unifCloudDrift: WebGLUniformLocation | null;
  unifInside: WebGLUniformLocation | null;
  unifScroll: WebGLUniformLocation | null;
  unifNight: WebGLUniformLocation | null;
  unifFinale: WebGLUniformLocation | null;
  unifDay: WebGLUniformLocation | null;
  unifSkyTurn: WebGLUniformLocation | null;

  constructor(shaders: Array<Shader>) {
    this.prog = gl.createProgram();

    for (let shader of shaders) {
      gl.attachShader(this.prog, shader.shader);
    }
    gl.linkProgram(this.prog);
    if (!gl.getProgramParameter(this.prog, gl.LINK_STATUS)) {
      throw gl.getProgramInfoLog(this.prog);
    }

    this.attrPos = gl.getAttribLocation(this.prog, "vs_Pos");
    this.attrNor = gl.getAttribLocation(this.prog, "vs_Nor");
    this.attrCol = gl.getAttribLocation(this.prog, "vs_Col");
    this.unifModel      = gl.getUniformLocation(this.prog, "u_Model");
    this.unifModelInvTr = gl.getUniformLocation(this.prog, "u_ModelInvTr");
    this.unifViewProj   = gl.getUniformLocation(this.prog, "u_ViewProj");
    this.unifColor      = gl.getUniformLocation(this.prog, "u_Color");
    this.unifTime       = gl.getUniformLocation(this.prog, "u_Time");

    this.unifLowFreqAmp    = gl.getUniformLocation(this.prog, "u_LowFreqAmp");
    this.unifLowFreqScale  = gl.getUniformLocation(this.prog, "u_LowFreqScale");
    this.unifFbmAmp        = gl.getUniformLocation(this.prog, "u_FbmAmp");
    this.unifFbmScale      = gl.getUniformLocation(this.prog, "u_FbmScale");
    this.unifOctaves       = gl.getUniformLocation(this.prog, "u_Octaves");
    this.unifRoilSpeed     = gl.getUniformLocation(this.prog, "u_RoilSpeed");
    this.unifPulsePeriod   = gl.getUniformLocation(this.prog, "u_PulsePeriod");
    this.unifPulseStrength = gl.getUniformLocation(this.prog, "u_PulseStrength");
    this.unifHeat          = gl.getUniformLocation(this.prog, "u_Heat");
    this.unifFlow          = gl.getUniformLocation(this.prog, "u_Flow");
    this.unifBandBlend     = gl.getUniformLocation(this.prog, "u_BandBlend");
    this.unifFlameHeight   = gl.getUniformLocation(this.prog, "u_FlameHeight");
    this.unifTaper         = gl.getUniformLocation(this.prog, "u_Taper");
    this.unifBands         = gl.getUniformLocation(this.prog, "u_Bands");
    this.unifCameraPos     = gl.getUniformLocation(this.prog, "u_CameraPos");
    this.unifCurvature     = gl.getUniformLocation(this.prog, "u_Curvature");

    this.unifDimensions    = gl.getUniformLocation(this.prog, "u_Dimensions");
    this.unifHorizon       = gl.getUniformLocation(this.prog, "u_Horizon");
    this.unifAtmosphere    = gl.getUniformLocation(this.prog, "u_Atmosphere");

    this.unifPan           = gl.getUniformLocation(this.prog, "u_Pan");
    this.unifZoom          = gl.getUniformLocation(this.prog, "u_Zoom");
    this.unifCloudZoom     = gl.getUniformLocation(this.prog, "u_CloudZoom");
    this.unifSpin          = gl.getUniformLocation(this.prog, "u_Spin");
    this.unifCloudDrift    = gl.getUniformLocation(this.prog, "u_CloudDrift");
    this.unifInside        = gl.getUniformLocation(this.prog, "u_Inside");
    this.unifScroll        = gl.getUniformLocation(this.prog, "u_Scroll");
    this.unifNight         = gl.getUniformLocation(this.prog, "u_Night");
    this.unifFinale        = gl.getUniformLocation(this.prog, "u_Finale");
    this.unifDay           = gl.getUniformLocation(this.prog, "u_Day");
    this.unifSkyTurn       = gl.getUniformLocation(this.prog, "u_SkyTurn");
  }

  use() {
    if (activeProgram !== this.prog) {
      gl.useProgram(this.prog);
      activeProgram = this.prog;
    }
  }

  setModelMatrix(model: mat4) {
    this.use();
    if (this.unifModel !== null) {
      gl.uniformMatrix4fv(this.unifModel, false, model);
    }

    if (this.unifModelInvTr !== null) {
      let modelinvtr: mat4 = mat4.create();
      mat4.transpose(modelinvtr, model);
      mat4.invert(modelinvtr, modelinvtr);
      gl.uniformMatrix4fv(this.unifModelInvTr, false, modelinvtr);
    }
  }

  setViewProjMatrix(vp: mat4) {
    this.use();
    if (this.unifViewProj !== null) {
      gl.uniformMatrix4fv(this.unifViewProj, false, vp);
    }
  }

  setGeometryColor(color: vec4) {
    this.use();
    if (this.unifColor !== null) {
      gl.uniform4fv(this.unifColor, color);
    }
  }

  setTime(t: number) {
    this.use();
    if (this.unifTime !== null) {
      gl.uniform1f(this.unifTime, t);
    }
  }

  // The dat.GUI-driven shape controls. Grouped into one call because they are
  // always set together, once per frame.
  setFireballParams(p: FireballParams) {
    this.use();
    if (this.unifLowFreqAmp !== null) {
      gl.uniform1f(this.unifLowFreqAmp, p.displacement);
    }
    if (this.unifLowFreqScale !== null) {
      gl.uniform1f(this.unifLowFreqScale, p.lobeScale);
    }
    if (this.unifFbmAmp !== null) {
      gl.uniform1f(this.unifFbmAmp, p.detail);
    }
    if (this.unifFbmScale !== null) {
      gl.uniform1f(this.unifFbmScale, p.detailScale);
    }
    if (this.unifOctaves !== null) {
      gl.uniform1i(this.unifOctaves, p.octaves);
    }
    if (this.unifRoilSpeed !== null) {
      gl.uniform1f(this.unifRoilSpeed, p.roilSpeed);
    }
    if (this.unifPulsePeriod !== null) {
      gl.uniform1f(this.unifPulsePeriod, p.pulsePeriod);
    }
    if (this.unifPulseStrength !== null) {
      gl.uniform1f(this.unifPulseStrength, p.pulseStrength);
    }
    if (this.unifHeat !== null) {
      gl.uniform1f(this.unifHeat, p.heat);
    }
    if (this.unifFlow !== null) {
      gl.uniform1f(this.unifFlow, p.flow);
    }
    if (this.unifBandBlend !== null) {
      gl.uniform1f(this.unifBandBlend, p.bandBlend);
    }
    if (this.unifFlameHeight !== null) {
      gl.uniform1f(this.unifFlameHeight, p.flameHeight);
    }
    if (this.unifTaper !== null) {
      gl.uniform1f(this.unifTaper, p.taper);
    }
    if (this.unifBands !== null) {
      gl.uniform1f(this.unifBands, p.bands);
    }
  }

  // How sharply the comet is turning, per head radius, so the vertex shader can
  // curve the tail along the path. Signed: positive turns counter-clockwise.
  setCurvature(k: number) {
    this.use();
    if (this.unifCurvature !== null) {
      gl.uniform1f(this.unifCurvature, k);
    }
  }

  // The fragment shader's rim glow needs to know where the eye is.
  setCameraPos(pos: vec3) {
    this.use();
    if (this.unifCameraPos !== null) {
      gl.uniform3fv(this.unifCameraPos, pos);
    }
  }

  // Canvas size in pixels. The background uses it for the aspect ratio, so the
  // planet stays circular whatever shape the window is.
  setDimensions(width: number, height: number) {
    this.use();
    if (this.unifDimensions !== null) {
      gl.uniform2f(this.unifDimensions, width, height);
    }
  }

  setBackgroundParams(p: BackgroundParams) {
    this.use();
    if (this.unifHorizon !== null) {
      gl.uniform1f(this.unifHorizon, p.horizon);
    }
    if (this.unifAtmosphere !== null) {
      gl.uniform1f(this.unifAtmosphere, p.atmosphere);
    }
  }

  setBackgroundView(v: BackgroundView) {
    this.use();
    if (this.unifPan !== null) {
      gl.uniform1f(this.unifPan, v.pan);
    }
    if (this.unifZoom !== null) {
      gl.uniform1f(this.unifZoom, v.zoom);
    }
    if (this.unifCloudZoom !== null) {
      gl.uniform1f(this.unifCloudZoom, v.cloudZoom);
    }
    if (this.unifSpin !== null) {
      gl.uniform1f(this.unifSpin, v.spin);
    }
    if (this.unifCloudDrift !== null) {
      gl.uniform1f(this.unifCloudDrift, v.cloudDrift);
    }
    if (this.unifInside !== null) {
      gl.uniform1f(this.unifInside, v.inside);
    }
    if (this.unifScroll !== null) {
      gl.uniform1f(this.unifScroll, v.scroll);
    }
    if (this.unifNight !== null) {
      gl.uniform1f(this.unifNight, v.night);
    }
    if (this.unifFinale !== null) {
      gl.uniform1f(this.unifFinale, v.finale);
    }
    if (this.unifDay !== null) {
      gl.uniform1f(this.unifDay, v.day);
    }
    if (this.unifSkyTurn !== null) {
      gl.uniform1f(this.unifSkyTurn, v.skyTurn);
    }
  }

  draw(d: Drawable) {
    this.use();

    if (this.attrPos != -1 && d.bindPos()) {
      gl.enableVertexAttribArray(this.attrPos);
      gl.vertexAttribPointer(this.attrPos, 4, gl.FLOAT, false, 0, 0);
    }

    if (this.attrNor != -1 && d.bindNor()) {
      gl.enableVertexAttribArray(this.attrNor);
      gl.vertexAttribPointer(this.attrNor, 4, gl.FLOAT, false, 0, 0);
    }

    d.bindIdx();
    gl.drawElements(d.drawMode(), d.elemCount(), gl.UNSIGNED_INT, 0);

    if (this.attrPos != -1) gl.disableVertexAttribArray(this.attrPos);
    if (this.attrNor != -1) gl.disableVertexAttribArray(this.attrNor);
  }
};

export default ShaderProgram;
