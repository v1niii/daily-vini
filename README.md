# Daily Vini

A web-based Valorant companion app. View regional leaderboards, check server status, and save your agent pick preferences.

## Setup

1. Clone the repo:
   ```
   git clone https://github.com/your-username/daily-vini.git
   cd daily-vini
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file:
   ```
   RIOT_API_KEY=RGAPI-your-key-here
   ```
   Get an API key at https://developer.riotgames.com

4. Run the dev server:
   ```
   npm run dev
   ```

5. Open http://localhost:3000

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to https://vercel.com and import the repo
3. Add `RIOT_API_KEY` as an environment variable
4. Deploy

## Features

- **Regional Leaderboard** — Top 50 ranked players per region
- **Server Status** — Live Valorant platform status and incidents
- **Agent Picks** — Save your preferred agents in priority order

## Tech Stack

- **Frontend:** Next.js (React/TypeScript)
- **Backend:** Python serverless functions (Vercel)
- **Deployment:** Vercel

## Riot APIs Used

- `val-ranked-v1` — Competitive leaderboards
- `val-content-v1` — Game content (acts, maps, agents)
- `val-status-v1` — Platform status
