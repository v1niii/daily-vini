/* ================================================================
   Daily Vini – Home page (quick search + leaderboard)
   Riot official API
   ================================================================ */

document.addEventListener("DOMContentLoaded", () => {
    let currentActId = "";

    // Quick search → redirect to player page
    const form = document.getElementById("quickSearch");
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("heroName").value.trim();
        const tag  = document.getElementById("heroTag").value.trim();
        const reg  = document.getElementById("heroRegion").value;
        if (name && tag) {
            window.location.href = `/player?name=${encodeURIComponent(name)}&tag=${encodeURIComponent(tag)}&region=${reg}`;
        }
    });

    // Fetch current act ID from val-content-v1 for leaderboards
    async function fetchCurrentAct(region) {
        try {
            const data = await DV.api(`/api/content/${region}`);
            const acts = data.acts || [];
            // Find the active act
            const active = acts.find(a => a.isActive);
            return active ? active.id : "";
        } catch {
            return "";
        }
    }

    // Leaderboard
    document.getElementById("lbLoad").addEventListener("click", async () => {
        const region = document.getElementById("lbRegion").value;
        const wrap   = document.getElementById("lbResults");
        wrap.innerHTML = '<div class="loader">Loading leaderboard...</div>';

        try {
            // Get current act ID first
            if (!currentActId) {
                currentActId = await fetchCurrentAct(region);
            }
            if (!currentActId) {
                wrap.innerHTML = '<div class="error-box">Could not determine current act. Try again.</div>';
                return;
            }

            const data = await DV.api(`/api/leaderboard/${region}?actId=${currentActId}&size=50&startIndex=0`);
            const players = data.players || [];

            if (!players.length) {
                wrap.innerHTML = '<p class="muted">No leaderboard data available for this region.</p>';
                return;
            }

            let html = `<table class="data-table">
                <thead><tr>
                    <th>#</th><th>Player</th><th>Rank Rating</th><th>Wins</th>
                </tr></thead><tbody>`;

            players.forEach((p) => {
                const name = DV.escHtml(p.gameName || "Hidden");
                const tag  = DV.escHtml(p.tagLine  || "");
                const display = tag ? `${name}#${tag}` : name;
                html += `<tr>
                    <td>${p.leaderboardRank ?? "—"}</td>
                    <td>${display}</td>
                    <td>${p.rankedRating ?? "—"}</td>
                    <td>${p.numberOfWins ?? "—"}</td>
                </tr>`;
            });

            html += "</tbody></table>";
            wrap.innerHTML = html;
        } catch (err) {
            wrap.innerHTML = `<div class="error-box">${DV.escHtml(err.message)}</div>`;
        }
    });
});
