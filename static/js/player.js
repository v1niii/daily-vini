/* ================================================================
   Daily Vini – Player lookup (account-v1 only)
   ================================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const form    = document.getElementById("playerSearch");
    const loading = document.getElementById("playerLoading");
    const errBox  = document.getElementById("playerError");

    // Pre-fill from query params (from home search)
    const params = new URLSearchParams(window.location.search);
    if (params.get("name"))   document.getElementById("pName").value   = params.get("name");
    if (params.get("tag"))    document.getElementById("pTag").value    = params.get("tag");
    if (params.get("region")) document.getElementById("pRegion").value = params.get("region");

    if (params.get("name") && params.get("tag")) doSearch();

    form.addEventListener("submit", (e) => { e.preventDefault(); doSearch(); });

    async function doSearch() {
        const name   = document.getElementById("pName").value.trim();
        const tag    = document.getElementById("pTag").value.trim();
        const region = document.getElementById("pRegion").value;

        DV.hide(document.getElementById("accountSection"));
        DV.hide(errBox);
        DV.show(loading);

        try {
            const acct = await DV.api(
                `/api/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?region=${region}`
            );

            DV.hide(loading);

            if (!acct.puuid) throw new Error("Player not found. Check name, tag and region.");

            // Display account info
            document.getElementById("pDisplayName").textContent =
                `${acct.gameName || name}#${acct.tagLine || tag}`;
            document.getElementById("pRegionBadge").textContent = region.toUpperCase();

            // Account details grid
            const details = document.getElementById("accountDetails");
            details.innerHTML = `
                <div class="info-item">
                    <span class="info-label">Riot ID</span>
                    <span class="info-value">${DV.escHtml(acct.gameName || name)}#${DV.escHtml(acct.tagLine || tag)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">PUUID</span>
                    <span class="info-value info-mono">${DV.escHtml(acct.puuid)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Region</span>
                    <span class="info-value">${region.toUpperCase()}</span>
                </div>
            `;

            DV.show(document.getElementById("accountSection"));
        } catch (e) {
            DV.hide(loading);
            errBox.textContent = e.message;
            DV.show(errBox);
        }
    }
});
