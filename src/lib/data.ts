/**
 * Reads every file in src/data/, checks it, and works out all the stats.
 * Nothing here is stored by hand: rankings are always recomputed from the game files.
 */
import { parse } from 'yaml';
import fs from 'node:fs';
import path from 'node:path';
import { cash, rng, round2 } from './paper';

export type Player = { id: string; name: string; nickname?: string; bio?: string; photo?: string };
export type Row = { player: string; buyin: number; cashout: number; net: number };
export type Game = {
  id: string; no: number; date: string; title?: string; location?: string; stakes?: string;
  notes?: string; rake: number; rows: Row[]; pot: number;
};
export type LogEntry = Row & { game: Game };
export type Stats = {
  player: Player; rank: number; total: number; gp: number; buyins: number; roi: number;
  winRate: number; best: number; worst: number; streak: string; running: number[]; log: LogEntry[];
};

const load = (files: Record<string, unknown>) =>
  Object.entries(files).map(([f, text]) => ({ file: f.split('/').pop()!, data: (parse(String(text)) ?? {}) as any }));

const playerFiles = load(import.meta.glob('../data/players/*.{yml,yaml}', { eager: true, query: '?raw', import: 'default' }));
const gameFiles = load(import.meta.glob('../data/games/*.{yml,yaml}', { eager: true, query: '?raw', import: 'default' }));

const problems: string[] = [];
const isMoney = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/* ---------- players ---------- */
export const players: Player[] = playerFiles.map(({ file, data }) => {
  const id = file.replace(/\.ya?ml$/, '');
  if (!data.name) problems.push(`players/${file}: missing "name"`);
  const photo = fs.existsSync(path.resolve('public/players', `${id}.png`)) ? `players/${id}.png` : undefined;
  return { id, name: String(data.name ?? id), nickname: data.nickname, bio: data.bio, photo };
});
export const playerById = new Map(players.map(p => [p.id, p]));

