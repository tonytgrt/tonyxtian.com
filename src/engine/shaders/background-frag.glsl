#version 300 es

// Procedural background: an Earth-sized sphere filling the lower part of the
// frame, its atmosphere fading up into starfield. Nothing here is textured or
// modelled - the planet is a single circle whose centre sits far below the
// screen, shaded as a sphere and surfaced with noise.
precision highp float;

uniform float u_Time;        // Seconds since start, for star twinkle.
uniform vec2  u_Dimensions;  // Canvas size in pixels, used only for the aspect ratio.
uniform float u_Horizon;     // Screen height at which the limb crosses the centre line.
uniform float u_Atmosphere;  // Thickness of the atmospheric halo, as a fraction of the radius.

// The scroll-driven landing, set from Descent.ts. At the top of the page they
// leave the scene exactly as the standalone project drew it: no pan, both zooms
// 1, no fog, no fade.
uniform float u_Pan;         // 0 at rest, 1 once the camera looks straight at the planet's centre.
uniform float u_Zoom;        // Magnification of the ground, about the middle of the screen.
uniform float u_CloudZoom;   // Magnification of the cloud layer. It is nearer the camera, so it
                             // grows faster than the ground: the parallax that makes the zoom
                             // read as a fall rather than a picture being enlarged.
uniform float u_Spin;        // How far the planet has turned, in radians.
uniform float u_CloudDrift;  // How far the clouds have drifted through their noise.
uniform float u_Inside;      // 0 to 1: from the planet's own ocean to the close view of it.
uniform float u_Scroll;      // How far the page has scrolled, in screen heights.
uniform float u_Night;       // 0 to 1: night falling at the end of the page, as the last content leaves.
uniform float u_Finale;      // 0 to 1: then the camera looking up from the sea to the horizon.

in vec2 fs_Pos;

out vec4 out_Col;

// ---------------------------------------------------------------------------
// Scene constants
// ---------------------------------------------------------------------------

// Far larger than the screen, which is the whole trick: only a shallow arc of
// the circle is ever visible, so it reads as the limb of something enormous
// rather than as a ball sitting in frame.
const float EARTH_RADIUS = 3.2;

// A perfectly level horizon reads as a flat backdrop. A few degrees of tilt is
// what makes it read as a planet seen from orbit.
const float TILT = -0.17;

// Off the top-right corner, matching the glow drawn at the same place below.
const vec3 SUN_DIR = normalize(vec3(0.55, 0.62, 0.56));

const vec3 SPACE         = vec3(0.004, 0.006, 0.014);
const vec3 OCEAN_DEEP    = vec3(0.008, 0.028, 0.098);
const vec3 OCEAN_SHALLOW = vec3(0.034, 0.125, 0.305);
const vec3 LAND          = vec3(0.115, 0.120, 0.105);
const vec3 CLOUD         = vec3(0.920, 0.940, 0.970);
const vec3 SKY           = vec3(0.350, 0.620, 1.000); // atmospheric scattering tint

// The stars and the sun are far beyond the planet, so while the camera pans
// they slide by at only this fraction of its speed.
const float SKY_PARALLAX = 0.2;

// Zooming in adds octaves of noise so the surface keeps its detail; this caps
// how many, since by the deepest zoom the fog covers everything anyway.
const int MAX_OCTAVES = 11;

// ---------------------------------------------------------------------------
// Noise. GLSL has no include mechanism, so this is the same value-noise
// construction the other two shaders use, with a 2D hash added for the stars.
// ---------------------------------------------------------------------------

float hash31(vec3 p)
{
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.x + p.y) * p.z);
}

float hash21(vec2 p)
{
    vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
}

float valueNoise(vec3 p)
{
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);

    float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

    return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
               mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
               u.z);
}

