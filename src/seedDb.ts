import fs from "fs/promises";
import { DatabaseSync } from "node:sqlite";
import { CsvReader } from "./CsvReader.js";
import { dateStringToDate, toIsoDate } from "./utilities.js";

const DB_FILE = "liiga.db";
const CSV_FILE = "liiga25-26.csv";

// 1. Read the CSV with the reader we already have
const csv = new CsvReader(CSV_FILE);
await csv.read();

// 2. Start from a clean database
await fs.rm(DB_FILE, { force: true });
const db = new DatabaseSync(DB_FILE);
db.exec(await fs.readFile("db/schema.sql", "utf-8"));

// 3. Insert all rows in one transaction
const insert = db.prepare(
  `INSERT INTO games
     (date, home_team, away_team, home_goals, away_goals, result, referee, attendance)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);

db.exec("BEGIN");
try {
  for (const row of csv.data) {
    insert.run(
      toIsoDate(dateStringToDate(row[0])),
      row[1],
      row[2],
      parseInt(row[3]),
      parseInt(row[4]),
      row[5],
      row[6],
      parseInt(row[7]),
    );
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}

const { count } = db.prepare("SELECT COUNT(*) AS count FROM games").get() as {
  count: number;
};
console.log(`Inserted ${count} games into ${DB_FILE}`);
db.close();