/* ---------- games ---------- */
export const games: Game[] = gameFiles
  .map(({ file, data }) => {
    const where = `games/${file}`;
    const date = String(data.date ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push(`${where}: "date" should look like 2026-11-20`);
    const seen = new Set<string>();
    const rows: Row[] = (data.results ?? []).map((r: any, i: number) => {
      if (!playerById.has(r?.player)) problems.push(`${where}: result #${i + 1}: no player file for "${r?.player}" (add players/${r?.player}.yml)`);
      if (seen.has(r?.player)) problems.push(`${where}: "${r?.player}" is listed twice`);
      seen.add(r?.player);
      if (!isMoney(r?.buyin) || !isMoney(r?.cashout)) problems.push(`${where}: "${r?.player}" needs a number for buyin and cashout`);
      return { player: r?.player, buyin: r?.buyin, cashout: r?.cashout, net: round2(r?.cashout - r?.buyin) };
    });
    if (rows.length < 2) problems.push(`${where}: needs at least two results`);
    const rake = Number(data.rake ?? 0);
    const off = round2(rows.reduce((a, r) => a + r.net, 0) + rake);
    if (off !== 0)
      problems.push(`${where}: doesn't balance. Cash-outs are ${off > 0 ? 'over' : 'under'} buy-ins by ${cash(off)}. ` +
        `Check the numbers (or add "rake: X" if money left the table, e.g. pizza).`);
    return {
      id: date, no: 0, date, title: data.title ? String(data.title) : undefined,
      location: data.location, stakes: data.stakes, notes: data.notes,
      rake, rows: rows.sort((a, b) => b.net - a.net), pot: round2(rows.reduce((a, r) => a + r.buyin, 0)),
    };
  })
  .sort((a, b) => a.date.localeCompare(b.date));
games.forEach((g, i) => (g.no = i + 1));

if (problems.length) {
  throw new Error(`\n\nFix these in src/data/ and try again:\n  • ${problems.join('\n  • ')}\n`);
}

/* ---------- per-player stats ---------- */
export const stats: Stats[] = players
  .map(player => {
    const log = games.flatMap(game => game.rows.filter(r => r.player === player.id).map(r => ({ ...r, game })));
    const nets = log.map(l => l.net);
    const total = round2(nets.reduce((a, b) => a + b, 0));
    const buyins = round2(log.reduce((a, l) => a + l.buyin, 0));
    let run = 0; const running = nets.map(n => (run = round2(run + n)));
    let streak = 0; const lastSign = Math.sign(nets.at(-1) ?? 0);
    for (let i = nets.length - 1; i >= 0 && lastSign && Math.sign(nets[i]) === lastSign; i--) streak++;
    return {
      player, rank: 0, total, gp: log.length, buyins, log, running,
      roi: buyins ? Math.round((total / buyins) * 100) : 0,
      winRate: log.length ? Math.round((nets.filter(n => n > 0).length / log.length) * 100) : 0,
      best: log.length ? Math.max(...nets) : 0,
      worst: log.length ? Math.min(...nets) : 0,
      streak: streak ? `${lastSign > 0 ? 'W' : 'L'}${streak}` : '—',
    };
  })
  .filter(s => s.gp > 0) // players with no games yet stay off the board
  .sort((a, b) => b.total - a.total || b.gp - a.gp);
stats.forEach((s, i) => (s.rank = i + 1));
export const statsById = new Map(stats.map(s => [s.player.id, s]));

const top = stats[0], bottom = stats.at(-1);
export const shark = top && top.total > 0 ? top : undefined;
export const fish = bottom && bottom.total < 0 ? bottom : undefined;

/* ---------- season numbers for "By the Numbers" ---------- */
const allRows = games.flatMap(g => g.rows.map(r => ({ ...r, game: g })));
const winStreak = (s: Stats) => (s.streak.startsWith('W') ? Number(s.streak.slice(1)) : 0);
export const season = {
  games: games.length,
  players: stats.length,
  moved: round2(allRows.filter(r => r.net > 0).reduce((a, r) => a + r.net, 0)),
  boughtIn: round2(allRows.reduce((a, r) => a + r.buyin, 0)),
  biggestPot: [...games].sort((a, b) => b.pot - a.pot)[0],
  avgPot: games.length ? round2(games.reduce((a, g) => a + g.pot, 0) / games.length) : 0,
  bestNight: [...allRows].sort((a, b) => b.net - a.net)[0],
  worstNight: [...allRows].sort((a, b) => a.net - b.net)[0],
  // biggest return on a single buy-in, e.g. $25 -> $201.50 is 8.06x
  bestMultiple: [...allRows].filter(r => r.buyin > 0).sort((a, b) => b.cashout / b.buyin - a.cashout / a.buyin)[0],
  deepestPockets: [...stats].sort((a, b) => b.buyins - a.buyins)[0],
  busts: allRows.filter(r => r.cashout === 0).length,
  hotStreak: [...stats].sort((a, b) => winStreak(b) - winStreak(a)).find(s => winStreak(s) >= 2),
  firstDate: games[0]?.date,
  lastDate: games.at(-1)?.date,
};

/* ---------- headlines: the game's own title, or an auto one ---------- */
export function headline(g: Game) {
  if (g.title) return g.title;
  const r = rng(g.date);
  const w = g.rows[0], l = g.rows.at(-1)!;
  const W = playerById.get(w.player)!.name.toUpperCase(), L = playerById.get(l.player)!.name.toUpperCase();
  const options = [
    `${W} SMELLS BLOOD, TAKES ${cash(w.net)}`,
    `FEEDING FRENZY: ${W} UP ${cash(w.net)}`,
    `${L} SLEEPS WITH THE FISHES`,
    `${W} EATS. ${L} GETS EATEN.`,
    `FISH SPOTTED: ${L} DOWN ${cash(l.net)}`,
  ];
  // walk through the templates game by game so neighbouring headlines differ
  return options[(g.no * 3 + Math.floor(r() * 2)) % options.length];
}
