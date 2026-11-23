import type { GameData } from "../GameData.js";
import type { Analyzer } from "../Analyzer.js";
import { homeWinResults } from "../Result.js";

export interface TeamSummary {
    team: string;
    games: number;
    wins: number;
    losses: number;
    homeWins: number;
    awayWins: number;
    goalsFor: number;
    goalsAgainst: number;
    avgGoalsFor: number;
    avgGoalsAgainst: number;
}

export class TeamSummaryAnalyzer implements Analyzer<TeamSummary> {
    constructor(public teamName: string) {}

    runAnalysis(games: GameData[]): TeamSummary {
        let played = 0, wins = 0, losses = 0, homeWins = 0, awayWins = 0;
        let goalsFor = 0, goalsAgainst = 0;

        for (const [, home, away, homeGoals, awayGoals, result] of games) {
            const isHome = home === this.teamName;
            if (!isHome && away !== this.teamName) continue;

            played++;
            goalsFor += isHome ? homeGoals : awayGoals;
            goalsAgainst += isHome ? awayGoals : homeGoals;

            const homeTeamWon = homeWinResults.includes(result);
            if ((isHome && homeTeamWon)) { wins++; homeWins++; }
            if ((!isHome && !homeTeamWon)) { wins++; awayWins++; }
        }

        return {
            team: this.teamName,
            games: played,
            wins,
            losses: played - wins,
            homeWins,
            awayWins,
            goalsFor,
            goalsAgainst,
            avgGoalsFor: played ? goalsFor / played : 0,
            avgGoalsAgainst: played ? goalsAgainst / played : 0
        };
    }
}