// The octave count is fractional: the last octave fades in by its fraction, so
// detail grows smoothly with the zoom instead of popping in an octave at a time.
float fbm(vec3 p, float octaves)
{
    float sum = 0.0, amp = 0.5, freq = 1.0, norm = 0.0;
    for (int i = 0; i < MAX_OCTAVES; ++i)
    {
        float weight = clamp(octaves - float(i), 0.0, 1.0);
        if (weight <= 0.0) break;
        sum  += weight * amp * valueNoise(p * freq + float(i) * 17.3);
        norm += weight * amp;
        amp  *= 0.5;
        freq *= 2.0;
    }
    return sum / norm;
}

vec2 rotate2(vec2 v, float a)
{
    float c = cos(a), s = sin(a);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

// The point on the planet under a scene position, as a unit normal: the sphere
// reconstructed from the disc coordinate, then turned about the pole by the
// planet's spin. `toward` is measured from the planet's centre.
vec3 surfacePoint(vec2 toward)
{
    vec2  uv = toward / EARTH_RADIUS;
    float z  = sqrt(max(0.0, 1.0 - min(1.0, dot(uv, uv))));
    vec3  n  = vec3(uv, z);
    float ca = cos(u_Spin), sa = sin(u_Spin);
    return vec3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca);
}

// One star per grid cell at most, placed at a hashed position inside it. Most
// cells are left empty, which is what keeps the field sparse and irregular
// rather than looking like a dot screen.
float starField(vec2 p)
{
    vec2  cell = floor(p);
    vec2  f    = fract(p);
    float h    = hash21(cell);

    if (h < 0.90) {
        return 0.0;
    }

    vec2  pos = vec2(hash21(cell + 11.3), hash21(cell + 27.7));
    float mag = (h - 0.90) / 0.10;

    // Slow, per-star-offset twinkle.
    float twinkle = 0.7 + 0.3 * sin(u_Time * 1.7 + h * 63.0);

    return mag * twinkle * smoothstep(0.07, 0.0, length(f - pos));
}

