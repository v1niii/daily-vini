/* ================================================================
   Daily Vini – Server status page (val-status-v1)
   ================================================================ */

document.addEventListener("DOMContentLoaded", () => {
    const loading = document.getElementById("statusLoading");
    const errBox  = document.getElementById("statusError");

    document.getElementById("sLoad").addEventListener("click", loadStatus);

    async function loadStatus() {
        const region = document.getElementById("sRegion").value;

        DV.hide(errBox);
        DV.hide(document.getElementById("statusResults"));
        DV.show(loading);

        try {
            const data = await DV.api(`/api/status/${region}`);
            DV.hide(loading);
            renderStatus(data, region);
        } catch (err) {
            DV.hide(loading);
            errBox.textContent = err.message;
            DV.show(errBox);
        }
    }

    function renderStatus(data, region) {
        const container = document.getElementById("statusCard");
        container.innerHTML = "";

        const name = data.name || "Valorant";
        const locales = data.locales || [];

        // Overall status header
        const maintenances = data.maintenances || [];
        const incidents    = data.incidents    || [];
        const hasIssues    = maintenances.length > 0 || incidents.length > 0;

        const header = DV.el("div", "status-header");
        header.innerHTML = `
            <div class="status-indicator ${hasIssues ? "status-warn" : "status-ok"}">
                ${hasIssues ? "⚠" : "✓"}
            </div>
            <div>
                <h2>${DV.escHtml(name)} — ${region.toUpperCase()}</h2>
                <p class="muted">${hasIssues
                    ? `${maintenances.length} maintenance(s), ${incidents.length} incident(s) active`
                    : "All systems operational"
                }</p>
            </div>
        `;
        container.appendChild(header);

        // Maintenances
        if (maintenances.length) {
            container.appendChild(DV.el("h3", "section-title", "Scheduled Maintenance"));
            maintenances.forEach(m => container.appendChild(buildEventCard(m, "maintenance")));
        }

        // Incidents
        if (incidents.length) {
            container.appendChild(DV.el("h3", "section-title", "Incidents"));
            incidents.forEach(i => container.appendChild(buildEventCard(i, "incident")));
        }

        DV.show(document.getElementById("statusResults"));
    }

    function buildEventCard(event, type) {
        const card = DV.el("div", "status-event");

        const title = getLocalized(event.titles) || "Untitled";
        const severity = event.maintenance_status || event.incident_severity || "unknown";

        let updatesHtml = "";
        (event.updates || []).forEach(u => {
            const msg = getLocalized(u.translations) || "No details.";
            const time = u.created_at ? new Date(u.created_at).toLocaleString() : "";
            updatesHtml += `
                <div class="status-update">
                    <span class="status-update-time">${DV.escHtml(time)}</span>
                    <span>${DV.escHtml(msg)}</span>
                </div>
            `;
        });

        card.innerHTML = `
            <div class="status-event-header">
                <span class="badge ${type === "incident" ? "badge-incident" : "badge-maint"}">${type.toUpperCase()}</span>
                <span class="badge">${DV.escHtml(severity)}</span>
            </div>
            <h4>${DV.escHtml(title)}</h4>
            ${updatesHtml || '<p class="muted">No updates yet.</p>'}
        `;

        return card;
    }

    function getLocalized(arr) {
        if (!arr || !arr.length) return "";
        const en = arr.find(t => t.locale === "en_US") || arr[0];
        return en.content || en.title || "";
    }
});
