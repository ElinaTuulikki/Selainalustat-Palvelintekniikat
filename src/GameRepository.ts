import { DatabaseSync } from "node:sqlite";

export interface GameRow {
    id: number;
    date: string;
    home_team: string;
    away_team: string;
    home_goals: number;
    away_goals: number;
    result: string;
    referee: string;
    attendance: number;
}

export type NewGame = Omit<GameRow, "id">;

export interface GameFilters {
    team?: string | undefined;
    from?: string | undefined;
    to?: string | undefined;
    limit: number;
    offset: number;
}

export class GameRepository {
    private db: DatabaseSync;

    constructor(file: string) {
        this.db = new DatabaseSync(file);
    }

    findAll(f: GameFilters): GameRow[] {
        const where: string[] = [];
        const params: (string | number)[] = [];
        if (f.team) {
            where.push("(home_team =  ? OR away_team = ?)");
            params.push(f.team, f.team);
        }
        if (f.from) { where.push("date >= ?"); params.push(f.from); }
        if (f.to) { where.push("date <= ?"); params.push(f.to); }
        const sql =
            "SELECT * FROM games" + (where.length ? " WHERE " + where.join(" AND ") : "") + " ORDER BY date, id LIMIT ? OFFSET ?";
        params.push(f.limit, f.offset);
        return this.db.prepare(sql).all(...params) as unknown as GameRow[];
    }

    findById(id: number): GameRow | undefined {
        return this.db.prepare("SELECT * FROM games WHERE id = ?").get(id) as unknown as GameRow | undefined;
    }

    teams(): string[] {
        const rows = this.db
            .prepare("SELECT DISTINCT home_team AS team FROM games ORDER BY team")
            .all() as unknown as { team: string }[];
        return rows.map((r) => r.team);
    }

    standings() {
        return this.db.prepare(`
            SELECT team,
                COUNT(*) AS games,
                SUM(win) AS wins,
                SUM(points) AS points,
                SUM(gf) AS goals_for,
                SUM(ga) AS goals_against,
                SUM(gf) - SUM(ga) AS goal_diff
            FROM (
                SELECT home_team AS team, home_goals AS gf, away_goals AS ga,
                    result IN ('K','KJ','RLK') AS win,
                    CASE result WHEN 'K' THEN 3 WHEN 'KJ' THEN 2 WHEN 'RLK' THEN 2
                                WHEN 'VJ' THEN 1 WHEN 'RLV' THEN 1 ELSE 0 END AS points
                FROM games
                UNION ALL
                SELECT away_team, away_goals, home_goals,
                    result IN ('V','VJ','RLV'),
                    CASE result WHEN 'V' THEN 3 WHEN 'VJ' THEN 2 WHEN 'RLV' THEN 2
                                WHEN 'KJ' THEN 1 WHEN 'RLK' THEN 1 ELSE 0 END
                FROM games
            )
            GROUP BY team
            ORDER BY points DESC, wins DESC, goal_diff DESC
        `).all();
    }

    referees() {
        return this.db.prepare(`
            SELECT referee, COUNT(*) AS games
            FROM games GROUP BY referee ORDER BY games DESC
        `).all();
    }

    topAttendance(limit: number) {
        return this.db
            .prepare("SELECT * FROM games ORDER BY attendance DESC LIMIT ?")
            .all(limit);
    }

    headToHead(a: string, b: string) {
        return this.db.prepare(`
            SELECT * FROM games
            WHERE (home_team = ? AND away_team = ?) OR (home_team = ? AND away_team = ?)
            ORDER BY date
        `).all(a, b, b, a);
    }

    create(g: NewGame): number {
        const info = this.db.prepare(`
            INSERT INTO games (date, home_team, away_team, home_goals, away_goals, result, referee, attendance)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(g.date, g.home_team, g.away_team, g.home_goals, g.away_goals, g.result, g.referee, g.attendance);
        return Number (info.lastInsertRowid);
    }

    update(id: number, g: NewGame): boolean {
        const info = this.db.prepare(`
            UPDATE games SET date = ?, home_team = ?, away_team = ?, home_goals = ?, away_goals = ?, result = ?, referee = ?, attendance = ?
            WHERE id = ?
        `).run(g.date, g.home_team, g.away_team, g.home_goals, g.away_goals, g.result, g.referee, g.attendance, id);
        return Number(info.changes) > 0;
    }

    delete(id: number): boolean {
        const info = this.db.prepare("DELETE FROM games WHERE id = ?").run(id);
        return Number(info.changes) > 0;
    } 
}