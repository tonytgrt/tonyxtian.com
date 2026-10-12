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

// The landing, set from Descent.ts. Before it starts they leave the scene
// exactly as the standalone project drew it: no pan, both zooms 1, no fog, no
// fade.
uniform float u_Pan;         // 0 at rest, 1 once the camera looks straight at the planet's centre.
uniform float u_Zoom;        // Magnification of the ground, about the middle of the screen.
uniform float u_CloudZoom;   // Magnification of the cloud layer. It is nearer the camera, so it
                             // grows faster than the ground: the parallax that makes the zoom
                             // read as a fall rather than a picture being enlarged.
uniform float u_Spin;        // How far the planet has turned, in radians.
uniform float u_CloudDrift;  // How far the clouds have drifted through their noise.
uniform float u_Inside;      // 0 to 1: from the planet's own ocean to the close view of it.
uniform float u_Scroll;      // How far the camera has travelled between entries, in screens.
uniform float u_Night;       // 0 to 1: night falling over the last stop, Contact.
uniform float u_Finale;      // 0 to 1: then the camera looking up from the sea to the horizon.
uniform float u_Day;         // 0 to 1: from the dark theme's night to the light theme's day.
                             // In between, the wheel of sky is turning (see wheel).
uniform float u_SkyTurn;     // How far the wheel of sky has turned, in radians: -PI per switch.

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

const float PI = 3.14159265;

// How far toward the light theme's day the sea and sky have come: they
// brighten through the middle of a switch, while the wheel is mid-turn.
float dayTone()
{
    return smoothstep(0.1, 0.9, u_Day);
}

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
    surface = mix(surface, SKY * mix(0.4, 0.9, dayTone()), haze * mix(0.25, 0.45, dayTone()));

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
// the site from then on. The camera breaks out of the cloud base looking
// almost straight down, as it has all the way from space, and stays that way,
// gliding on over the sea, and further with each step between entries. At the
// last stop, Contact, it looks up to the horizon as night falls.
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
const float SEA_SCROLL      = 3.0;   // how far the camera flies on per screen of travel
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

// The light theme's sun, at Contact where the moon is by night: a white-hot
// disc a little smaller than the moon, in a glare that lights the sky round
// it, and white clouds.
const float SUN_RADIUS      = 0.032;
const float SUN_BRIGHTNESS  = 6.0;
const vec3  SUN_COLOR       = vec3(1.0, 0.95, 0.86);
const vec3  DAY_CLOUD       = vec3(0.40, 0.43, 0.48);

// The light theme's sea: brighter and paler than the dark theme's, a sunlit
// blue that dark type reads on.
const float DAY_EXPOSURE    = 3.0;
const vec3  DAY_SCATTER     = vec3(0.020, 0.090, 0.150);
const float DAY_SHEEN       = 0.12;

// A very cheap sky: blue overhead, paling toward the horizon, with a glow
// round the sun. By day, looked at directly, a layer of white cloud drifts
// across it.
vec3 daySky(vec3 dir, vec3 sun, bool direct)
{
    vec3  zenith   = vec3(5.5, 13.0, 22.4) / 22.4;
    float thick    = 1.0 / (dir.y + 0.1);
    float lowSun   = 1.0 / (max(sun.y, 0.0) * 11.0 + 1.0);
    float around   = pow(abs(dot(sun, dir)), 2.0);
    vec3  sunColor = mix(vec3(1.0), max(vec3(0.0), vec3(1.0) - zenith), lowSun);
    vec3  sky      = max(vec3(0.0), zenith * sunColor
                         - vec3(5.5, 13.0, 22.4) * 0.002 * (thick - 6.0 * sun.y * sun.y));
    sky *= thick * (0.24 + around * 0.24);
    sky *= (1.0 + pow(1.0 - dir.y, 3.0)) * 0.5;

    if (direct && u_Day > 0.0) {
        // Clear blue deepening overhead, as a real day sky does.
        float up = max(dir.y, 0.0);
        sky = mix(sky, sky * vec3(0.45, 0.72, 1.1), smoothstep(0.04, 0.5, up) * u_Day);

        vec2  cp    = dir.xz / max(up, 0.02) * 0.3 + vec2(u_Time * 0.004, 0.0);
        float cover = smoothstep(0.6, 0.86, fbm(vec3(cp, 4.2), 4.0)) * smoothstep(0.02, 0.15, up);
        vec3  cloud = DAY_CLOUD * (1.0 + 0.8 * pow(max(dot(dir, sun), 0.0), 6.0));
        sky = mix(sky, cloud, cover * 0.6 * u_Day);
    }
    return sky;
}

