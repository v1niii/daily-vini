from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import requests

VALID_REGIONS = {"na", "eu", "ap", "kr", "br", "latam"}

SHARD_HOSTS = {
    "na": "na", "eu": "eu", "ap": "ap",
    "kr": "kr", "br": "br", "latam": "latam",
}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        region = params.get("region", ["na"])[0].strip().lower()
        act_id = params.get("actId", [""])[0].strip()
        size = params.get("size", ["50"])[0]
        start = params.get("startIndex", ["0"])[0]

        if region not in VALID_REGIONS:
            return self._json(400, {"error": "Invalid region."})
        if not act_id:
            return self._json(400, {"error": "actId is required."})

        shard = SHARD_HOSTS[region]
        url = f"https://{shard}.api.riotgames.com/val/ranked/v1/leaderboards/by-act/{act_id}?size={size}&startIndex={start}"

        try:
            resp = requests.get(url, headers={"X-Riot-Token": os.environ["RIOT_API_KEY"]}, timeout=10)
            text = resp.text
            if not text:
                return self._json(502, {"error": "Empty response from Riot API."})
            return self._json(resp.status_code, json.loads(text))
        except Exception as e:
            return self._json(500, {"error": str(e)})

    def _json(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
