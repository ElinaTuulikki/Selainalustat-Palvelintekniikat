# Liiga 2025-2026 Statistics

Final project for the courses Selainalustat (Browser Platforms) and Palvelintekniikat (Server Technologies).

The application reads the games of the 2025-2026 Finnish Liiga season into an SQLite database, analyses them and shows the results in a browser. The page has a team selector, and its colours change with the selected team. The backend also offers a REST API with SELECT, INSERT, UPDATE and DELETE operations.

## Technologies

- TypeScript (server and browser code)
- Node.js with Express 5
- SQLite through the built-in `node:sqlite` module
- Chart.js for the charts
- REST Client (VS Code extension) for testing the API with `test.http`

## Requirements

- Node.js 22.13 or newer (`node:sqlite` is needed)
- VS Code with the REST Client extension (only for `test.http`)

## Getting started

```
npm install
npm run build
npm run seed
npm start
```

Then open http://localhost:3000.

- `npm run build` compiles the server to `dist/` and the browser code to `public/js/`.
- `npm run seed` creates `liiga.db` from `db/schema.sql` and `liiga25-26.csv`. It deletes any existing database first, so stop the server before running it.
- `npm start` starts the server.

For development, run `npm run build` once and then `npm run dev`. It watches and recompiles the server and the browser code, and restarts the server automatically.

## Scripts

| Script    | Purpose                              |
| --------- | ------------------------------------ |
| `build` | Compile server and browser code once |
| `start` | Start the compiled server            |
| `dev`   | Watch, recompile and restart         |
| `seed`  | Create and fill the database         |

## Database

The database has one table, `games`, created by `db/schema.sql`:

| Column                 | Description            |
| ---------------------- | ---------------------- |
| id                     | Primary key            |
| date                   | Date as `YYYY-MM-DD` |
| home_team, away_team   | Team names             |
| home_goals, away_goals | Final score            |
| result                 | Result code, see below |
| referee                | Referee name           |
| attendance             | Number of spectators   |

Result codes:

| Code | Finnish                                             | English                     |
| ---- | --------------------------------------------------- | --------------------------- |
| K    | Kotijoukkueen voitto                                | Home team win               |
| KJ   | Kotijoukkueen voitto jatkoajalla                    | Home team win in overtime   |
| RLK  | Kotijoukkueen voitto rangaistuslaukauskilpailussa   | Home team win in a shootout |
| V    | Vierasjoukkueen voitto                              | Away team win               |
| VJ   | Vierasjoukkueen voitto jatkoajalla                  | Away team win in overtime   |
| RLV  | Vierasjoukkueen voitto rangaistuslaukauskilpailussa | Away team win in a shootout |

The seed script (`src/seedDb.ts`) reads the CSV with `CsvReader` and inserts all rows in one transaction. To rebuild the database, run `npm run seed` again.

## Project structure

```
src/                  Server (TypeScript)
  server.ts           Express app and API routes
  GameRepository.ts   SQL queries (SELECT, INSERT, UPDATE, DELETE)
  GameReader.ts       Loads games into typed objects
  CsvReader.ts        DataReader for CSV files
  SqliteReader.ts     DataReader for the SQLite database
  DataReader.ts       Reader interface
  Analyzer.ts         Generic analyzer interface
  analyzers/          TeamSummary, HomeAway and Attendance analyzers
  seedDb.ts           Creates the database from the CSV
client/               Browser code (TypeScript)
  main.ts             Page logic
  charts.ts           Chart.js charts
  render.ts           Table rendering
  teams.ts            Team colour themes
  api.ts, types.ts    Fetch helper and response types
public/               index.html, styles.css and compiled browser code
db/schema.sql         Database schema
liiga25-26.csv        Source data
test.http             API requests for the REST Client extension
```

## Analyses

The analyses run in the `Analyzer<T>` classes in `src/analyzers/`. `GameReader` loads the games from the database into typed objects, an analyzer calculates the result, the server returns it as JSON and the browser draws it as a chart or a table. A win is decided from the result code (see the database section).