// The landing: space, the planet, and the fall into its clouds. `screen` is
// the aspect-corrected screen position.
vec3 landing(vec2 screen)
{
    // The scene is tilted so the limb runs diagonally across the frame, which
    // puts the planet's centre below and a little to the right of the screen.
    // The camera pans toward that point, then zooms in about the middle.
    vec2 center = vec2(0.0, u_Horizon - EARTH_RADIUS);
    vec2 look   = rotate2(center, -TILT) * u_Pan;
    vec2 p      = look + screen / u_Zoom;
    vec2 q      = rotate2(p, TILT);

    vec2  toward = q - center;
    float dist   = length(toward);
    float t      = dist / EARTH_RADIUS;   // exactly 1.0 on the limb

    // ---- space ------------------------------------------------------------
    // Too far away to zoom, and panning past at a fraction of the speed.
    vec2 sky   = screen + look * SKY_PARALLAX;
    vec3 color = SPACE;
    color += vec3(1.0, 0.97, 0.93) * starField(rotate2(sky, TILT) * 28.0);

    // A distant sun just off the top-right corner. It is the same direction
    // that lights the planet, so the whole frame agrees on where the light is.
    float sunDist = length(sky - vec2(1.35, 0.78));
    color += vec3(1.0, 0.95, 0.88) * 0.16 / (1.0 + 26.0 * sunDist * sunDist);

    // ---- atmosphere -------------------------------------------------------
    // Outside the disc the air thins exponentially into vacuum. This is the
    // band that blends the planet into the black at the top of the frame.
    float halo = clamp(exp(-(dist - EARTH_RADIUS)
                           / max(0.001, u_Atmosphere * EARTH_RADIUS)), 0.0, 1.0);

    // Only the sunlit side of the limb scatters, so the halo fades out around
    // the unlit edge instead of ringing the planet evenly.
    vec2  limbDir   = toward / max(1e-4, dist);
    float haloLight = smoothstep(-0.45, 0.90, dot(vec3(limbDir, 0.0), SUN_DIR));

    color += SKY * halo * haloLight * 0.9;

    // ---- planet surface ---------------------------------------------------
    // Reconstruct the sphere's normal from the disc coordinate, which is what
    // lets the surface be shaded and textured as a sphere rather than a circle.
    vec2  uv = toward / EARTH_RADIUS;
    float z  = sqrt(max(0.0, 1.0 - min(1.0, dot(uv, uv))));
    vec3  n  = vec3(uv, z);

    // The lookup turns slowly about the pole so the planet rotates under us.
    vec3 sp = surfacePoint(toward);

    // Every doubling of the zoom gets another octave, so the coastlines keep
    // their detail all the way down. The sea also rises as the camera falls,
    // so whatever the planet has turned under the middle of the screen, the
    // camera comes down over open water, deepening toward the sea it lands on.
    float continents = fbm(sp * 1.8, 4.0 + log2(u_Zoom));
    float seaLevel   = 0.3 * smoothstep(1.5, 4.0, log2(u_Zoom));
    vec3  surface    = mix(OCEAN_DEEP, OCEAN_SHALLOW,
                           smoothstep(0.30 + seaLevel, 0.56 + seaLevel, continents));
    surface = mix(surface, LAND, smoothstep(0.54 + seaLevel, 0.62 + seaLevel, continents));

    // Clouds are a second, finer field drifting at its own rate, so they slide
    // over the continents instead of being locked to them. Two layers at
    // different scales keep the banks from reading as one blurry blob. They
    // sit nearer the camera than the ground, so they are looked up through
    // their own, faster zoom.
    //
    // Nearing the deck, the clouds swell out past the edges of the screen and
    // thin away as they go, so the camera drops through them into clear air
    // rather than into a wall of white. Measured in doublings of the cloud
    // zoom, which is how the approach to the deck feels; once they are gone
    // they cost nothing.
    float passing = 1.0 - smoothstep(3.0, 6.0, log2(u_CloudZoom));
    if (passing > 0.0) {
        vec2  cloudToward = rotate2(look + screen / u_CloudZoom, TILT) - center;
        vec3  cloudPos    = surfacePoint(cloudToward) * 6.5 + vec3(0.0, 0.0, u_CloudDrift);
        float cloudDetail = log2(u_CloudZoom);
        float clouds      = fbm(cloudPos, 5.0 + cloudDetail) * 0.72
                          + fbm(cloudPos * 2.7, 4.0 + cloudDetail) * 0.28;
        surface = mix(surface, CLOUD, smoothstep(0.47, 0.66, clouds) * 0.88 * passing);
    }

    // Wrapped diffuse. A hard terminator would put half the disc in shadow; the
    // reference is lit from over the shoulder with the night side out of frame.
    // Kept deliberately below 1.0 at the top end: the planet is a backdrop, and
    // a brighter one would swallow the white-hot base of the flame in front.
    float light = smoothstep(-0.35, 0.85, dot(n, SUN_DIR));
    surface *= mix(0.04, 0.92, light);

    // Along the limb the line of sight passes through far more air than it does
    // looking straight down, so the last sliver of the disc washes out to blue.
    surface = mix(surface, SKY * 1.3, smoothstep(0.88, 1.0, t) * 0.8 * light);

    // Falling into the atmosphere puts more and more air between the camera and
    // the ground, so the view hazes over a little on the way down. Kept dark,
    // to meet the deep blue of the sea it hands over to.
    float haze = clamp(log2(u_Zoom) / 4.0, 0.0, 1.0);
    surface = mix(surface, SKY * 0.4, haze * 0.25);

    // ---- composite --------------------------------------------------------
    // fwidth gives the edge a one-pixel blend at any resolution, so the limb
    // does not alias into a staircase.
    float aa   = max(fwidth(t) * 1.5, 1e-5);
    float disc = smoothstep(1.0 + aa, 1.0 - aa, t);

    color = mix(color, surface, disc);

    return color;
}

