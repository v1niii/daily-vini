import re
import requests
import bleach
from flask import Flask, render_template, request, jsonify, session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import CSRFProtect
from config import (
    Config,
    RIOT_SHARD_TO_CLUSTER,
    RIOT_SHARD_HOSTS,
    RIOT_CLUSTER_HOSTS,
)

app = Flask(__name__)
app.config.from_object(Config)

csrf = CSRFProtect(app)
limiter = Limiter(get_remote_address, app=app, default_limits=["60 per minute"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

VALID_NAME = re.compile(r"^[\w\s\-\.]{1,30}$")
VALID_TAG = re.compile(r"^[\w\-]{1,10}$")
VALID_REGIONS = set(RIOT_SHARD_HOSTS.keys())


def _sanitize(text: str) -> str:
    return bleach.clean(text.strip())


def _riot_headers() -> dict:
    return {"X-Riot-Token": app.config["RIOT_API_KEY"]}


def _riot_get(url: str) -> tuple[dict | list | None, int]:
    """Call a Riot API endpoint. Returns (json_body, status_code)."""
    try:
        resp = requests.get(url, headers=_riot_headers(), timeout=10)
        try:
            body = resp.json()
        except ValueError:
            body = None
        return body, resp.status_code
    except requests.RequestException as exc:
        return {"error": str(exc)}, 500


def _validate_player(name: str, tag: str) -> str | None:
    if not name or not tag:
        return "Name and tag are required."
    if not VALID_NAME.match(name):
        return "Invalid player name."
    if not VALID_TAG.match(tag):
        return "Invalid tag."
    return None


def _cluster_host(region: str) -> str:
    """Return the broad cluster host (americas/europe/asia) for account-v1."""
    cluster = RIOT_SHARD_TO_CLUSTER.get(region, "americas")
    return RIOT_CLUSTER_HOSTS[cluster]


def _shard_host(region: str) -> str:
    """Return the shard host for val-ranked, val-content, val-status."""
    return RIOT_SHARD_HOSTS.get(region, RIOT_SHARD_HOSTS["na"])


# ---------------------------------------------------------------------------
# Page routes
# ---------------------------------------------------------------------------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/player")
def player_page():
    return render_template("player.html")


@app.route("/agents")
def agents_page():
    return render_template("agents.html")


@app.route("/status")
def status_page():
    return render_template("status.html")


# ---------------------------------------------------------------------------
# API: Account lookup  (account-v1)
# ---------------------------------------------------------------------------

@app.route("/api/account/<name>/<tag>")
@limiter.limit("30 per minute")
@csrf.exempt
def api_account(name: str, tag: str):
    """GET /riot/account/v1/accounts/by-riot-id/{name}/{tag}"""
    name, tag = _sanitize(name), _sanitize(tag)
    err = _validate_player(name, tag)
    if err:
        return jsonify({"error": err}), 400

    region = request.args.get("region", "na")
    if region not in VALID_REGIONS:
        region = "na"

    host = _cluster_host(region)
    url = f"{host}/riot/account/v1/accounts/by-riot-id/{name}/{tag}"
    body, status = _riot_get(url)
    return jsonify(body), status


# ---------------------------------------------------------------------------
# API: Ranked leaderboard  (val-ranked-v1)
# ---------------------------------------------------------------------------

@app.route("/api/leaderboard/<region>")
@limiter.limit("10 per minute")
@csrf.exempt
def api_leaderboard(region: str):
    """GET /val/ranked/v1/leaderboards/by-act/{actId}"""
    region = _sanitize(region).lower()
    if region not in VALID_REGIONS:
        return jsonify({"error": "Invalid region."}), 400

    act_id = request.args.get("actId", "")
    size = request.args.get("size", "50")
    start = request.args.get("startIndex", "0")

    host = _shard_host(region)
    url = f"{host}/val/ranked/v1/leaderboards/by-act/{act_id}?size={size}&startIndex={start}"
    body, status = _riot_get(url)
    return jsonify(body), status


# ---------------------------------------------------------------------------
# API: Game content  (val-content-v1) — maps, agents, acts, etc.
# ---------------------------------------------------------------------------

@app.route("/api/content/<region>")
@limiter.limit("10 per minute")
@csrf.exempt
def api_content(region: str):
    """GET /val/content/v1/contents"""
    region = _sanitize(region).lower()
    if region not in VALID_REGIONS:
        return jsonify({"error": "Invalid region."}), 400

    locale = request.args.get("locale", "en-US")
    host = _shard_host(region)
    url = f"{host}/val/content/v1/contents?locale={locale}"
    body, status = _riot_get(url)
    return jsonify(body), status


# ---------------------------------------------------------------------------
# API: Platform status  (val-status-v1)
# ---------------------------------------------------------------------------

@app.route("/api/status/<region>")
@limiter.limit("10 per minute")
@csrf.exempt
def api_status(region: str):
    """GET /val/status/v1/platform-data"""
    region = _sanitize(region).lower()
    if region not in VALID_REGIONS:
        return jsonify({"error": "Invalid region."}), 400

    host = _shard_host(region)
    url = f"{host}/val/status/v1/platform-data"
    body, status = _riot_get(url)
    return jsonify(body), status


# ---------------------------------------------------------------------------
# Agent lock – stored in session (preference saving, no game interaction)
# ---------------------------------------------------------------------------

@app.route("/api/agent-lock", methods=["GET"])
@csrf.exempt
def get_agent_lock():
    return jsonify({"agents": session.get("locked_agents", [])})


@app.route("/api/agent-lock", methods=["POST"])
@limiter.limit("20 per minute")
def set_agent_lock():
    data = request.get_json(silent=True)
    if not data or "agents" not in data:
        return jsonify({"error": "Missing agents list."}), 400
    agents = data["agents"]
    if not isinstance(agents, list) or len(agents) > 5:
        return jsonify({"error": "Provide 1-5 agents."}), 400
    cleaned = [_sanitize(a)[:30] for a in agents if isinstance(a, str)]
    session["locked_agents"] = cleaned
    return jsonify({"status": "ok", "agents": cleaned})


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, port=5000)