**1. Team summary** (`TeamSummaryAnalyzer`)
Compares the selected team's own numbers: home wins, away wins, losses, goals for and goals against. The analyzer goes through all games and skips those the team did not play. Goals are added according to whether the team was the home or the away side. Losses are games played minus wins, and goals per game are total goals divided by games played. Shown as two bar charts and a table.

**2. Home vs away** (`HomeAwayAnalyzer`)
Compares the number of home wins with the number of away wins in the whole league, which shows how large the home advantage is. It counts the games with a home win code, and the rest are away wins. It does not depend on the selected team. Shown as a pie chart and a table.

**3. Attendance** (`AttendanceAnalyzer`)

- Average attendance per team: the attendance of each team's home games is summed and divided by the number of home games. Teams are compared with each other, and the selected team is highlighted.
- Biggest crowds: all games sorted by attendance, the top ten are shown.
- Trend: the selected team's home games in date order, shown as a line chart.

Only home games are used for averages and the trend, because the attendance belongs to the home team's audience.

**4. SQL queries** (`GameRepository`, available through the REST API)

- Standings: every game becomes two rows, one for the home team and one for the away team (`UNION ALL`), and `GROUP BY` sums them per team.
- Referees: `GROUP BY referee` counts the games of each referee.
- Head-to-head: `WHERE` finds the games between two teams, with either team at home.
- Games list: filtered by team, date range, and paged with `limit` and `offset`.

## Browser UI

- Five charts: wins and losses, goals per game, home vs away wins, attendance trend, average attendance per team
- Four tables: team summary, home vs away, average attendance, biggest crowds
- Team selector that reloads all data and changes the page colours

## REST API

| Method | Path                    | Description                                                          |
| ------ | ----------------------- | -------------------------------------------------------------------- |
| GET    | `/api/games`          | List games. Query: `team`, `from`, `to`, `limit`, `offset` |
| GET    | `/api/games/:id`      | One game                                                             |
| POST   | `/api/games`          | Add a game                                                           |
| PUT    | `/api/games/:id`      | Replace a game                                                       |
| DELETE | `/api/games/:id`      | Delete a game                                                        |
| GET    | `/api/teams`          | Team names                                                           |
| GET    | `/api/standings`      | League standings                                                     |
| GET    | `/api/referees`       | Games per referee                                                    |
| GET    | `/api/attendance/top` | Biggest crowds. Query: `limit`                                     |
| GET    | `/api/head-to-head`   | Games between two teams. Query: `a`, `b`                         |
| GET    | `/api/summary`        | Team summary. Query: `team`                                        |
| GET    | `/api/home-away`      | Home vs away wins                                                    |
| GET    | `/api/attendance`     | Attendance analysis. Query: `team`                                 |

POST and PUT take a JSON body with `date` (`YYYY-MM-DD`), `home_team`, `away_team`, `home_goals`, `away_goals`, `result` (one of the result codes), and optionally `referee` and `attendance`. Invalid input returns 400, an unknown id returns 404.

Example of a POST body:

```json
{
  "date": "2026-03-01",
  "home_team": "Tappara",
  "away_team": "Ilves",
  "home_goals": 4,
  "away_goals": 2,
  "result": "K",
  "referee": "Test Referee",
  "attendance": 7000
}
```

## Testing

Start the server and open `test.http` in VS Code. Click "Send Request" above any request. The file contains every endpoint, including error cases (the comments tell which status code to expect). Send the POST in the "INSERT / UPDATE / DELETE" section first, because the PUT and DELETE requests use the id of the game it creates.

## Limitations of the data

The data in `liiga25-26.csv` is the sample dataset provided for the course. Its results do not match the official results of the 2025-2026 season. For example, the file gives Tappara 27 wins in 60 games, while the official standings show 38 wins (35 in regulation and 3 in overtime or shootout). Other signs of this are that two thirds of the games are marked as overtime or shootout games, and some of those have a goal difference of four or more.

The application itself handles the data correctly: the result codes agree with the scores in every game, and the analyses and the SQL queries give the same win counts. The statistics shown therefore describe this dataset only, not the real season. A different CSV in the same format can be loaded with `npm run seed`.