// ---------------------------------------------------------------------------
// The ocean: where the fall comes out below the clouds, and the backdrop to
// the content page from then on. The camera breaks out of the cloud base
// looking almost straight down, as it has all the way from space, and stays
// that way, gliding on over the sea, and further as the page scrolls. At the
// end of the page it looks up to the horizon as night falls.
//
// The wave model and the water's shading are adapted from afl_ext's "Very
// fast procedural ocean" shader, under the MIT License:
//
//   Copyright (c) 2017-2024 afl_ext
//
//   Permission is hereby granted, free of charge, to any person obtaining a
//   copy of this software and associated documentation files (the
//   "Software"), to deal in the Software without restriction, including
//   without limitation the rights to use, copy, modify, merge, publish,
//   distribute, sublicense, and/or sell copies of the Software, and to permit
//   persons to whom the Software is furnished to do so, subject to the
//   following conditions:
//
//   The above copyright notice and this permission notice shall be included
//   in all copies or substantial portions of the Software.
//
//   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
//   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
//   NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
//   DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
//   OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
//   USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// Changed from the original to run behind a page all the time: there is no
// raymarch, the view ray meets the water's top plane directly, and the slope
// is summed alongside the height instead of differenced from three more
// evaluations of it. That is 24 wave evaluations a pixel rather than hundreds.
// ---------------------------------------------------------------------------

const float WATER_DEPTH     = 1.0;   // from the crests down to the troughs
const float DRAG_MULT       = 0.38;  // how far each wave drags the water along for the next
const int   WAVE_ITERATIONS = 24;
const float SEA_PITCH       = 1.40;  // how far below the horizon the camera looks, radians:
                                     // just short of straight down, so the top of the view
                                     // reaches a little way out, toward brighter sky
const float SEA_SCROLL      = 3.0;   // how far the camera flies on per screen of scrolling
const float SEA_DRIFT       = 0.05;  // how fast it glides on by itself
const float SEA_RADIUS      = 4000.0; // the planet's, which curves the horizon: from the
                                      // finale's height it dips about 4 degrees below level
const float WAVE_SPEED      = 0.35;  // the waves' pace against the original's: a calm sea
const float OCEAN_EXPOSURE  = 1.1;   // kept low, to stay within the site's dark palette

// Low, and far enough off to the right that its path of glitter on the water
// runs down the edge of the screen rather than behind the page's text.
const vec3 OCEAN_SUN = normalize(vec3(1.2, 0.2, 1.0));

// The water's height at `position`, from 0 in the troughs to 1 on the crests,
// and its slope: (height, d/dx, d/dz). Waves of rising frequency in
// well-spread directions, each sharpened to a peaked crest by exp(sin - 1),
// and each dragging the point along for the next, which bunches the crests
// together the way real ones are. The slope is the sum of each wave's own,
// leaving out how the drag moves the point, which shows nowhere.
vec3 waves(vec2 position)
{
    float phaseShift = length(position) * 0.1;
    float iter = 0.0, frequency = 1.0, timeMultiplier = 2.0, weight = 1.0;
    float height = 0.0, weights = 0.0;
    vec2  slope  = vec2(0.0);
    for (int i = 0; i < WAVE_ITERATIONS; ++i)
    {
        vec2  dir  = vec2(sin(iter), cos(iter));
        float x    = dot(dir, position) * frequency + u_Time * WAVE_SPEED * timeMultiplier + phaseShift;
        float wave = exp(sin(x) - 1.0);
        float dx   = wave * cos(x);

        position -= dir * dx * weight * DRAG_MULT;
        height   += wave * weight;
        slope    += dir * dx * frequency * weight;
        weights  += weight;

        weight          = mix(weight, 0.0, 0.2);
        frequency      *= 1.18;
        timeMultiplier *= 1.07;
        iter           += 1232.399963;
    }
    return vec3(height, slope) / weights;
}

