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

export interface HomeAwayResult {
    homeWins: number;
    awayWins: number;
}

export interface AttendanceResult {
    averageByTeam: { team: string; average: number }[];
    biggestCrowds: { date: string; home: string; away: string; attendance: number }[];
    trend: { date: string; attendance: number }[];
}