// The moon the page ends under. It rises where the low sun was, so the light
// on the water stays on the same side it has been on all along.
const float MOON_RADIUS     = 0.04;  // radians: far larger than the real one, to be seen

// Where the moon hangs at Contact, and the sun by day: low on the right, as
// far out as the screen allows. On a widescreen that is near the right-hand
// edge, drawn in a little so the whole disc fits, with its path of light down
// that side, clear of the page's text. A narrow screen shows far less to
// either side, so there it comes in toward the middle: on a phone, a little
// right of centre, where the whole of the wheel's turn stays in view.
vec3 moonHome()
{
    float aspect = u_Dimensions.x / max(1.0, u_Dimensions.y);
    float across = min(1.5, aspect * mix(0.55, 0.84, smoothstep(0.7, 1.5, aspect)));
    return normalize(vec3(across / 1.5, 0.2, 1.0));
}
const float MOON_BRIGHTNESS = 2.0;
const vec3  MOON_COLOR      = vec3(1.0, 0.96, 0.88);

// Where the sunlight falls on the moon from, in the screen's terms: from a
// little to the left of the viewer, so it hangs just past full.
const vec3  MOON_LIT        = normalize(vec3(-0.5, 0.25, 0.83));

// The light's glitter on the water. Behind the content it is the low sun's:
// a broad lobe that the waves break up into a wide spread of glints. At the
// end of the page it is the moon's own disc, mirrored only in the wave faces
// that happen to catch it, which lays the narrow path of light across the sea
// that a real moon does. By day it is the sun's lobe again, wherever the sun is.
const float SUN_GLINT    = 210.0;
const float MOON_REFLECT = 5.0;

// The sun and the moon ride opposite ends of one wheel of sky, turning about
// the view's forward axis, which at Contact points at the middle of the
// horizon. By night the moon hangs at moonHome() and the sun is down below the
// opposite horizon. Switching to day turns the wheel half round, clockwise:
// the moon sets on the right as the sun comes up on the left, climbs out over
// the top of the view and comes down into the moon's place. It only ever
// turns that way: back to night is the second half of the turn, the sun
// setting on the right as the moon comes up on the left and over the top.
vec3 wheel(vec3 dir)
{
    float a = u_SkyTurn;
    float c = cos(a), s = sin(a);
    return vec3(dir.x * c - dir.y * s, dir.x * s + dir.y * c, dir.z);
}

vec3 moonDir()
{
    return wheel(moonHome());
}

// Behind the content the sun is the low one off to the right, in either
// theme; out at the horizon by day it is the wheel's. The wheel's only takes
// over once a switch has begun, so the dark theme's sea is lit just as before.
vec3 sunDir()
{
    vec3 home     = moonHome();
    vec3 wheelSun = wheel(vec3(-home.xy, home.z));
    return normalize(mix(OCEAN_SUN, wheelSun, u_Finale * smoothstep(0.0, 0.05, u_Day)));
}

// How much of the sky is night's: the nightfall over Contact, lifted by day.
// It goes as the moon sets and the sun comes up, early in the turn to day, and
// comes back as late in the turn back to night, as the moon comes up again.
float nightAmount()
{
    return u_Night * (1.0 - smoothstep(0.04, 0.35, u_Day));
}

// A body below the horizon lights nothing on the water.
float risen(vec3 dir)
{
    return smoothstep(-0.03, 0.03, dir.y);
}

