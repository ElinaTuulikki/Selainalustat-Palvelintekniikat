CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL, -- ISO format (YYYY-MM-DD)
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    home_goals INTEGER NOT NULL CHECK (home_goals >= 0),
    away_goals INTEGER NOT NULL CHECK (away_goals >= 0),
    result TEXT NOT NULL CHECK (result IN ('K','KJ','RLK','V','VJ','RLV')),
    referee TEXT,
    attendance INTEGER
);

CREATE INDEX IF NOT EXISTS idx_games_home ON games(home_team);
CREATE INDEX IF NOT EXISTS idx_games_away ON games(away_team);
