import type { GameData } from "../GameData.js";
import type { Analyzer } from "../Analyzer.js";
import { homeWinResults } from "../Result.js";

export interface HomeAwayResult {
    homeWins: number;
    awayWins: number;
}

export class HomeAwayAnalyzer implements Analyzer<HomeAwayResult> {
    runAnalysis(games: GameData[]): HomeAwayResult {
        const homeWins = games.filter((g) => homeWinResults.includes(g[5])).length;
        return { homeWins, awayWins: games.length - homeWins };
    }
}