// A very cheap sky: blue overhead, paling toward the horizon, with a glow
// round the sun.
vec3 daySky(vec3 dir)
{
    vec3  zenith   = vec3(5.5, 13.0, 22.4) / 22.4;
    float thick    = 1.0 / (dir.y + 0.1);
    float lowSun   = 1.0 / (OCEAN_SUN.y * 11.0 + 1.0);
    float around   = pow(abs(dot(OCEAN_SUN, dir)), 2.0);
    vec3  sunColor = mix(vec3(1.0), max(vec3(0.0), vec3(1.0) - zenith), lowSun);
    vec3  sky      = max(vec3(0.0), zenith * sunColor
                         - vec3(5.5, 13.0, 22.4) * 0.002 * (thick - 6.0 * OCEAN_SUN.y * OCEAN_SUN.y));
    sky *= thick * (0.24 + around * 0.24);
    return sky * (1.0 + pow(1.0 - dir.y, 3.0)) * 0.5;
}

// The moon the page ends under. It rises where the low sun was, so the light
// on the water stays on the same side it has been on all along, drawn in a
// little so the whole disc fits on a widescreen.
const vec3  MOON_DIR        = normalize(vec3(1.0, 0.2, 1.0));
const float MOON_RADIUS     = 0.04;  // radians: far larger than the real one, to be seen
const float MOON_BRIGHTNESS = 2.0;
const vec3  MOON_COLOR      = vec3(1.0, 0.96, 0.88);

// Where the sunlight falls on the moon from, in the screen's terms: from a
// little to the left of the viewer, so it hangs just past full.
const vec3  MOON_LIT        = normalize(vec3(-0.5, 0.25, 0.83));

// The light's glitter on the water. Behind the content it is the low sun's:
// a broad lobe that the waves break up into a wide spread of glints. At the
// end of the page it is the moon's own disc, mirrored only in the wave faces
// that happen to catch it, which lays the narrow path of light across the sea
// that a real moon does.
const float SUN_GLINT    = 210.0;
const float MOON_REFLECT = 5.0;

// Where the light on the water comes from: the low sun behind the content,
// moving to the moon as night falls.
vec3 lightDir()
{
    return normalize(mix(OCEAN_SUN, MOON_DIR, u_Night));
}

float glint(vec3 dir, vec3 light)
{
    float toward = dot(dir, light);
    float sun    = pow(max(0.0, toward), 720.0) * SUN_GLINT;
    float moon   = smoothstep(1.1, 0.8, acos(clamp(toward, -1.0, 1.0)) / MOON_RADIUS) * MOON_REFLECT;
    return mix(sun, moon, u_Night);
}

// The night sky the page ends under: deep blue overhead, the last of the dusk
// lingering along the horizon, stars, dark clouds drifting across them, and
// the moon, with a halo that lights the sky round it and the clouds passing
// near it. `direct` is off for its reflection in the water, which leaves out
// the stars: the waves would only break them into glitter. The moon's face is
// drawn apart, on the screen (see moonFace), and so is its glint on the water
// (see glint).
const vec3 NIGHT_ZENITH  = vec3(0.002, 0.004, 0.012);
const vec3 NIGHT_HORIZON = vec3(0.030, 0.045, 0.085);
const vec3 NIGHT_CLOUD   = vec3(0.030, 0.040, 0.070);

vec3 nightSky(vec3 dir, bool direct, vec3 light)
{
    float up    = max(dir.y, 0.0);
    vec3  color = mix(NIGHT_HORIZON, NIGHT_ZENITH, smoothstep(0.0, 0.35, up));

    // Fewer and fainter low down, through more air.
    if (direct) {
        vec2 q = vec2(atan(dir.x, dir.z), up) * 45.0;
        color += vec3(1.0, 0.97, 0.93) * starField(q) * 3.0 * smoothstep(0.03, 0.2, up);
    }

    // How far from the moon, in its own radii.
    float r = acos(clamp(dot(dir, light), -1.0, 1.0)) / MOON_RADIUS;

    // A layer of cloud overhead, seen in perspective: broad near the top of
    // the view, and thinning into the haze toward the horizon. Those near the
    // moon catch its light.
    vec2  cp    = dir.xz / max(up, 0.02) * 0.3 + vec2(u_Time * 0.004, 0.0);
    float cover = smoothstep(0.56, 0.8, fbm(vec3(cp, 4.2), 4.0)) * smoothstep(0.02, 0.15, up);
    vec3  cloud = NIGHT_CLOUD + MOON_COLOR * 0.12 * exp(-r * 0.12);
    color = mix(color, cloud, cover * 0.85);

    // The halo: a tight glow round the disc and a wide, faint one beyond it.
    color += MOON_COLOR * (0.05 * exp(-r * 0.3) + 0.012 * exp(-r * 0.05));
    return color;
}

