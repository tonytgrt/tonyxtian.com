#version 300 es

// This is a fragment shader. If you've opened this file first, please
// open and read lambert.vert.glsl before reading on.
// Unlike the vertex shader, the fragment shader actually does compute
// the shading of geometry. For every pixel in your program's output
// screen, the fragment shader is run for every bit of geometry that
// particular pixel overlaps. By implicitly interpolating the position
// data passed into the fragment shader by the vertex shader, the fragment shader
// can compute what color to apply to its pixel based on things like vertex
// position, light position, and vertex color.
precision highp float;

uniform vec4 u_Color;      // The color with which to render this instance of geometry.
                           // Here it tints the whole gradient, so a neutral white
                           // leaves the palette exactly as authored.

uniform float u_Time;      // Seconds elapsed since the program started. Same clock the
                           // vertex shader displaces with, so color and geometry stay in step.

uniform vec3 u_CameraPos;  // World-space eye position, for the grazing-angle rim glow.

uniform float u_Heat;      // 0.5 leaves the gradient alone; higher pushes more of the
                           // surface toward the hot end, lower cools it down.

uniform float u_Flow;      // How strongly the flowing noise warps the color gradient.

uniform float u_Bands;     // Number of quantized color bands. Below 2 the gradient stays
                           // smooth; higher values give the painted, cel-shaded look.

uniform float u_BandBlend; // How much of each band's width is spent crossing into the
                           // next: 0 gives hard cel edges, 1 an unbroken gradient.

// Shared with the vertex shader, so the color streams upward at the same rate
// the geometry churns at.
uniform float u_RoilSpeed;

// These are the interpolated values out of the rasterizer, so you can't know
// their specific values without knowing the vertices that contributed to them
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec4 fs_Col;

in float fs_Disp;          // The vertex shader's total displacement, remapped to [0, 1].
                           // This is what ties the color gradient to the geometry.
in float fs_Fbm;           // Just the high-frequency FBM layer, for finer mottling.
in float fs_Height;        // 0 at the root of the flame, 1 at the crown.
in float fs_Pulse;         // [0, 1] phase of the explosion cycle.
in vec4 fs_Pos;            // Displaced world-space position of this fragment.
in vec3 fs_LocalPos;       // The same point in the comet's own frame, tail along +Y.
in vec3 fs_ShapeNor;       // Normal of the smooth shape under the displacement.

out vec4 out_Col; // This is the final output color that you will see on your
                  // screen for the pixel that is currently being processed.

// ---------------------------------------------------------------------------
// Comet palette. On the portfolio the flame is a comet, so where the fireball
// ran from a charred crown to a white-hot root, this runs from the end of the
// tail to the nucleus; fs_Disp still picks the stop, so crests read bright and
// crevices dim. It is drawn additively, so black here is not dark but clear:
// the tail thins away into the sky instead of ending in a hard edge.
// ---------------------------------------------------------------------------
// Brightest at the nucleus and dimming out along the tail. The coma round the
// head carries the faint green of a real comet's gas, and the tail the blue of
// its ion tail. Stop placement is the fireball's: the pale end owns a wide
// slice at the head, the dark end a narrow one at the tip.
const vec3 VOID    = vec3(0.00, 0.00, 0.00); // the tip, gone into the sky
const vec3 WISP    = vec3(0.03, 0.06, 0.22); // the tail's last faint reach
const vec3 DEEP    = vec3(0.08, 0.20, 0.62); // deep blue of the far tail
const vec3 ION     = vec3(0.20, 0.52, 1.00); // the body of the tail
const vec3 CYAN    = vec3(0.45, 0.85, 1.00);
const vec3 COMA    = vec3(0.72, 1.00, 0.90); // the green-tinged glow round the head
const vec3 NUCLEUS = vec3(1.00, 1.00, 1.00); // white at the head
const vec3 HALO    = vec3(0.40, 0.90, 0.85); // tint of the thin outer edge of the glow

