from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import os
import requests

VALID_REGIONS = {"na", "eu", "ap", "kr", "br", "latam"}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        params = parse_qs(urlparse(self.path).query)
        region = params.get("region", ["na"])[0].strip().lower()

        if region not in VALID_REGIONS:
            return self._json(400, {"error": "Invalid region."})

        url = f"https://{region}.api.riotgames.com/val/status/v1/platform-data"

        try:
            resp = requests.get(url, headers={"X-Riot-Token": os.environ["RIOT_API_KEY"]}, timeout=10)
            return self._json(resp.status_code, resp.json())
        except Exception as e:
            return self._json(500, {"error": str(e)})

    def _json(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
