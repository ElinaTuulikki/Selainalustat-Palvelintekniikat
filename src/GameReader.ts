import { dateStringToDate } from "./utilities.js";
import { Result } from "./Result.js";
import type { GameData } from "./GameData.js";
import type { DataReader } from "./DataReader.js";
import { CsvReader } from "./CsvReader.js";
import { SqliteReader } from "./SqliteReader.js";


export class GameReader {
  static csvData(fileName: string): GameReader {
    return new GameReader(new CsvReader(fileName));
  }

  static sqliteData(fileName: string): GameReader {
    return new GameReader(new SqliteReader(fileName));
  }

  games: GameData[] = [];
  constructor(public reader: DataReader) {}

  async load(): Promise<void> {
    await this.reader.read();
    this.games = this.reader.data.map((row: string[]): GameData => {
      return [
        dateStringToDate(row[0]),
        row[1],
        row[2],
        parseInt(row[3]),
        parseInt(row[4]),
        row[5] as Result,
        row[6],
        parseInt(row[7]),
      ];
    });
  }
}
