/* eslint-disable no-param-reassign */
/* eslint-disable prettier/prettier */

/**
 * Deeply compare two objecs
 * https://stackoverflow.com/a/32922084
 * @param {any} x - The first value to compare.
 * @param {any} y - The second value to compare.
 * @returns {boolean} - True if the values are deeply equal, false otherwise.
 */
function deepEqual(x, y) {
  const ok = Object.keys,
    tx = typeof x,
    ty = typeof y;
  return x && y && tx === "object" && tx === ty
    ? ok(x).length === ok(y).length &&
        ok(x).every((key) => deepEqual(x[key], y[key]))
    : x === y;
}

/**
 * Generate a random MAC address
 * https://stackoverflow.com/a/24621956
 * @returns {string} - Mac address
 */
function generateMac() {
  return "XX:XX:XX:XX:XX:XX".replace(/X/g, function () {
    return "0123456789ABCDEF".charAt(Math.floor(Math.random() * 16));
  });
}

/**
 * Convert HSV values to RGB
 * https://stackoverflow.com/a/17243070
 * @param {number} h - hue (0 <= h <= 1)
 * @param {number} s - saturation (0 <= s <= 1)
 * @param {number} v - brightness (0 <= v <= 1)
 * @returns {Array} - [r, g, b] (0 <= r, g, b <= 255)
 */
function HSVtoRGB(h, s, v) {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    s = h.s, v = h.v, h = h.h;
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

/**
 * Convert RGB values to HSB
 * https://stackoverflow.com/a/17243070
 * @param {number} r - red (0 <= r <= 255)
 * @param {number} g - green (0 <= g <= 255)
 * @param {number} b - blue (0 <= b <= 255)
 * @returns {Array} - [h, s, bv] (0 <= h, s, v <= 1)
 */
function RGBtoHSV(r, g, b) {
  if (arguments.length === 1) {
    g = r.g, b = r.b, r = r.r;
  }
  var max = Math.max(r, g, b), min = Math.min(r, g, b),
    d = max - min,
    h,
    s = (max === 0 ? 0 : d / max),
    v = max / 255;

  switch (max) {
    case min: h = 0; break;
    case r: h = (g - b) + d * (g < b ? 6 : 0); h /= 6 * d; break;
    case g: h = (b - r) + d * 2; h /= 6 * d; break;
    case b: h = (r - g) + d * 4; h /= 6 * d; break;
  }

  return [h, s, v];
}

module.exports = { deepEqual, generateMac, RGBtoHSV, HSVtoRGB };