// ---------------------------------------------------------------------------
// Toolbox functions (see the Toolbox Functions slides). GLSL has no include
// mechanism, so the ones shared with the vertex shader are repeated here.
// ---------------------------------------------------------------------------

// 1) Perlin's bias: pushes t toward 0 or 1 without leaving the [0,1] range.
float bias(float b, float t)
{
    return pow(t, log(b) / log(0.5));
}

// 2) Perlin's gain: reshapes contrast around 0.5. Above 0.5 it pushes values
//    away from the middle, sharpening them; below 0.5 it pulls them toward it.
//    0.5 is the identity.
float gain(float g, float t)
{
    return (t < 0.5) ? bias(1.0 - g, 2.0 * t) * 0.5
                     : 1.0 - bias(1.0 - g, 2.0 - 2.0 * t) * 0.5;
}

// 3) Smootherstep (Perlin's quintic ease): C2-continuous ease-in/ease-out. Used
//    to blend between palette stops so no band edge is visible.
float smootherstep(float a, float b, float t)
{
    t = clamp((t - a) / (b - a), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// 4) Cubic pulse: a smooth bump of width w centered on c, zero everywhere else.
//    Targets a narrow slice of the gradient without touching the rest of it.
float cubicPulse(float c, float w, float x)
{
    x = abs(x - c);
    if (x > w) {
        return 0.0;
    }
    x /= w;
    return 1.0 - x * x * (3.0 - 2.0 * x);
}

// ---------------------------------------------------------------------------
// Per-pixel noise. The vertex shader has its own copy; GLSL has no include
// mechanism, and this has to be evaluated per fragment rather than interpolated
// from the vertices, or the color boundaries could only ever be straight lines
// between one vertex and the next.
// ---------------------------------------------------------------------------

// Both fixed rather than slider-driven. The octave count keeps the per-pixel
// cost constant, and the scale is in object units rather than a multiple of
// u_FbmScale, so pushing the geometry's detail up does not shatter the color
// into speckle - the two are separate art-direction decisions.
const int   COLOR_OCTAVES = 3;
const float COLOR_SCALE   = 1.5;

float hash31(vec3 p)
{
    p = fract(p * vec3(0.1031, 0.1030, 0.0973));
    p += dot(p, p.yxz + 33.33);
    return fract((p.x + p.y) * p.z);
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

float fbm(vec3 p)
{
    float sum = 0.0, amp = 0.5, freq = 1.0, norm = 0.0;
    for (int i = 0; i < COLOR_OCTAVES; ++i)
    {
        sum  += amp * valueNoise(p * freq + float(i) * 17.3);
        norm += amp;
        amp  *= 0.5;
        freq *= 2.0;
    }
    return sum / norm;
}

// Quantize x into `bands` steps, crossing between them over a `blend` fraction
// of each step instead of snapping. blend near 0 gives hard cel edges, blend of
// 1 gives back a continuous ramp. Monotone and continuous at every boundary.
float posterize(float x, float bands, float blend)
{
    if (bands < 2.0) {
        return x;
    }
    float scaled = x * bands;
    float cell   = floor(scaled);
    float f      = fract(scaled);
    float w      = clamp(blend, 0.002, 1.0) * 0.5;
    return (cell + smootherstep(0.5 - w, 0.5 + w, f)) / bands;
}

// Walk up the palette, easing between each pair of stops. Layering the mixes
// this way keeps the ramp continuous while letting each band own its own slice.
vec3 cometRamp(float t)
{
    t = clamp(t, 0.0, 1.0);

    vec3 c = VOID;
    c = mix(c, WISP,    smootherstep(0.00, 0.13, t));
    c = mix(c, DEEP,    smootherstep(0.09, 0.27, t));
    c = mix(c, ION,     smootherstep(0.22, 0.44, t));
    c = mix(c, CYAN,    smootherstep(0.40, 0.60, t));
    c = mix(c, COMA,    smootherstep(0.56, 0.74, t));
    c = mix(c, NUCLEUS, smootherstep(0.72, 0.88, t));
    return c;
}

void main()
{
    vec3 nor  = normalize(vec3(fs_Nor));
    vec3 lgt  = normalize(vec3(fs_LightVec));
    vec3 view = normalize(u_CameraPos - vec3(fs_Pos));

    // Flowing noise, sampled per pixel in the comet's own frame and marched
    // downward through the field so it streams up the flame, out along the tail
    // whichever way the comet is facing.
    vec3  flowPos = fs_LocalPos * COLOR_SCALE
                  + vec3(0.0, -u_RoilSpeed * u_Time, 0.0);
    float flow    = fbm(flowPos);

    // The dominant term is position along the flame: brightest at the root,
    // which is the comet's head, and fading on the way up until the crown, the
    // end of its tail, is gone. Gain above 0.5 drives the two ends apart, which
    // widens the white nucleus and lets the tail's tip fade out sooner.
    float heat = gain(0.68, 1.0 - fs_Height);

    // Warp that gradient with the flowing noise. Displacing the coordinate
    // rather than the color is what makes whole tongues of one band push up into
    // the next, the way the boundaries in real fire wander and reconnect.
    heat += u_Flow * (flow - 0.5) * 2.0;

    // Stay correlated with the vertex shader's displacement: a tongue that has
    // pushed further up has travelled further from the fuel, so it reads cooler
    // than the body it came from.
    heat -= 0.24 * (fs_Disp - 0.5);

    // Fold in the fine FBM layer on its own, which mottles the flame at a finer
    // scale than the low-frequency sway reaches.
    heat *= mix(0.84, 1.12, fs_Fbm);

    // The surge cycle flashes the whole flame hotter as it swells.
    heat += 0.16 * fs_Pulse;

    // Finally the heat slider biases the whole ramp hotter or cooler.
    heat = bias(clamp(u_Heat, 0.05, 0.95), clamp(heat, 0.0, 1.0));

    // Quantize into bands for the painted look of stylized fire. The warp above
    // has already bent the boundaries into organic shapes, so this only decides
    // how hard the steps between them read.
    heat = posterize(heat, u_Bands, u_BandBlend);

    vec3 color = cometRamp(heat);

    // Fire is emissive, so the Lambert term barely registers - just enough to
    // keep the form readable. It never drives the unlit side toward black.
    float diffuseTerm = max(dot(nor, lgt), 0.0);
    color *= mix(0.92, 1.10, diffuseTerm);

    // Dust: a narrow slice of the noise, showing only out along the tail, where
    // a few flecks catch the light.
    float dust = cubicPulse(0.86, 0.06, fs_Fbm) * smootherstep(0.55, 1.0, fs_Height);
    color += CYAN * dust * 0.8;

    // A comet is a glowing cloud rather than a solid, so in place of the
    // fireball's rim glow it is brightest where the line of sight passes square
    // through it and thins to nothing at the silhouette. abs() because both
    // sides of the cloud are drawn, and both glow; together they only saturate
    // to white right at the nucleus. Each surge of the pulse swells the glow
    // out toward the edge. How much cloud the eye looks through depends on its
    // overall shape, not its surface ripples, so this takes the smooth normal:
    // the displaced one would break the glow up into speckle at this size.
    float facing = abs(dot(normalize(fs_ShapeNor), view));
    float glow   = 0.75 * pow(facing, mix(1.6, 1.1, fs_Pulse));

    // Where the glow thins out it also cools from white to the green-blue of
    // the coma, so the head is a white core inside a coloured halo.
    color *= mix(HALO, vec3(1.0), facing);

    // Blended additively (see main.ts), so this adds light to the sky behind
    // the comet rather than painting over it.
    out_Col = vec4(color * glow * u_Color.rgb, 1.0);
}
