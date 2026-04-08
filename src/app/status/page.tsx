"use client";

import { useState } from "react";
import RegionSelect from "@/components/RegionSelect";

interface StatusUpdate {
  created_at: string;
  translations: { locale: string; content: string }[];
}

interface StatusEvent {
  titles: { locale: string; content: string }[];
  maintenance_status?: string;
  incident_severity?: string;
  updates: StatusUpdate[];
}

interface PlatformData {
  id: string;
  name: string;
  maintenances: StatusEvent[];
  incidents: StatusEvent[];
}

function getLocalized(arr: { locale: string; content?: string; title?: string }[]): string {
  if (!arr?.length) return "";
  const en = arr.find((t) => t.locale === "en_US") || arr[0];
  return en.content || en.title || "";
}

export default function StatusPage() {
  const [region, setRegion] = useState("na");
  const [data, setData] = useState<PlatformData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadStatus() {
    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await fetch(`/api/status?region=${region}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load status.");
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const hasIssues =
    data && (data.maintenances.length > 0 || data.incidents.length > 0);

  return (
    <>
      <section className="section">
        <h1 className="page-title">
          Server <span className="accent">Status</span>
        </h1>
        <p className="page-sub">
          Check real-time Valorant platform status and incidents for any region.
        </p>

        <div className="controls-row">
          <RegionSelect value={region} onChange={setRegion} />
          <button className="btn btn-primary" onClick={loadStatus}>
            Check Status
          </button>
        </div>
      </section>

      {loading && <div className="loader">Checking status...</div>}
      {error && <div className="error-box">{error}</div>}

      {data && (
        <section className="section">
          <div className="status-header">
            <div className={`status-indicator ${hasIssues ? "status-warn" : "status-ok"}`}>
              {hasIssues ? "⚠" : "✓"}
            </div>
            <div>
              <h2>
                {data.name || "Valorant"} — {region.toUpperCase()}
              </h2>
              <p className="muted">
                {hasIssues
                  ? `${data.maintenances.length} maintenance(s), ${data.incidents.length} incident(s) active`
                  : "All systems operational"}
              </p>
            </div>
          </div>

          {data.maintenances.length > 0 && (
            <>
              <h3 className="section-title">Scheduled Maintenance</h3>
              {data.maintenances.map((m, i) => (
                <EventCard key={`m-${i}`} event={m} type="maintenance" />
              ))}
            </>
          )}

          {data.incidents.length > 0 && (
            <>
              <h3 className="section-title">Incidents</h3>
              {data.incidents.map((inc, i) => (
                <EventCard key={`i-${i}`} event={inc} type="incident" />
              ))}
            </>
          )}
        </section>
      )}
    </>
  );
}

function EventCard({ event, type }: { event: StatusEvent; type: string }) {
  const title = getLocalized(event.titles) || "Untitled";
  const severity =
    event.maintenance_status || event.incident_severity || "unknown";

  return (
    <div className="status-event">
      <div className="status-event-header">
        <span className={`badge ${type === "incident" ? "badge-incident" : "badge-maint"}`}>
          {type.toUpperCase()}
        </span>
        <span className="badge">{severity}</span>
      </div>
      <h4>{title}</h4>
      {event.updates.length > 0 ? (
        event.updates.map((u, i) => {
          const msg = getLocalized(u.translations) || "No details.";
          const time = u.created_at
            ? new Date(u.created_at).toLocaleString()
            : "";
          return (
            <div key={i} className="status-update">
              <span className="status-update-time">{time}</span>
              <span>{msg}</span>
            </div>
          );
        })
      ) : (
        <p className="muted">No updates yet.</p>
      )}
    </div>
  );
}
