export interface TeamTheme {
  primary: string;     // main colour: header and main bars (dark enough for white text)
  secondary: string;   // accent colour: table headers, highlights
  onSecondary: string; // text colour on top of the accent (white or near-black)
}

// Colour names come from Wikipedia / Elite Prospects club info.
// The hex values are approximations of those colours, except Ilves,
// KooKoo and JYP, whose values come from TheSportsDB.
const THEMES: Record<string, TeamTheme> = {
  // blue, orange, white
  Tappara: { primary: "#003da5", secondary: "#ff6a13", onSecondary: "#ffffff" },
  // green, yellow, black (hex: TheSportsDB)
  Ilves: { primary: "#006934", secondary: "#ffcb05", onSecondary: "#111111" },
  // black, white (grey is a stand-in accent, white would vanish on white)
  TPS: { primary: "#111111", secondary: "#9a9a9a", onSecondary: "#111111" },
  // red, white, dark blue
  HIFK: { primary: "#d4002a", secondary: "#12285a", onSecondary: "#ffffff" },
  // blue, white, yellow
  "K-Espoo": { primary: "#0b4ea2", secondary: "#ffd100", onSecondary: "#111111" },
  // blue, yellow
  Lukko: { primary: "#003f87", secondary: "#ffd100", onSecondary: "#111111" },
  // red, black, white (+ gold)
  Ässät: { primary: "#d6001c", secondary: "#1a1a1a", onSecondary: "#ffffff" },
  // black, yellow, white
  Kärpät: { primary: "#1a1a1a", secondary: "#ffd100", onSecondary: "#111111" },
  // black, orange, white (hex: TheSportsDB)
  KooKoo: { primary: "#000000", secondary: "#e87026", onSecondary: "#111111" },
  // orange, black, white
  HPK: { primary: "#1a1a1a", secondary: "#f47920", onSecondary: "#111111" },
  // black, gold
  KalPa: { primary: "#1a1a1a", secondary: "#d4a52a", onSecondary: "#111111" },
  // red, black, white
  Sport: { primary: "#c8102e", secondary: "#1a1a1a", onSecondary: "#ffffff" },
  // light blue, black, white, gold
  Pelicans: { primary: "#111111", secondary: "#5bc2e7", onSecondary: "#111111" },
  // yellow, black
  SaiPa: { primary: "#1a1a1a", secondary: "#ffd100", onSecondary: "#111111" },
  // red, black, white (hex: TheSportsDB)
  JYP: { primary: "#e30613", secondary: "#1a1a1a", onSecondary: "#ffffff" },
  // blue, yellow, red, white
  Jukurit: { primary: "#003f8a", secondary: "#f5c400", onSecondary: "#111111" },
};

const FALLBACK: TeamTheme = THEMES.Tappara;

export function applyTeamTheme(team: string): void {
  const theme = THEMES[team] ?? FALLBACK;
  const style = document.documentElement.style;
  style.setProperty("--primary", theme.primary);
  style.setProperty("--secondary", theme.secondary);
  style.setProperty("--on-secondary", theme.onSecondary);
}