// The moon's face, where it falls on the screen for a camera pitched down by
// `pitch`, shaded as the sphere it is. Drawn round on the screen itself, since
// a disc of sky this far off to the side comes out stretched by the
// perspective.
vec3 moonFace(vec2 screen, vec3 light, float pitch)
{
    // The light's direction as the camera sees it: the view's pitch undone.
    float cp = cos(pitch), sp = sin(pitch);
    vec3  v  = vec3(light.x, light.y * cp + light.z * sp, -light.y * sp + light.z * cp);
    if (v.z <= 0.0) {
        return vec3(0.0);
    }

    vec2  uv   = (screen - v.xy / v.z * 1.5) / (MOON_RADIUS * 1.5);
    float r2   = dot(uv, uv);
    float disc = smoothstep(1.0, 0.96, sqrt(r2));
    if (disc <= 0.0) {
        return vec3(0.0);
    }

    // The point of the sphere under this pixel, which is also its normal.
    vec3 n = vec3(uv, sqrt(max(0.0, 1.0 - r2)));

    // Its dark seas, and a finer grain of craters, laid on the sphere rather
    // than on the flat disc, so they crowd together toward the rim as the
    // surface curves away.
    float seas   = smoothstep(0.45, 0.7, fbm(n * 1.8 + 3.1, 5.0));
    float grain  = fbm(n * 6.0 + 1.7, 3.0);
    float albedo = mix(1.0, 0.5, seas) * mix(0.8, 1.1, grain);

    // Lit from off to the left, which leaves a soft terminator down its right
    // side with only faint earthshine beyond it, and darkened toward the rim
    // all round, where the face turns away. Between them they give it its form.
    float lit   = smoothstep(-0.15, 0.55, dot(n, MOON_LIT));
    float rim   = mix(0.45, 1.0, pow(n.z, 0.6));
    float shade = mix(0.03, 1.0, lit) * rim;

    return MOON_COLOR * MOON_BRIGHTNESS * albedo * shade * disc;
}

// The sky over the sea: the day's behind the content, the night's at the end
// of the page, and each only worked out while it shows.
vec3 sky(vec3 dir, bool direct, vec3 light)
{
    vec3 color = vec3(0.0);
    if (u_Night < 1.0) {
        color = daySky(dir);
    }
    if (u_Night > 0.0) {
        color = mix(color, nightSky(dir, direct, light), u_Night);
    }
    return color;
}

// Filmic tone mapping (ACES), from linear light to the screen.
vec3 acesTonemap(vec3 color)
{
    mat3 m1 = mat3(0.59719, 0.07600, 0.02840,
                   0.35458, 0.90834, 0.13383,
                   0.04823, 0.01566, 0.83777);
    mat3 m2 = mat3( 1.60475, -0.10208, -0.00327,
                   -0.53108,  1.10813, -0.07276,
                   -0.07367, -0.00605,  1.07602);
    vec3 v = m1 * color;
    vec3 a = v * (v + 0.0245786) - 0.000090537;
    vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
    return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
}

