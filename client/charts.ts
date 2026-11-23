import type { ChartConfiguration } from "chart.js";
import type { TeamSummary, HomeAwayResult, AttendanceResult } from "./types.js";

// Reads the current team colors from the CSS variables set by applyTeamTheme().
// Called every time a chart is drawn, so charts always use the selected team's colors.
function themeColors(): { primary: string; secondary: string } {
  const style = getComputedStyle(document.documentElement);
  return {
    primary: style.getPropertyValue("--primary").trim(),
    secondary: style.getPropertyValue("--secondary").trim(),
  };
}

// Draws one chart on a canvas. Any chart already on that canvas is removed
// first, so this function can be called again when the team changes.
function draw(canvasId: string, config: ChartConfiguration): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  Chart.getChart(canvas)?.destroy();
  new Chart(canvas, config);
}

export function drawResultsChart(summary: TeamSummary): void {
  const { primary, secondary } = themeColors();
  draw("results-chart", {
    type: "bar",
    data: {
      labels: ["Kotivoitot", "Vierasvoitot", "Tappiot"],
      datasets: [
        {
          data: [summary.homeWins, summary.awayWins, summary.losses],
          backgroundColor: [primary, secondary, "#9aa5b8"],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${summary.team}: voitot ja tappiot` },
      },
      scales: { y: { beginAtZero: true } },
    },
  });
}

export function drawGoalsChart(summary: TeamSummary): void {
  const { primary, secondary } = themeColors();
  draw("goals-chart", {
    type: "bar",
    data: {
      labels: ["Tehdyt maalit / ottelu", "Päästetyt maalit / ottelu"],
      datasets: [
        {
          data: [
            Number(summary.avgGoalsFor.toFixed(2)),
            Number(summary.avgGoalsAgainst.toFixed(2)),
          ],
          backgroundColor: [primary, secondary],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${summary.team}: maalikeskiarvot` },
      },
      scales: { y: { beginAtZero: true } },
    },
  });
}

export function drawHomeAwayChart(homeAway: HomeAwayResult): void {
  const { primary, secondary } = themeColors();
  draw("home-away-chart", {
    type: "pie",
    data: {
      labels: ["Kotivoitot", "Vierasvoitot"],
      datasets: [
        {
          data: [homeAway.homeWins, homeAway.awayWins],
          backgroundColor: [primary, secondary],
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: "Kotivoitot vs. vierasvoitot (koko Liiga)" },
      },
    },
  });
}

export function drawTrendChart(attendance: AttendanceResult, team: string): void {
  const { secondary } = themeColors();
  draw("trend-chart", {
    type: "line",
    data: {
      labels: attendance.trend.map((t) => t.date),
      datasets: [
        {
          label: "Katsojat",
          data: attendance.trend.map((t) => t.attendance),
          borderColor: secondary,
          backgroundColor: secondary,
          tension: 0.25,
        },
      ],
    },
    options: {
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: `${team}: yleisömäärä kotiotteluissa` },
      },
    },
  });
}

export function drawAverageChart(attendance: AttendanceResult, team: string): void {
  const { primary, secondary } = themeColors();
  draw("average-chart", {
    type: "bar",
    data: {
      labels: attendance.averageByTeam.map((a) => a.team),
      datasets: [
        {
          data: attendance.averageByTeam.map((a) => a.average),
          // The chosen team uses the accent color, everyone else the main color
          backgroundColor: attendance.averageByTeam.map((a) =>
            a.team === team ? secondary : primary,
          ),
        },
      ],
    },
    options: {
      indexAxis: "y", // horizontal bars: team names are easier to read
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Keskimääräinen yleisömäärä kotiotteluissa" },
      },
    },
  });
}