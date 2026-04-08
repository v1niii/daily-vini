import os
from dotenv import load_dotenv

load_dotenv()

# Riot API regional routing:
#   account-v1 uses "americas", "europe", "asia" (broad region)
#   val-match-v1, val-ranked-v1, val-content-v1 use shard: "na", "eu", "ap", "kr", "br", "latam"

RIOT_SHARD_TO_CLUSTER = {
    "na":    "americas",
    "br":    "americas",
    "latam": "americas",
    "eu":    "europe",
    "kr":    "asia",
    "ap":    "asia",
}

RIOT_SHARD_HOSTS = {
    "na":    "https://na.api.riotgames.com",
    "eu":    "https://eu.api.riotgames.com",
    "ap":    "https://ap.api.riotgames.com",
    "kr":    "https://kr.api.riotgames.com",
    "br":    "https://br.api.riotgames.com",
    "latam": "https://latam.api.riotgames.com",
}

RIOT_CLUSTER_HOSTS = {
    "americas": "https://americas.api.riotgames.com",
    "europe":   "https://europe.api.riotgames.com",
    "asia":     "https://asia.api.riotgames.com",
}


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", os.urandom(32).hex())
    RIOT_API_KEY = os.environ.get("RIOT_API_KEY", "")
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
