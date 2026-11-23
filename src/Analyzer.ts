import type { GameData } from "./GameData.js";

export interface Analyzer<T> {
    runAnalysis(games: GameData[]): T;
}