// Seeded randomness so the collage looks hand-made but identical on every build.
export const hash = (s: string) =>
  [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;

export function rng(seed: string | number) {
  let a = typeof seed === 'string' ? hash(seed) : seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A small random rotation, e.g. "-1.3deg". */
export const tilt = (seed: string, max = 1.5) => `${((rng(seed)() * 2 - 1) * max).toFixed(2)}deg`;

/** clip-path polygon with ripped edges. sides: any of t r b l. */
export function torn(seed: string, sides = 'tblr', amp = 6, step = 3.5) {
  const r = rng(seed), pts: string[] = [], j = () => (r() * amp).toFixed(1);
  const xs: number[] = []; for (let x = 0; x < 100; x += step * (0.6 + r() * 0.8)) xs.push(x); xs.push(100);
  const ys: number[] = []; for (let y = 0; y < 100; y += step * 2 * (0.6 + r() * 0.8)) ys.push(y); ys.push(100);
  if (sides.includes('t')) xs.forEach(x => pts.push(`${x.toFixed(1)}% ${j()}px`)); else pts.push('0% 0%', '100% 0%');
  if (sides.includes('r')) ys.forEach(y => pts.push(`calc(100% - ${j()}px) ${y.toFixed(1)}%`));
  if (sides.includes('b')) [...xs].reverse().forEach(x => pts.push(`${x.toFixed(1)}% calc(100% - ${j()}px)`)); else pts.push('100% 100%', '0% 100%');
  if (sides.includes('l')) [...ys].reverse().forEach(y => pts.push(`${j()}px ${y.toFixed(1)}%`));
  return `clip-path:polygon(${pts.join(',')})`;
}

export const money = (n: number) => (n > 0 ? `+$${n}` : n < 0 ? `−$${Math.abs(n)}` : '$0');
export const sign = (n: number) => (n > 0 ? 'pos' : n < 0 ? 'neg' : 'even');
export const pct = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}%`;
export const pad3 = (n: number) => String(n).padStart(3, '0');
export const fmtDate = (d: string, o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) =>
  new Date(d + 'T12:00:00').toLocaleDateString('en-US', o);

/** Prefix a path with the site's base (needed on GitHub Pages project sites). */
export const url = (p: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${p.replace(/^\//, '')}`;