vec3 ocean(vec2 screen)
{
    // High as the camera breaks out of the clouds, and falling as it clears
    // them; lower still at the end of the page, looking out over the water.
    float height = mix(mix(40.0, 12.0, u_Inside), 3.0, u_Finale);

    // How far the horizon dips below level from this height, over a sea that
    // curves away with the planet.
    float dip = acos(SEA_RADIUS / (SEA_RADIUS + height));

    // Almost straight down behind the content. At the end of the page, down by
    // just the horizon's dip, so the top of its curve lies across the middle
    // of the screen and it falls away toward the edges.
    float pitch = mix(SEA_PITCH, dip, u_Finale);

    // The view ray, with the top of the screen toward the horizon.
    vec3  ray = normalize(vec3(screen, 1.5));
    float cp = cos(pitch), sp = sin(pitch);
    ray = vec3(ray.x, ray.y * cp - ray.z * sp, ray.y * sp + ray.z * cp);

    // The sun's own disc is never looked at: it only ever shows on the water.
    // By the time the sky comes into view, it is the moon's.
    vec3 light = lightDir();

    // Where the ray meets the sea: a sphere the planet's size with its top
    // under the camera. Looking down behind the content the patch in view is
    // too small for the curve to show; looking out at the end of the page it
    // is what bends the horizon. Rays that pass over it see the sky.
    float b    = (SEA_RADIUS + height) * ray.y;
    float disc = b * b - height * (height + 2.0 * SEA_RADIUS);
    //
    // Just above the curved horizon the rays still point a little below level;
    // the sky is looked up level with it there, the horizon's own colour.
    if (ray.y >= 0.0 || disc < 0.0) {
        vec3 skyRay = normalize(vec3(ray.x, max(ray.y, 0.0), ray.z));
        vec3 color  = sky(skyRay, true, light) + moonFace(screen, light, pitch) * u_Night;
        return acesTonemap(color * OCEAN_EXPOSURE);
    }

    vec3  origin = vec3(0.0, height, u_Time * SEA_DRIFT + u_Scroll * SEA_SCROLL);
    float dist   = -b - sqrt(disc);
    vec3  hit    = origin + ray * dist;

    // The sea's own up where the ray lands, tipped away from the camera's by
    // the curve, which the waves' normal is laid onto.
    vec3 up = normalize(vec3(hit.x - origin.x, hit.y + SEA_RADIUS, hit.z - origin.z));

    vec3 w = waves(hit.xz);
    vec3 n = normalize(vec3(-w.y * WATER_DEPTH, 1.0, -w.z * WATER_DEPTH) + up - vec3(0.0, 1.0, 0.0));

    // Flattened with distance, so the far water doesn't fizz with detail finer
    // than its pixels.
    n = normalize(mix(n, up, 0.8 * min(1.0, sqrt(dist * 0.01) * 1.1)));

    float fresnel = 0.04 + 0.96 * pow(1.0 - max(0.0, dot(-n, ray)), 5.0);
    vec3  r = reflect(ray, n);
    r.y = abs(r.y);

    // The sky and sun reflected off the surface: little of it this close to
    // straight down, more toward the edges of the view, where the water is
    // seen more obliquely and mirrors the brighter sky nearer the horizon.
    vec3 reflection = sky(r, false, light) + glint(r, light);

    // And light scattered back up through the water, which is what lights the
    // middle of the view, where there is next to nothing to reflect. More of
    // it comes through the crests, and off the faces turned toward the low
    // sun, so the middle shows the waves' relief rather than a flat wash.
    float sunward    = max(dot(n, OCEAN_SUN), 0.0);
    vec3  scattering = vec3(0.0293, 0.0698, 0.1717) * 0.3 * (0.2 + w.x) * (1.0 + 2.0 * sunward);

    return acesTonemap((fresnel * reflection + scattering) * OCEAN_EXPOSURE);
}

void main()
{
    // Aspect-correct screen coordinates: y stays in [-1, 1] and x widens with
    // the canvas, so the planet stays circular at any window shape.
    vec2 screen = fs_Pos;
    screen.x *= u_Dimensions.x / max(1.0, u_Dimensions.y);

    // Each scene is only worked out while it can be seen, so the content page
    // pays for its ocean alone and the landing for nothing extra.
    vec3 color = vec3(0.0);
    if (u_Inside < 1.0) {
        color = landing(screen);
    }
    if (u_Inside > 0.0) {
        // Below the clouds, the close view of the water fades up over the
        // planet's own ocean, the two the same deep blue.
        color = mix(color, ocean(screen), u_Inside);
    }

    out_Col = vec4(color, 1.0);
}
