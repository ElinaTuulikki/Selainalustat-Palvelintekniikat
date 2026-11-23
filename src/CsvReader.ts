import fs from "fs/promises";
import type { DataReader } from "./DataReader.js";

export class CsvReader implements DataReader {
  data: string[][] = [];

  constructor(public filename: string) {}
  
  async read(): Promise<void> {
    const content = await fs.readFile(this.filename, { encoding: "utf-8" });
    this.data = content
      .split(/\r?\n/)
      .filter((line: string): boolean => line.trim() !== "")
      .slice(1) 
      .map((row: string): string[] => row.split(","));
  }
}