import type { GameData } from "../GameData.js";
import type { Analyzer } from "../Analyzer.js";
import { toIsoDate } from "../utilities.js";

export interface AttendanceResult {
    averageByTeam: { team: string; average: number }[];
    biggestCrowds: { date: string; home: string; away: string; attendance: number }[];
    trend: { date: string; attendance: number }[];
}

export class AttendanceAnalyzer implements Analyzer<AttendanceResult> {
    constructor(public teamName: string) {}

    runAnalysis(games: GameData[]): AttendanceResult {
        const totals = new Map<string, { sum: number; count: number }>();
        for (const [, home, , , , , , attendance] of games) {
            const t = totals.get(home) ?? { sum: 0, count: 0 };
            t.sum += attendance;
            t.count++;
            totals.set(home, t);
        }

        const averageByTeam = [...totals.entries()]
            .map(([team, t]) => ({ team, average: Math.round(t.sum / t.count) }))
            .sort((a, b) => b.average - a.average);

        const biggestCrowds = [...games]
            .sort((a, b) => b[7] - a[7])
            .slice(0, 10)
            .map((g) => ({ date: toIsoDate(g[0]), home: g[1], away: g[2], attendance: g[7] }));

        const trend = games
            .filter((g) => g[1] === this.teamName)
            .sort((a, b) => a[0].getTime() - b[0].getTime())
            .map((g) => ({ date: toIsoDate(g[0]), attendance: g[7] }));

        return { averageByTeam, biggestCrowds, trend };
    }
}