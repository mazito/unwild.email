// Pure: deterministic identicon avatar SVG from a username.
// Hash → 2 HSL stops → gradient circle + initials. No IO.

function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? ''
    const b = parts[1]?.[0] ?? ''
    return (a + b).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Yellow/green hues appear brighter; blue/violet appear darker.
function perceivedLightness(hue: number, l: number): number {
  const hueFactor = 1 + 0.25 * Math.cos(((hue - 60) * Math.PI) / 180)
  return (l / 100) * hueFactor
}

export function avatarSVG(username: string, size = 40): string {
  const h = hash(username)
  const hue1 = h % 360
  const hue2 = (hue1 + 110) % 360

  // Lightness 48% so hues stay dark enough for white text.
  const c1 = `hsl(${hue1}, 70%, 48%)`
  const c2 = `hsl(${hue2}, 65%, 40%)`

  const bright = perceivedLightness(hue1, 48)
  const textColor = bright > 0.55 ? '#1e293b' : '#ffffff'

  const cx = size / 2
  const fontSize = Math.round(size * 0.36)
  const gradId = `g${h}`
  const letters = initials(username)

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    `<defs>` +
    `<linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">` +
    `<stop offset="0%" stop-color="${c1}"/>` +
    `<stop offset="100%" stop-color="${c2}"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<circle cx="${cx}" cy="${cx}" r="${cx}" fill="url(#${gradId})"/>` +
    `<text x="${cx}" y="${cx}" text-anchor="middle" dominant-baseline="central" ` +
    `font-family="Inter Variable, system-ui, sans-serif" font-weight="600" ` +
    `font-size="${fontSize}" fill="${textColor}">${letters}</text>` +
    `</svg>`
  )
}
