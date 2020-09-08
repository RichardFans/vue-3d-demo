export {
  hexToRGB,
  RGBToHex
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