float glint(vec3 dir, vec3 sun, vec3 moon, float night)
{
    float toward = dot(dir, sun);
    float sunGlint  = pow(max(0.0, toward), 720.0) * SUN_GLINT * risen(sun);
    float moonGlint = smoothstep(1.1, 0.8, acos(clamp(dot(dir, moon), -1.0, 1.0)) / MOON_RADIUS)
                    * MOON_REFLECT * risen(moon);
    return mix(sunGlint, moonGlint, night);
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

// Where a direction in the world falls on the screen, for a camera pitched
// down by `pitch`: x and y on the screen, and z, which is negative behind it.
vec3 onScreen(vec3 dir, float pitch)
{
    float cp = cos(pitch), sp = sin(pitch);
    vec3  v  = vec3(dir.x, dir.y * cp + dir.z * sp, -dir.y * sp + dir.z * cp);
    return vec3(v.xy / max(v.z, 1e-4) * 1.5, v.z);
}

// The moon's face, where it falls on the screen for a camera pitched down by
// `pitch`, shaded as the sphere it is. Drawn round on the screen itself, since
// a disc of sky this far off to the side comes out stretched by the
// perspective.
vec3 moonFace(vec2 screen, vec3 light, float pitch)
{
    vec3 v = onScreen(light, pitch);
    if (v.z <= 0.0) {
        return vec3(0.0);
    }

    vec2  uv   = (screen - v.xy) / (MOON_RADIUS * 1.5);
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

// The sun's disc and its glare, drawn on the screen as the moon's face is.
// The glare reaches past the horizon, so the sky brightens a little before
// the sun is up and after it has set.
vec3 sunFace(vec2 screen, vec3 sun, float pitch)
{
    vec3 v = onScreen(sun, pitch);
    if (v.z <= 0.0) {
        return vec3(0.0);
    }
    float r     = length(screen - v.xy) / (SUN_RADIUS * 1.5);
    float disc  = smoothstep(1.0, 0.92, r);
    float glare = 0.9 * exp(-r * 0.6) + 0.18 * exp(-r * 0.09);
    return SUN_COLOR * (disc * SUN_BRIGHTNESS + glare);
}

// The sky over the sea: the day's behind the content, the night's at the end
// of the page, and each only worked out while it shows.
vec3 sky(vec3 dir, bool direct, vec3 sun, vec3 moon, float night)
{
    vec3 color = vec3(0.0);
    if (night < 1.0) {
        color = daySky(dir, sun, direct);
    }
    if (night > 0.0) {
        color = mix(color, nightSky(dir, direct, moon), night);
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

    // The lights, wherever the wheel of sky has them: the sun, and the moon by
    // night. Behind the content the sun shows only on the water; out at the
    // horizon it is the moon by night and the sun's own disc by day.
    vec3  sun      = sunDir();
    vec3  moon     = moonDir();
    float night    = nightAmount();
    float exposure = mix(OCEAN_EXPOSURE, DAY_EXPOSURE, dayTone());

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
        vec3 color  = sky(skyRay, true, sun, moon, night)
                    + moonFace(screen, moon, pitch) * night
                    + sunFace(screen, sun, pitch) * (1.0 - night);
        return acesTonemap(color * exposure);
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

    // By day a little more of the sky's light comes off the water everywhere,
    // a sheen that pales the sea.
    float f0      = mix(0.04, DAY_SHEEN, dayTone());
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - max(0.0, dot(-n, ray)), 5.0);
    vec3  r = reflect(ray, n);
    r.y = abs(r.y);

    // The sky and sun reflected off the surface: little of it this close to
    // straight down, more toward the edges of the view, where the water is
    // seen more obliquely and mirrors the brighter sky nearer the horizon.
    vec3 reflection = sky(r, false, sun, moon, night) + glint(r, sun, moon, night);

    // And light scattered back up through the water, which is what lights the
    // middle of the view, where there is next to nothing to reflect. More of
    // it comes through the crests, and off the faces turned toward the low
    // sun, so the middle shows the waves' relief rather than a flat wash.
    float sunward    = max(dot(n, OCEAN_SUN), 0.0);
    vec3  deep       = mix(vec3(0.0293, 0.0698, 0.1717) * 0.3, DAY_SCATTER, dayTone());
    vec3  scattering = deep * (0.2 + w.x) * (1.0 + 2.0 * sunward);

    return acesTonemap((fresnel * reflection + scattering) * exposure);
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
