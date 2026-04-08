# Daily Vini

A web-based Valorant companion app. Look up players, view regional leaderboards, check server status, and save your agent pick preferences.

## Setup

1. Clone the repo:
   ```
   git clone https://github.com/your-username/daily-vini.git
   cd daily-vini
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file from the example:
   ```
   cp .env.example .env
   ```

4. Add your Riot API key to `.env`:
   ```
   RIOT_API_KEY=RGAPI-your-key-here
   SECRET_KEY=any-random-string
   ```
   Get an API key at https://developer.riotgames.com

5. Run the app:
   ```
   python app.py
   ```

6. Open http://localhost:5000

## Features

- **Player Lookup** — Search any player by Riot ID (Name#Tag)
- **Regional Leaderboard** — Top 50 ranked players per region
- **Server Status** — Live Valorant platform status and incidents
- **Agent Picks** — Save your preferred agents in priority order

## Riot APIs Used

- `account-v1` — Player account lookup
- `val-ranked-v1` — Competitive leaderboards
- `val-content-v1` — Game content (acts, maps, agents)
- `val-status-v1` — Platform status
