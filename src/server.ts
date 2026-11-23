import express from "express";
import { GameReader } from "./GameReader.js";
import { GameRepository, type NewGame } from "./GameRepository.js";
import { Result } from "./Result.js";
import { TeamSummaryAnalyzer } from "./analyzers/TeamSummaryAnalyzer.js";
import { HomeAwayAnalyzer } from "./analyzers/HomeAwayAnalyzer.js";
import { AttendanceAnalyzer } from "./analyzers/AttendanceAnalyzer.js";

const DEFAULT_TEAM = "Tappara";
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = "liiga.db";
const RESULT_CODES = Object.values(Result) as string[];

// In-memory copy of the games, used by the analyzers.
// `let`, because it is reloaded after INSERT / UPDATE / DELETE.
let games = await loadGames();

async function loadGames() {
    const gameReader = GameReader.sqliteData(DB_FILE);
    await gameReader.load();
    return gameReader.games;
}

async function reloadGames(): Promise<void> {
    games = await loadGames();
}

// Direct SQL access for the REST endpoints
const repo = new GameRepository(DB_FILE);

const app = express();
app.use(express.json()); // must come before the routes, so POST/PUT bodies are parsed
app.use(express.static("public"));
app.use("/vendor/chart.js", express.static("node_modules/chart.js/dist"));

// ---------- helpers ----------
const teamFrom = (value: unknown): string =>
    typeof value === "string" && value !== "" ? value : DEFAULT_TEAM;

const str = (v: unknown): string | undefined =>
    typeof v === "string" && v !== "" ? v : undefined;

const toInt = (v: unknown): number | undefined =>
    v !== undefined && Number.isInteger(Number(v)) ? Number(v) : undefined;

// A valid game id is a positive integer
const idFrom = (v: unknown): number | undefined => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : undefined;
};

// Returns a NewGame, or an error message string if the input is invalid
function parseGame(body: Record<string, unknown>): NewGame | string {
    const { date, home_team, away_team, home_goals, away_goals, result, referee, attendance } = body;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return "date must be YYYY-MM-DD";
    }
    if (typeof home_team !== "string" || typeof away_team !== "string" || !home_team || !away_team) {
        return "home_team and away_team are required";
    }
    if (!Number.isInteger(home_goals) || !Number.isInteger(away_goals)
        || Number(home_goals) < 0 || Number(away_goals) < 0) {
        return "home_goals and away_goals must be non-negative integers";
    }
    if (typeof result !== "string" || !RESULT_CODES.includes(result)) {
        return `result must be one of: ${RESULT_CODES.join(", ")}`;
    }
    const attendanceNumber = attendance === undefined ? 0 : Number(attendance);
    if (!Number.isInteger(attendanceNumber) || attendanceNumber < 0) {
        return "attendance must be a non-negative integer";
    }
    return {
        date,
        home_team,
        away_team,
        home_goals: Number(home_goals),
        away_goals: Number(away_goals),
        result,
        referee: typeof referee === "string" ? referee : "",
        attendance: attendanceNumber,
    };
}

// ---------- analysis endpoints (used by the browser UI) ----------
app.get("/api/summary", (req, res) => {
    res.json(new TeamSummaryAnalyzer(teamFrom(req.query.team)).runAnalysis(games));
});

app.get("/api/home-away", (_req, res) => {
    res.json(new HomeAwayAnalyzer().runAnalysis(games));
});

app.get("/api/attendance", (req, res) => {
    res.json(new AttendanceAnalyzer(teamFrom(req.query.team)).runAnalysis(games));
});

// ---------- SELECT endpoints (SQL) ----------
app.get("/api/games", (req, res) => {
    res.json(
        repo.findAll({
            team: str(req.query.team),
            from: str(req.query.from),
            to: str(req.query.to),
            limit: Math.min(Math.max(toInt(req.query.limit) ?? 50, 1), 500),
            offset: Math.max(toInt(req.query.offset) ?? 0, 0),
        }),
    );
});

app.get("/api/games/:id", (req, res) => {
    const id = idFrom(req.params.id);
    if (id === undefined) {
        res.status(400).json({ error: "id must be a positive integer" });
        return;
    }
    const game = repo.findById(id);
    if (!game) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    res.json(game);
});

app.get("/api/teams", (_req, res) => {
    res.json(repo.teams());
});

app.get("/api/standings", (_req, res) => {
    res.json(repo.standings());
});

app.get("/api/referees", (_req, res) => {
    res.json(repo.referees());
});

app.get("/api/attendance/top", (req, res) => {
    res.json(repo.topAttendance(Math.min(Math.max(toInt(req.query.limit) ?? 10, 1), 100)));
});

app.get("/api/head-to-head", (req, res) => {
    const a = str(req.query.a);
    const b = str(req.query.b);
    if (!a || !b) {
        res.status(400).json({ error: "query parameters a and b are required" });
        return;
    }
    res.json(repo.headToHead(a, b));
});

// ---------- INSERT / UPDATE / DELETE ----------
app.post("/api/games", async (req, res) => {
    const game = parseGame(req.body ?? {});
    if (typeof game === "string") {
        res.status(400).json({ error: game });
        return;
    }
    const id = repo.create(game);
    await reloadGames();
    res.status(201).json({ id, ...game });
});

app.put("/api/games/:id", async (req, res) => {
    const id = idFrom(req.params.id);
    if (id === undefined) {
        res.status(400).json({ error: "id must be a positive integer" });
        return;
    }
    const game = parseGame(req.body ?? {});
    if (typeof game === "string") {
        res.status(400).json({ error: game });
        return;
    }
    if (!repo.update(id, game)) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    await reloadGames();
    res.json({ id, ...game });
});

app.delete("/api/games/:id", async (req, res) => {
    const id = idFrom(req.params.id);
    if (id === undefined) {
        res.status(400).json({ error: "id must be a positive integer" });
        return;
    }
    if (!repo.delete(id)) {
        res.status(404).json({ error: "Game not found" });
        return;
    }
    await reloadGames();
    res.status(204).end();
});

// ---------- error handler (must be after all routes) ----------
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));