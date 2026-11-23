import { DatabaseSync } from "node:sqlite";
import type { DataReader } from "./DataReader.js";

interface GameRow {
  date: string;
  home_team: string;
  away_team: string;
  home_goals: number;
  away_goals: number;
  result: string;
  referee: string;
  attendance: number;
}

export class SqliteReader implements DataReader {
  data: string[][] = [];

  constructor(public filename: string) {}

  async read(): Promise<void> {
    const db = new DatabaseSync(this.filename, { readOnly: true });
    try {
      const rows = db
        .prepare(
          `SELECT date, home_team, away_team, home_goals, away_goals,
                  result, referee, attendance
           FROM games
           ORDER BY date`,
        )
        .all() as unknown as GameRow[];

      this.data = rows.map((r): string[] => [
        r.date,
        r.home_team,
        r.away_team,
        String(r.home_goals),
        String(r.away_goals),
        r.result,
        r.referee,
        String(r.attendance),
      ]);
    } finally {
      db.close();
    }
  }
}