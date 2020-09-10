export {
  hexToRGB,
  RGBToHex,
  RGBToLAB,
  deltaE
}

function hexToRGB (hex, alpha, object) {
  let r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16)
  if (object) return {r, g, b, a: alpha}
  if (alpha) {
    return "rgba(" + r + ", " + g + ", " + b + ", " + (alpha / 255) + ")"
  } else {
    return "rgb(" + r + ", " + g + ", " + b + ")"
  }
}

function RGBToHex (r, g, b) {
  r = r.toString(16)
  g = g.toString(16)
  b = b.toString(16)

  if (r.length === 1)
    r = "0" + r
  if (g.length === 1)
    g = "0" + g
  if (b.length === 1)
    b = "0" + b

  return "#" + r + g + b
}

function RGBToLAB (r, g, b) {
  let x, y, z
  r = r / 255, g = g / 255, b = b / 255
  r = (r > 0.04045) ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92
  g = (g > 0.04045) ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92
  b = (b > 0.04045) ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92
  x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.00000
  z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  x = (x > 0.008856) ? Math.pow(x, 1 / 3) : (7.787 * x) + 16 / 116
  y = (y > 0.008856) ? Math.pow(y, 1 / 3) : (7.787 * y) + 16 / 116
  z = (z > 0.008856) ? Math.pow(z, 1 / 3) : (7.787 * z) + 16 / 116
  return [(116 * y) - 16, 500 * (x - y), 200 * (y - z)]
}

/**
 * 色彩相似度
 * @param r1
 * @param g1
 * @param b1
 * @param r2
 * @param g2
 * @param b2
 * @returns {number}
 */
function deltaE (r1, g1, b1, r2, g2, b2) {
  let labA = RGBToLAB(r1, g1, b1)
  let labB = RGBToLAB(r2, g2, b2)
  let deltaL = labA[0] - labB[0]
  let deltaA = labA[1] - labB[1]
  let deltaB = labA[2] - labB[2]
  let c1 = Math.sqrt(labA[1] * labA[1] + labA[2] * labA[2])
  let c2 = Math.sqrt(labB[1] * labB[1] + labB[2] * labB[2])
  let deltaC = c1 - c2
  let deltaH = deltaA * deltaA + deltaB * deltaB - deltaC * deltaC
  deltaH = deltaH < 0 ? 0 : Math.sqrt(deltaH)
  let sc = 1.0 + 0.045 * c1
  let sh = 1.0 + 0.015 * c1
  let deltaLKlsl = deltaL / (1.0)
  let deltaCkcsc = deltaC / (sc)
  let deltaHkhsh = deltaH / (sh)
  let i = deltaLKlsl * deltaLKlsl + deltaCkcsc * deltaCkcsc + deltaHkhsh * deltaHkhsh
  return i < 0 ? 0 : Math.sqrt(i)
}