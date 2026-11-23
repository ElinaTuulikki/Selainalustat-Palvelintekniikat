import { getJson } from "./api.js";
import { renderTable } from "./render.js";
import type { TeamSummary, HomeAwayResult, AttendanceResult } from "./types.js";
import {
  drawResultsChart,
  drawGoalsChart,
  drawHomeAwayChart,
  drawTrendChart,
  drawAverageChart,
} from "./charts.js";
import { applyTeamTheme } from "./teams.js";

const DEFAULT_TEAM = "Tappara";

function table(id: string): HTMLTableElement {
  return document.getElementById(id) as HTMLTableElement;
}

let homeAwayData: HomeAwayResult | null = null;

let latestRequest = 0;

async function showTeam(teamName: string): Promise<AttendanceResult> {
  const requestId = ++latestRequest;
  applyTeamTheme(teamName);
  const team = encodeURIComponent(teamName);

  const [summary, attendance] = await Promise.all([
    getJson<TeamSummary>(`/api/summary?team=${team}`),
    getJson<AttendanceResult>(`/api/attendance?team=${team}`),
  ]);

  if (requestId !== latestRequest) return attendance;

  document.getElementById("page-title")!.textContent =
    `${teamName} - kausi 2025-2026`;
  document.title = `${teamName} - Liiga 2025-2026`;

  drawResultsChart(summary);
  drawGoalsChart(summary);
  drawTrendChart(attendance, teamName);
  drawAverageChart(attendance, teamName);

  renderTable(table("summary-table"), ["Tilasto", "Arvo"], [
    ["Pelatut ottelut", summary.games],
    ["Voitot", summary.wins],
    ["Tappiot", summary.losses],
    ["Kotivoitot", summary.homeWins],
    ["Vierasvoitot", summary.awayWins],
    ["Tehdyt maalit", summary.goalsFor],
    ["Päästetyt maalit", summary.goalsAgainst],
    ["Tehdyt maalit / ottelu", summary.avgGoalsFor.toFixed(2)],
    ["Päästetyt maalit / ottelu", summary.avgGoalsAgainst.toFixed(2)],
  ]);

  renderTable(
    table("average-table"),
    ["Joukkue", "Keskiyleisömäärä"],
    attendance.averageByTeam.map((a) => [a.team, a.average]),
  );

  renderTable(
    table("crowds-table"),
    ["Päivä", "Koti", "Vieras", "Katsojat"],
    attendance.biggestCrowds.map((c) => [c.date, c.home, c.away, c.attendance]),
  );

  if (homeAwayData) drawHomeAwayChart(homeAwayData);

  return attendance;
}

async function showLeague(): Promise<void> {
  const homeAway = await getJson<HomeAwayResult>("/api/home-away");
  homeAwayData = homeAway;

  drawHomeAwayChart(homeAway);
  renderTable(table("home-away-table"), ["Tulos", "Ottelut"], [
    ["Kotivoitot", homeAway.homeWins],
    ["Vierasvoitot", homeAway.awayWins],
  ]);
}

function fillTeamSelect(teams: string[], selected: string): void {
  const select = document.getElementById("team-select") as HTMLSelectElement;
  select.replaceChildren();

  for (const name of [...teams].sort((a, b) => a.localeCompare(b, "fi"))) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  }
  select.value = selected;

  select.addEventListener("change", () => {
    showTeam(select.value).catch(showError);
  });
}

function showError(error: unknown): void {
  console.error(error);
  if (document.getElementById("error-message")) return;
  document.body.insertAdjacentHTML(
    "beforeend",
    '<p id="error-message">Tietojen lataus epäonnistui.</p>',
  );
}

async function main(): Promise<void> {
  const [attendance] = await Promise.all([
    showTeam(DEFAULT_TEAM),
    showLeague(),
  ]);

  fillTeamSelect(
    attendance.averageByTeam.map((a) => a.team),
    DEFAULT_TEAM,
  );
}

main().catch(showError);